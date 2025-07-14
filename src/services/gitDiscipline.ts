import { EventEmitter } from 'events';
import { GitDisciplineConfig } from '../types/orchestration';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import Handlebars from 'handlebars';

const execAsync = promisify(exec);

export interface GitStats {
  totalCommits: number;
  commitsByAgent: Record<string, number>;
  averageCommitInterval: number; // minutes
  branchesCreated: number;
  tagsCreated: number;
  lastCommitTime?: Date;
  complianceRate: number; // percentage
}

export interface CommitInfo {
  agentId: string;
  agentRole: string;
  sessionId: string;
  changes: string[];
  tests?: string[];
  blockers?: string[];
  nextSteps?: string[];
}

export class GitDisciplineService extends EventEmitter {
  private config: GitDisciplineConfig;
  private projectPath: string;
  private stats: GitStats = {
    totalCommits: 0,
    commitsByAgent: {},
    averageCommitInterval: 0,
    branchesCreated: 0,
    tagsCreated: 0,
    complianceRate: 100,
  };
  private lastCommitTimes: Map<string, Date> = new Map();
  private autoCommitIntervals: Map<string, NodeJS.Timeout> = new Map();
  private commitTemplate: HandlebarsTemplateDelegate;

  constructor(config: GitDisciplineConfig, projectPath: string) {
    super();
    this.config = config;
    this.projectPath = projectPath;

    // Load commit template
    const templatePath = path.join(__dirname, '../../templates/orchestration/git-commit.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.commitTemplate = Handlebars.compile(templateContent);
  }

  /**
   * Initialize git discipline for the project
   */
  async initialize(): Promise<void> {
    console.log(chalk.blue('Initializing git discipline...'));

    // Ensure git is initialized
    await this.ensureGitRepo();

    // Set up git config
    await this.configureGit();

    // Create hooks directory
    await this.setupGitHooks();

    console.log(chalk.green('Git discipline initialized'));
  }

  /**
   * Ensure project is a git repository
   */
  private async ensureGitRepo(): Promise<void> {
    const gitPath = path.join(this.projectPath, '.git');
    if (!(await fs.pathExists(gitPath))) {
      console.log(chalk.yellow('Initializing git repository...'));
      await execAsync('git init', { cwd: this.projectPath });
    }
  }

  /**
   * Configure git settings
   */
  private async configureGit(): Promise<void> {
    try {
      // Set up user info if not configured
      await execAsync('git config user.name "Context Forge Orchestrator"', {
        cwd: this.projectPath,
      });
      await execAsync('git config user.email "orchestrator@context-forge.ai"', {
        cwd: this.projectPath,
      });
    } catch (error) {
      // Ignore if already configured
    }
  }

  /**
   * Set up git hooks
   */
  private async setupGitHooks(): Promise<void> {
    const hooksPath = path.join(this.projectPath, '.git', 'hooks');
    await fs.ensureDir(hooksPath);

    if (this.config.requireTests) {
      // Create pre-commit hook for test validation
      const preCommitHook = `#!/bin/bash
# Pre-commit hook to ensure tests pass

echo "Running tests before commit..."
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed! Commit aborted."
  exit 1
fi

echo "Tests passed. Proceeding with commit."
exit 0
`;

      const hookPath = path.join(hooksPath, 'pre-commit');
      await fs.writeFile(hookPath, preCommitHook);
      await fs.chmod(hookPath, 0o755);
    }
  }

  /**
   * Start auto-commit for an agent
   */
  startAutoCommit(agentId: string, agentRole: string, sessionId: string): void {
    if (!this.config.enabled) {
      return;
    }

    // Clear existing interval
    this.stopAutoCommit(agentId);

    // Set up new interval
    const interval = setInterval(
      async () => {
        await this.performAutoCommit(agentId, agentRole, sessionId);
      },
      this.config.autoCommitInterval * 60 * 1000
    );

    this.autoCommitIntervals.set(agentId, interval);

    console.log(
      chalk.green(
        `Auto-commit enabled for ${agentId} (every ${this.config.autoCommitInterval} minutes)`
      )
    );
  }

  /**
   * Stop auto-commit for an agent
   */
  stopAutoCommit(agentId: string): void {
    const interval = this.autoCommitIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.autoCommitIntervals.delete(agentId);
    }
  }

  /**
   * Perform auto-commit
   */
  private async performAutoCommit(
    agentId: string,
    agentRole: string,
    sessionId: string
  ): Promise<void> {
    try {
      // Check for changes
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: this.projectPath,
      });

      if (!statusOutput.trim()) {
        console.log(chalk.gray(`No changes to commit for ${agentId}`));
        return;
      }

      // Get list of changes
      const changes = statusOutput
        .trim()
        .split('\n')
        .map((line) => line.substring(3)); // Remove status prefix

      // Stage all changes
      await execAsync('git add -A', { cwd: this.projectPath });

      // Create commit message
      const commitInfo: CommitInfo = {
        agentId,
        agentRole,
        sessionId,
        changes: changes.slice(0, 5), // Limit to 5 items
      };

      const commitMessage = this.generateCommitMessage(commitInfo);

      // Commit
      await execAsync(`git commit -m "${commitMessage}"`, {
        cwd: this.projectPath,
      });

      // Update stats
      this.updateCommitStats(agentId);

      console.log(chalk.green(`✓ Auto-commit completed for ${agentId}`));

      // Emit event
      this.emit('commit', {
        agentId,
        timestamp: new Date(),
        changes: changes.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('nothing to commit')) {
        console.error(chalk.red(`Auto-commit failed for ${agentId}: ${errorMessage}`));
        this.emit('commit-failed', { agentId, error: errorMessage });
      }
    }
  }

  /**
   * Generate commit message from template
   */
  private generateCommitMessage(info: CommitInfo): string {
    const context = {
      commitType: 'Progress',
      taskDescription: `Auto-commit by ${info.agentId}`,
      agentId: info.agentId,
      agentRole: info.agentRole,
      sessionId: info.sessionId,
      timestamp: new Date().toISOString(),
      commitInterval: this.config.autoCommitInterval,
      changes: info.changes,
      tests: info.tests,
      blockers: info.blockers,
      nextSteps: info.nextSteps,
    };

    // Use custom format if provided
    if (this.config.commitMessageFormat) {
      return this.config.commitMessageFormat
        .replace('$TASK', context.taskDescription)
        .replace('$DESCRIPTION', info.changes.join(', '))
        .replace('$AGENT', info.agentId)
        .replace('$TIMESTAMP', context.timestamp);
    }

    return this.commitTemplate(context);
  }

  /**
   * Create feature branch
   */
  async createFeatureBranch(branchName: string, agentId: string): Promise<string> {
    const sanitizedName = branchName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    const fullBranchName = `feature/${sanitizedName}`;

    try {
      await execAsync(`git checkout -b ${fullBranchName}`, {
        cwd: this.projectPath,
      });

      this.stats.branchesCreated++;

      console.log(chalk.green(`Created branch: ${fullBranchName}`));

      this.emit('branch-created', {
        branch: fullBranchName,
        agentId,
        timestamp: new Date(),
      });

      return fullBranchName;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        // Switch to existing branch
        await execAsync(`git checkout ${fullBranchName}`, {
          cwd: this.projectPath,
        });
        return fullBranchName;
      }
      throw error;
    }
  }

  /**
   * Tag stable version
   */
  async tagStableVersion(tagName: string, message: string, agentId: string): Promise<void> {
    if (!this.config.tagStrategy) {
      return;
    }

    const tagPrefix = this.config.tagStrategy === 'stable' ? 'stable' : 'v';
    const fullTag = `${tagPrefix}-${tagName}-${Date.now()}`;

    try {
      await execAsync(`git tag -a ${fullTag} -m "${message}"`, { cwd: this.projectPath });

      this.stats.tagsCreated++;

      console.log(chalk.green(`Created tag: ${fullTag}`));

      this.emit('tag-created', {
        tag: fullTag,
        agentId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(chalk.red(`Failed to create tag: ${error}`));
    }
  }

  /**
   * Check compliance with commit interval
   */
  checkCompliance(agentId: string): boolean {
    const lastCommit = this.lastCommitTimes.get(agentId);
    if (!lastCommit) {
      return true; // No commits yet
    }

    const timeSinceLastCommit = Date.now() - lastCommit.getTime();
    const maxInterval = this.config.autoCommitInterval * 60 * 1000 * 1.5; // 50% grace period

    return timeSinceLastCommit <= maxInterval;
  }

  /**
   * Update commit statistics
   */
  private updateCommitStats(agentId: string): void {
    this.stats.totalCommits++;
    this.stats.commitsByAgent[agentId] = (this.stats.commitsByAgent[agentId] || 0) + 1;

    const now = new Date();
    const lastCommit = this.lastCommitTimes.get(agentId);

    if (lastCommit) {
      const interval = (now.getTime() - lastCommit.getTime()) / (60 * 1000);
      this.updateAverageInterval(interval);
    }

    this.lastCommitTimes.set(agentId, now);
    this.stats.lastCommitTime = now;
  }

  /**
   * Update average commit interval
   */
  private updateAverageInterval(interval: number): void {
    const totalIntervals = this.stats.totalCommits - 1;
    if (totalIntervals > 0) {
      this.stats.averageCommitInterval =
        (this.stats.averageCommitInterval * (totalIntervals - 1) + interval) / totalIntervals;
    }
  }

  /**
   * Get git statistics
   */
  getStats(): GitStats {
    // Calculate compliance rate
    let compliantAgents = 0;
    let totalAgents = 0;

    for (const [agentId] of this.autoCommitIntervals) {
      totalAgents++;
      if (this.checkCompliance(agentId)) {
        compliantAgents++;
      }
    }

    this.stats.complianceRate = totalAgents > 0 ? (compliantAgents / totalAgents) * 100 : 100;

    return { ...this.stats };
  }

  /**
   * Get recent commits
   */
  async getRecentCommits(limit: number = 10): Promise<any[]> {
    try {
      const { stdout } = await execAsync(
        `git log --oneline -${limit} --pretty=format:'%h|%s|%an|%ar'`,
        { cwd: this.projectPath }
      );

      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, message, author, time] = line.split('|');
          return { hash, message, author, time };
        });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectPath,
      });
      return stdout.trim();
    } catch (error) {
      return 'main';
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Stop all auto-commit intervals
    for (const [agentId] of this.autoCommitIntervals) {
      this.stopAutoCommit(agentId);
    }
  }
}

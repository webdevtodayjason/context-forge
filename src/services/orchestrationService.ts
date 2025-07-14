import { TmuxManager } from './tmuxManager';
import { AgentCommunicationService } from './agentCommunication';
import { SelfSchedulingService } from './selfScheduler';
import { GitDisciplineService } from './gitDiscipline';
import {
  OrchestrationConfig,
  OrchestrationStatus,
  AgentSession,
  AgentConfig,
  AgentBriefing,
  OrchestrationPhase,
  OrchestrationTask,
  OrchestrationError,
  TeamStructure,
  TmuxWindowConfig,
  AgentRole,
  AgentMessage,
} from '../types/orchestration';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class OrchestrationService {
  private tmux: TmuxManager;
  private communication: AgentCommunicationService;
  private scheduler: SelfSchedulingService;
  private gitDiscipline: GitDisciplineService;
  private orchestrationId: string;
  private agents: Map<string, AgentSession> = new Map();
  private errors: OrchestrationError[] = [];
  private status: OrchestrationStatus;
  private projectPath: string;
  private config: OrchestrationConfig;
  private briefingTemplate: HandlebarsTemplateDelegate;

  constructor(projectPath: string, config: OrchestrationConfig) {
    this.tmux = new TmuxManager();
    this.orchestrationId = uuidv4();
    this.projectPath = projectPath;
    this.config = config;

    // Initialize services
    this.communication = new AgentCommunicationService(config.communicationModel);
    this.scheduler = new SelfSchedulingService(config.selfScheduling, this.tmux);
    this.gitDiscipline = new GitDisciplineService(config.gitDiscipline, projectPath);

    // Load briefing template
    const templatePath = path.join(__dirname, '../../templates/orchestration/agent-briefing.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.briefingTemplate = Handlebars.compile(templateContent);

    this.status = {
      id: this.orchestrationId,
      projectName: config.projectName,
      startTime: new Date(),
      status: 'initializing',
      completedPhases: [],
      activeAgents: [],
      metrics: {
        totalAgents: 0,
        activeAgents: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        gitCommits: 0,
        linesOfCodeWritten: 0,
        testsWritten: 0,
        testsPassing: 0,
        blockers: 0,
        uptime: '0h',
      },
      lastUpdate: new Date(),
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for integrated services
   */
  private setupEventListeners(): void {
    // Communication events
    this.communication.on('message', (message: AgentMessage) => {
      console.log(chalk.gray(`[${message.fromAgent} → ${message.toAgent}] ${message.type}`));
    });

    this.communication.on('escalation', (message: AgentMessage) => {
      console.log(chalk.red(`🚨 Escalation from ${message.fromAgent}: ${message.content}`));
      this.recordError({
        timestamp: new Date(),
        agentId: message.fromAgent,
        type: 'communication',
        message: `Escalation: ${message.content}`,
        severity: 'warning',
        requiresIntervention: true,
      });
    });

    // Scheduler events
    this.scheduler.on('check-in', async (data) => {
      console.log(chalk.blue(`Check-in from ${data.agentId}`));
      await this.handleAgentCheckIn(data.agentId);
    });

    this.scheduler.on('schedule-failed', (data) => {
      this.recordError({
        timestamp: new Date(),
        agentId: data.schedule.agentId,
        type: 'scheduling',
        message: `Schedule failed: ${data.error}`,
        severity: 'error',
        requiresIntervention: false,
      });
    });

    // Git discipline events
    this.gitDiscipline.on('commit', (data) => {
      this.status.metrics.gitCommits++;
      console.log(chalk.green(`✓ Git commit by ${data.agentId}`));
    });

    this.gitDiscipline.on('commit-failed', (data) => {
      this.recordError({
        timestamp: new Date(),
        agentId: data.agentId,
        type: 'git',
        message: `Commit failed: ${data.error.message}`,
        severity: 'warning',
        requiresIntervention: false,
      });
    });
  }

  /**
   * Initialize and deploy the orchestration
   */
  async deploy(): Promise<void> {
    console.log(chalk.blue('🚀 Deploying orchestration...'));

    // Check tmux availability
    const tmuxAvailable = await this.tmux.checkTmuxAvailable();
    if (!tmuxAvailable) {
      throw new Error('tmux is not installed. Please install tmux to use orchestration features.');
    }

    // Create orchestration session
    const sessionName = `cf-${this.config.projectName.toLowerCase().replace(/\s+/g, '-')}`;

    if (await this.tmux.sessionExists(sessionName)) {
      console.log(chalk.yellow(`Session ${sessionName} already exists. Using existing session.`));
    } else {
      await this.tmux.createSession(sessionName, this.projectPath);
    }

    // Deploy agents based on strategy
    if (this.config.strategy === 'big-bang') {
      await this.deployAllAgents(sessionName);
    } else if (this.config.strategy === 'phased') {
      await this.deployPhasedAgents(sessionName);
    } else {
      await this.deployAdaptiveAgents(sessionName);
    }

    // Initialize git discipline if enabled
    if (this.config.gitDiscipline.enabled) {
      await this.gitDiscipline.initialize();
    }

    // Self-scheduling is initialized per-agent during deployment

    this.status.status = 'running';
    await this.saveStatus();
  }

  /**
   * Deploy all agents at once
   */
  private async deployAllAgents(sessionName: string): Promise<void> {
    const team = this.config.teamStructure;

    // Deploy orchestrator
    await this.deployAgent(sessionName, team.orchestrator, 0);

    // Deploy project managers
    let windowIndex = 1;
    for (const pm of team.projectManagers) {
      await this.deployAgent(sessionName, pm, windowIndex++);
    }

    // Deploy developers
    for (const dev of team.developers) {
      await this.deployAgent(sessionName, dev, windowIndex++);
    }

    // Deploy QA engineers
    if (team.qaEngineers) {
      for (const qa of team.qaEngineers) {
        await this.deployAgent(sessionName, qa, windowIndex++);
      }
    }

    // Deploy other roles
    const otherRoles = [
      team.devops,
      team.codeReviewers,
      team.researchers,
      team.documentationWriters,
    ]
      .filter(Boolean)
      .flat();

    for (const agent of otherRoles) {
      if (agent) {
        await this.deployAgent(sessionName, agent, windowIndex++);
      }
    }
  }

  /**
   * Deploy agents in phases
   */
  private async deployPhasedAgents(sessionName: string): Promise<void> {
    // Start with orchestrator and first PM
    const team = this.config.teamStructure;
    await this.deployAgent(sessionName, team.orchestrator, 0);

    if (team.projectManagers.length > 0) {
      await this.deployAgent(sessionName, team.projectManagers[0], 1);
    }

    // Additional agents will be deployed based on phase requirements
    console.log(
      chalk.yellow('Phased deployment initialized. Additional agents will be deployed as needed.')
    );
  }

  /**
   * Deploy agents adaptively based on workload
   */
  private async deployAdaptiveAgents(sessionName: string): Promise<void> {
    // Start with minimal team
    const team = this.config.teamStructure;
    await this.deployAgent(sessionName, team.orchestrator, 0);

    console.log(
      chalk.yellow('Adaptive deployment initialized. Agents will be added based on workload.')
    );
  }

  /**
   * Deploy a single agent
   */
  private async deployAgent(
    sessionName: string,
    agentConfig: AgentConfig,
    windowIndex: number
  ): Promise<void> {
    console.log(chalk.gray(`Deploying ${agentConfig.role}: ${agentConfig.name}...`));

    const windowName = `${agentConfig.role}-${agentConfig.id}`;

    // Create window if it doesn't exist
    const windows = await this.tmux.getSessionWindows(sessionName);
    const existingWindow = windows.find((w) => w.windowIndex === windowIndex);

    if (!existingWindow) {
      const windowConfig: TmuxWindowConfig = {
        sessionName,
        windowIndex,
        windowName,
        workingDirectory: this.projectPath,
        command: 'claude',
      };

      await this.tmux.createWindow(windowConfig);
    } else {
      // Rename existing window
      await this.tmux.renameWindow(sessionName, windowIndex, windowName);
    }

    // Wait for Claude to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Send agent briefing
    const briefing = this.generateAgentBriefing(agentConfig);
    await this.briefAgent(sessionName, windowIndex, briefing);

    // Create agent session
    const session: AgentSession = {
      agentId: agentConfig.id,
      sessionName,
      windowIndex,
      windowName,
      status: 'active',
      startTime: new Date(),
      lastActivity: new Date(),
      completedTasks: 0,
      gitCommits: 0,
      messagesExchanged: 0,
    };

    this.agents.set(agentConfig.id, session);
    this.status.activeAgents.push(session);
    this.status.metrics.totalAgents++;
    this.status.metrics.activeAgents++;

    // Register agent in communication hierarchy
    this.communication.registerAgentHierarchy(agentConfig.id, agentConfig.reportingTo);

    // Set up message handler for this agent
    this.communication.subscribe(agentConfig.id, async (message) => {
      await this.handleAgentMessage(agentConfig.id, message);
    });

    // Start git auto-commit
    if (this.config.gitDiscipline.enabled) {
      this.gitDiscipline.startAutoCommit(agentConfig.id, agentConfig.role, this.orchestrationId);
    }

    // Schedule first check-in
    if (this.config.selfScheduling.enabled) {
      await this.scheduler.scheduleAgentCheckIn(
        session,
        undefined, // Use default interval
        `Initial check-in for ${agentConfig.name}`
      );
    }
  }

  /**
   * Generate agent briefing
   */
  private generateAgentBriefing(agent: AgentConfig): AgentBriefing {
    const gitInstructions = this.config.gitDiscipline.enabled
      ? this.generateGitInstructions()
      : 'Git discipline not required for this session.';

    const schedulingInstructions = this.config.selfScheduling.enabled
      ? this.generateSchedulingInstructions()
      : 'Self-scheduling not required for this session.';

    return {
      agentId: agent.id,
      role: agent.role,
      projectContext: `You are working on ${this.config.projectName}. ${agent.briefing}`,
      objectives: agent.responsibilities,
      constraints: agent.constraints || [],
      communicationProtocol: this.generateCommunicationProtocol(agent),
      gitInstructions,
      schedulingInstructions,
      escalationCriteria: this.generateEscalationCriteria(agent.role),
      successCriteria: this.generateSuccessCriteria(agent.role),
      resources: this.gatherResources(),
    };
  }

  /**
   * Brief an agent with their instructions
   */
  private async briefAgent(
    sessionName: string,
    windowIndex: number,
    briefing: AgentBriefing
  ): Promise<void> {
    const message = this.formatBriefingMessage(briefing);
    await this.tmux.sendClaudeMessage(sessionName, windowIndex, message);
  }

  /**
   * Format briefing message for Claude
   */
  private formatBriefingMessage(briefing: AgentBriefing): string {
    const context = {
      agentId: briefing.agentId,
      role: briefing.role,
      projectContext: briefing.projectContext,
      objectives: briefing.objectives,
      communicationProtocol: briefing.communicationProtocol,
      gitInstructions: briefing.gitInstructions,
      schedulingInstructions: briefing.schedulingInstructions,
      escalationCriteria: briefing.escalationCriteria,
      successCriteria: briefing.successCriteria,
      resources: briefing.resources,
      constraints: briefing.constraints || [],
      timestamp: new Date().toISOString(),
      orchestrationId: this.orchestrationId,
      projectName: this.config.projectName,
    };

    return this.briefingTemplate(context);
  }

  /**
   * Generate git instructions based on config
   */
  private generateGitInstructions(): string {
    const { gitDiscipline } = this.config;

    return `MANDATORY Git Discipline:
- Auto-commit every ${gitDiscipline.autoCommitInterval} minutes
- Use ${gitDiscipline.branchingStrategy} branching strategy
- Commit message format: ${gitDiscipline.commitMessageFormat}
- ${gitDiscipline.requireTests ? 'All code must have tests' : 'Tests optional'}
- ${gitDiscipline.requireReview ? 'Code review required before merge' : 'Direct commits allowed'}
- NEVER work more than 1 hour without committing
- Create feature branches for new work
- Tag stable versions before major changes`;
  }

  /**
   * Generate scheduling instructions
   */
  private generateSchedulingInstructions(): string {
    const { selfScheduling } = this.config;

    return `Self-Scheduling Protocol:
- Schedule next check-in every ${selfScheduling.defaultCheckInterval} minutes
- Use schedule_with_note.sh script for scheduling
- ${selfScheduling.adaptiveScheduling ? 'Adjust schedule based on workload' : 'Fixed interval scheduling'}
- Min interval: ${selfScheduling.minCheckInterval} minutes
- Max interval: ${selfScheduling.maxCheckInterval} minutes
- Recovery strategy: ${selfScheduling.recoveryStrategy}`;
  }

  /**
   * Generate communication protocol for agent
   */
  private generateCommunicationProtocol(agent: AgentConfig): string {
    const model = this.config.communicationModel;

    if (model === 'hub-and-spoke') {
      if (agent.role === 'project-manager') {
        return 'You are a communication hub. Aggregate reports from team members and report to orchestrator.';
      } else if (agent.role === 'orchestrator') {
        return 'You receive reports from project managers. Do not communicate directly with developers.';
      } else {
        return `Report to your project manager (${agent.reportingTo}). Do not communicate directly with other agents.`;
      }
    } else if (model === 'hierarchical') {
      return `Report to ${agent.reportingTo || 'orchestrator'}. You may receive instructions from higher-level agents.`;
    } else {
      return 'Direct communication with any team member is allowed when necessary.';
    }
  }

  /**
   * Generate escalation criteria based on role
   */
  private generateEscalationCriteria(role: AgentRole): string[] {
    const baseCriteria = [
      'Blocked for more than 10 minutes',
      'Critical error or bug discovered',
      'Architecture decision needed',
      'Security vulnerability found',
    ];

    const roleCriteria: Record<AgentRole, string[]> = {
      orchestrator: [
        'Project timeline at risk',
        'Resource allocation needed',
        'Cross-team conflict',
      ],
      'project-manager': [
        'Team member blocked',
        'Quality standards not met',
        'Schedule slippage detected',
      ],
      developer: [
        'Implementation approach unclear',
        'Missing requirements',
        'Technical debt accumulating',
      ],
      'qa-engineer': [
        'Critical bugs found',
        'Test coverage below threshold',
        'Performance regression',
      ],
      devops: ['Deployment failure', 'Infrastructure issues', 'Security concerns'],
      'code-reviewer': [
        'Code quality issues',
        'Security vulnerabilities',
        'Best practices violations',
      ],
      researcher: [
        'Technology decision needed',
        'Conflicting information found',
        'Research blocked',
      ],
      'documentation-writer': [
        'Documentation gaps identified',
        'API changes not documented',
        'User guide outdated',
      ],
    };

    return [...baseCriteria, ...(roleCriteria[role] || [])];
  }

  /**
   * Generate success criteria based on role
   */
  private generateSuccessCriteria(role: AgentRole): string[] {
    const roleCriteria: Record<AgentRole, string[]> = {
      orchestrator: [
        'All phases completed successfully',
        'Team operating efficiently',
        'Project goals achieved',
      ],
      'project-manager': [
        'Team productivity maintained',
        'Quality standards met',
        'No critical blockers',
      ],
      developer: ['Features implemented to spec', 'Tests passing', 'Code reviewed and approved'],
      'qa-engineer': [
        'Test coverage above threshold',
        'No critical bugs',
        'Performance benchmarks met',
      ],
      devops: ['Deployments successful', 'Infrastructure stable', 'Security measures in place'],
      'code-reviewer': ['Code quality maintained', 'Best practices followed', 'No security issues'],
      researcher: [
        'Research questions answered',
        'Recommendations provided',
        'Documentation created',
      ],
      'documentation-writer': ['Documentation complete', 'Examples provided', 'User guide updated'],
    };

    return roleCriteria[role] || ['Tasks completed successfully'];
  }

  /**
   * Gather resources for agents
   */
  private gatherResources(): string[] {
    const resources = ['CLAUDE.md - Project guidelines', 'README.md - Project overview'];

    // Check for PRPs
    const prpPath = path.join(this.projectPath, 'PRPs');
    if (fs.existsSync(prpPath)) {
      resources.push('PRPs/ - Project requirement documents');
    }

    // Check for docs
    const docsPath = path.join(this.projectPath, 'docs');
    if (fs.existsSync(docsPath)) {
      resources.push('docs/ - Project documentation');
    }

    // Add orchestration-specific resources
    resources.push(
      'Use /orchestrate-status to check team status',
      'Use /feature-status to check feature progress'
    );

    return resources;
  }

  /**
   * Initialize git discipline
   */
  private async initializeGitDiscipline(): Promise<void> {
    console.log(chalk.blue('Initializing git discipline...'));

    // Create git hooks directory
    const hooksPath = path.join(this.projectPath, '.git', 'hooks');
    await fs.ensureDir(hooksPath);

    // Create auto-commit script
    const autoCommitScript = this.generateAutoCommitScript();
    const scriptPath = path.join(this.projectPath, '.claude', 'orchestration', 'auto-commit.sh');
    await fs.ensureDir(path.dirname(scriptPath));
    await fs.writeFile(scriptPath, autoCommitScript);
    await fs.chmod(scriptPath, 0o755);

    console.log(chalk.green('Git discipline initialized'));
  }

  /**
   * Generate auto-commit script
   */
  private generateAutoCommitScript(): string {
    const interval = this.config.gitDiscipline.autoCommitInterval;

    return `#!/bin/bash
# Auto-commit script for orchestration

while true; do
  sleep ${interval * 60}
  
  # Check if there are changes
  if [[ -n $(git status -s) ]]; then
    # Add all changes
    git add -A
    
    # Create commit message
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    git commit -m "Auto-commit: Progress update at $TIMESTAMP"
    
    echo "Auto-commit completed at $TIMESTAMP"
  fi
done
`;
  }

  /**
   * Initialize self-scheduling
   */
  private async initializeSelfScheduling(): Promise<void> {
    console.log(chalk.blue('Initializing self-scheduling...'));

    // Create scheduling script
    const scheduleScript = this.generateScheduleScript();
    const scriptPath = path.join(this.projectPath, '.claude', 'orchestration', 'schedule.sh');
    await fs.ensureDir(path.dirname(scriptPath));
    await fs.writeFile(scriptPath, scheduleScript);
    await fs.chmod(scriptPath, 0o755);

    console.log(chalk.green('Self-scheduling initialized'));
  }

  /**
   * Generate schedule script
   */
  private generateScheduleScript(): string {
    const { defaultCheckInterval, minCheckInterval, maxCheckInterval } = this.config.selfScheduling;

    return `#!/bin/bash
# Self-scheduling script for orchestration

MINUTES=\${1:-${defaultCheckInterval}}
NOTE=\${2:-"Regular orchestration check"}
TARGET=\${3:-"cf-orchestrator:0"}

# Validate interval
if [ \$MINUTES -lt ${minCheckInterval} ]; then
  MINUTES=${minCheckInterval}
elif [ \$MINUTES -gt ${maxCheckInterval} ]; then
  MINUTES=${maxCheckInterval}
fi

# Create note file
echo "=== Next Check Note ($(date)) ===" > .claude/orchestration/next_check.txt
echo "Scheduled for: \$MINUTES minutes" >> .claude/orchestration/next_check.txt
echo "" >> .claude/orchestration/next_check.txt
echo "\$NOTE" >> .claude/orchestration/next_check.txt

# Schedule the check
SECONDS=\$(( \$MINUTES * 60 ))
nohup bash -c "sleep \$SECONDS && tmux send-keys -t \$TARGET 'Time for orchestration check! cat .claude/orchestration/next_check.txt' && sleep 1 && tmux send-keys -t \$TARGET Enter" > /dev/null 2>&1 &

echo "Scheduled check in \$MINUTES minutes"
`;
  }

  /**
   * Get orchestration status
   */
  async getStatus(): Promise<OrchestrationStatus> {
    // Update metrics
    await this.updateMetrics();

    return this.status;
  }

  /**
   * Update orchestration metrics
   */
  private async updateMetrics(): Promise<void> {
    // Update active agent count
    this.status.metrics.activeAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.status === 'active'
    ).length;

    // Calculate uptime
    const uptime = Date.now() - this.status.startTime.getTime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    this.status.metrics.uptime = `${hours}h ${minutes}m`;

    this.status.lastUpdate = new Date();
  }

  /**
   * Save orchestration status
   */
  private async saveStatus(): Promise<void> {
    const statusPath = path.join(this.projectPath, '.claude', 'orchestration', 'status.json');
    await fs.ensureDir(path.dirname(statusPath));
    await fs.writeJSON(statusPath, this.status, { spaces: 2 });
  }

  /**
   * Monitor agent health
   */
  async monitorAgents(): Promise<void> {
    for (const [agentId, session] of this.agents) {
      try {
        const content = await this.tmux.captureWindowContent(
          session.sessionName,
          session.windowIndex,
          20
        );

        // Check for activity
        if (content.includes('Error') || content.includes('error')) {
          session.status = 'error';
          this.recordError({
            timestamp: new Date(),
            agentId,
            type: 'agent-crash',
            message: 'Error detected in agent output',
            severity: 'error',
            requiresIntervention: true,
          });
        } else if (Date.now() - session.lastActivity.getTime() > 30 * 60 * 1000) {
          // No activity for 30 minutes
          session.status = 'idle';
        } else {
          session.status = 'active';
        }
      } catch (error) {
        session.status = 'error';
        this.recordError({
          timestamp: new Date(),
          agentId,
          type: 'communication',
          message: `Failed to monitor agent: ${error}`,
          severity: 'warning',
          requiresIntervention: false,
        });
      }
    }
  }

  /**
   * Record an orchestration error
   */
  private recordError(error: OrchestrationError): void {
    this.errors.push(error);

    if (error.severity === 'critical' || error.requiresIntervention) {
      console.log(chalk.red(`🚨 Orchestration Error: ${error.message}`));
    }
  }

  /**
   * Handle agent message
   */
  private async handleAgentMessage(agentId: string, message: AgentMessage): Promise<void> {
    const session = this.agents.get(agentId);
    if (!session) {
      console.error(chalk.red(`Unknown agent: ${agentId}`));
      return;
    }

    // Update activity
    session.lastActivity = new Date();
    session.messagesExchanged++;

    // Process based on message type
    switch (message.type) {
      case 'status-update':
        console.log(chalk.blue(`Status from ${agentId}: ${message.content}`));
        break;

      case 'task-completed':
        session.completedTasks++;
        this.status.metrics.tasksCompleted++;
        console.log(chalk.green(`✓ Task completed by ${agentId}: ${message.content}`));
        break;

      case 'task-blocked':
        session.status = 'blocked';
        this.status.metrics.blockers++;
        console.log(chalk.red(`⚠ ${agentId} blocked: ${message.content}`));
        break;

      case 'code-review-request':
        console.log(chalk.yellow(`Code review requested by ${agentId}`));
        // Forward to code reviewers
        await this.forwardToCodeReviewers(message);
        break;

      case 'deployment-request':
        console.log(chalk.cyan(`Deployment requested by ${agentId}`));
        // Forward to DevOps
        await this.forwardToDevOps(message);
        break;

      case 'escalation':
        this.recordError({
          timestamp: new Date(),
          agentId,
          type: 'escalation',
          message: message.content,
          severity: 'warning',
          requiresIntervention: true,
        });
        break;
    }

    // Send to recipient via tmux if different agent
    if (message.toAgent !== 'orchestrator' && message.toAgent !== agentId) {
      const recipientSession = this.agents.get(message.toAgent);
      if (recipientSession) {
        const formattedMessage = this.formatAgentMessage(message);
        await this.tmux.sendClaudeMessage(
          recipientSession.sessionName,
          recipientSession.windowIndex,
          formattedMessage
        );
      }
    }
  }

  /**
   * Handle agent check-in
   */
  private async handleAgentCheckIn(agentId: string): Promise<void> {
    const session = this.agents.get(agentId);
    if (!session) {
      return;
    }

    // Capture recent output
    const output = await this.tmux.captureWindowContent(
      session.sessionName,
      session.windowIndex,
      50
    );

    // Analyze output for status
    const hasErrors = output.toLowerCase().includes('error');
    const isBlocked = output.toLowerCase().includes('blocked');
    const isWaiting = output.toLowerCase().includes('waiting');

    // Update session status
    if (hasErrors) {
      session.status = 'error';
    } else if (isBlocked) {
      session.status = 'blocked';
    } else if (isWaiting) {
      session.status = 'idle';
    } else {
      session.status = 'active';
    }

    // Update last activity
    session.lastActivity = new Date();

    // Schedule next check-in with adaptive interval
    if (this.config.selfScheduling.adaptiveScheduling) {
      const interval = this.calculateAdaptiveInterval(session.status);
      await this.scheduler.scheduleAgentCheckIn(session, interval);
    } else {
      await this.scheduler.scheduleAgentCheckIn(session);
    }
  }

  /**
   * Calculate adaptive check-in interval based on agent status
   */
  private calculateAdaptiveInterval(status: AgentSession['status']): number {
    const { minCheckInterval, maxCheckInterval, defaultCheckInterval } = this.config.selfScheduling;

    switch (status) {
      case 'blocked':
      case 'error':
        return minCheckInterval; // Check frequently when issues
      case 'idle':
        return maxCheckInterval; // Check less frequently when idle
      case 'active':
      default:
        return defaultCheckInterval;
    }
  }

  /**
   * Format agent message for display
   */
  private formatAgentMessage(message: AgentMessage): string {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    return `\n[${timestamp}] Message from ${message.fromAgent}:\nType: ${message.type}\n${message.content}\n${message.metadata ? `\nMetadata: ${JSON.stringify(message.metadata, null, 2)}` : ''}`;
  }

  /**
   * Forward message to code reviewers
   */
  private async forwardToCodeReviewers(message: AgentMessage): Promise<void> {
    const reviewers = Array.from(this.agents.values()).filter((agent) => {
      const config = this.getAgentConfig(agent.agentId);
      return config?.role === 'code-reviewer';
    });

    for (const reviewer of reviewers) {
      await this.communication.sendMessage(
        message.fromAgent,
        reviewer.agentId,
        'code-review-request',
        message.content,
        message.metadata
      );
    }
  }

  /**
   * Forward message to DevOps
   */
  private async forwardToDevOps(message: AgentMessage): Promise<void> {
    const devops = Array.from(this.agents.values()).filter((agent) => {
      const config = this.getAgentConfig(agent.agentId);
      return config?.role === 'devops';
    });

    for (const devopsAgent of devops) {
      await this.communication.sendMessage(
        message.fromAgent,
        devopsAgent.agentId,
        'deployment-request',
        message.content,
        message.metadata
      );
    }
  }

  /**
   * Get agent config by ID
   */
  private getAgentConfig(agentId: string): AgentConfig | undefined {
    const team = this.config.teamStructure;
    const allAgents = [
      team.orchestrator,
      ...team.projectManagers,
      ...team.developers,
      ...(team.qaEngineers || []),
      ...(team.devops || []),
      ...(team.codeReviewers || []),
      ...(team.researchers || []),
      ...(team.documentationWriters || []),
    ];

    return allAgents.find((agent) => agent.id === agentId);
  }

  /**
   * Stop orchestration
   */
  async stop(): Promise<void> {
    console.log(chalk.yellow('Stopping orchestration...'));

    // Stop all auto-commit intervals
    this.gitDiscipline.cleanup();

    // Cancel all scheduled check-ins
    await this.scheduler.cancelAllSchedules();

    this.status.status = 'completed';
    this.status.endTime = new Date();
    await this.saveStatus();

    // Archive agent logs
    await this.archiveAgentLogs();

    // Generate final report
    await this.generateFinalReport();

    console.log(chalk.green('Orchestration stopped'));
  }

  /**
   * Archive agent conversation logs
   */
  private async archiveAgentLogs(): Promise<void> {
    const logsPath = path.join(this.projectPath, '.claude', 'orchestration', 'logs');
    await fs.ensureDir(logsPath);

    for (const [agentId, session] of this.agents) {
      try {
        const content = await this.tmux.captureWindowContent(
          session.sessionName,
          session.windowIndex,
          this.tmux['maxLinesCapture']
        );

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logsPath, `${agentId}_${timestamp}.log`);

        await fs.writeFile(logFile, content);
      } catch (error) {
        console.log(chalk.red(`Failed to archive logs for agent ${agentId}: ${error}`));
      }
    }
  }

  /**
   * Generate final orchestration report
   */
  private async generateFinalReport(): Promise<void> {
    const reportPath = path.join(
      this.projectPath,
      '.claude',
      'orchestration',
      'reports',
      `final-report-${this.orchestrationId}.md`
    );

    await fs.ensureDir(path.dirname(reportPath));

    // Load report template
    const templatePath = path.join(__dirname, '../../templates/orchestration/status-report.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const reportTemplate = Handlebars.compile(templateContent);

    // Gather report data
    const reportData = await this.gatherReportData();

    // Generate report
    const report = reportTemplate(reportData);
    await fs.writeFile(reportPath, report);

    console.log(chalk.green(`Final report saved to: ${reportPath}`));
  }

  /**
   * Gather data for final report
   */
  private async gatherReportData(): Promise<any> {
    const gitStats = this.gitDiscipline.getStats();
    const recentCommits = await this.gitDiscipline.getRecentCommits(5);
    const communicationStats = this.communication.getStats();

    // Calculate team composition
    const teamComposition = this.calculateTeamComposition();

    // Calculate agent productivity
    const agentProductivity = this.calculateAgentProductivity();

    // Get recent communications
    const recentCommunications = this.communication.getRecentMessages(5).map((msg) => ({
      fromAgent: msg.fromAgent,
      toAgent: msg.toAgent,
      type: msg.type,
      summary: msg.content.substring(0, 50) + '...',
    }));

    return {
      timestamp: new Date().toISOString(),
      projectName: this.config.projectName,
      status: this.status.status,
      uptime: this.status.metrics.uptime,
      totalAgents: this.status.metrics.totalAgents,
      activeAgents: this.status.metrics.activeAgents,
      teamComposition,
      tasksCompleted: this.status.metrics.tasksCompleted,
      tasksPending: this.status.metrics.tasksPending,
      completionRate: this.calculateCompletionRate(),
      gitCommits: gitStats.totalCommits,
      linesOfCodeWritten: this.status.metrics.linesOfCodeWritten,
      filesModified: await this.countModifiedFiles(),
      testsWritten: this.status.metrics.testsWritten,
      testsPassing: this.status.metrics.testsPassing,
      testCoverage: await this.calculateTestCoverage(),
      codeReviewPassRate: this.calculateCodeReviewPassRate(),
      blockers: this.status.metrics.blockers,
      errors: this.errors.length,
      escalations: this.errors.filter((e) => e.type === 'escalation').length,
      agents: this.formatAgentStatuses(),
      recentCommits: recentCommits.map((c) => ({
        hash: c.hash,
        message: c.message,
        agent: c.author,
      })),
      recentCommunications,
      currentPhase: this.formatCurrentPhase(),
      completedPhases: this.status.completedPhases,
      agentProductivity,
      totalMessages: communicationStats.totalMessages,
      avgResponseTime: communicationStats.averageResponseTime,
      communicationModel: this.config.communicationModel,
      blockedMessages: communicationStats.blockedMessages,
      autoCommitCompliance: gitStats.complianceRate,
      branchStrategy: this.config.gitDiscipline.branchingStrategy,
      activeBranches: await this.countActiveBranches(),
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps(),
    };
  }

  /**
   * Calculate team composition
   */
  private calculateTeamComposition(): Array<{ role: string; count: number }> {
    const composition: Record<string, number> = {};

    for (const [_, session] of this.agents) {
      const config = this.getAgentConfig(session.agentId);
      if (config) {
        composition[config.role] = (composition[config.role] || 0) + 1;
      }
    }

    return Object.entries(composition)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate agent productivity
   */
  private calculateAgentProductivity(): Array<any> {
    const productivity = [];
    const uptime = Date.now() - this.status.startTime.getTime();
    const hours = uptime / (1000 * 60 * 60);

    for (const [agentId, session] of this.agents) {
      const config = this.getAgentConfig(agentId);
      productivity.push({
        agent: config?.name || agentId,
        tasksPerHour: (session.completedTasks / hours).toFixed(2),
        commitsPerHour: (session.gitCommits / hours).toFixed(2),
      });
    }

    return productivity.sort((a, b) => parseFloat(b.tasksPerHour) - parseFloat(a.tasksPerHour));
  }

  /**
   * Calculate completion rate
   */
  private calculateCompletionRate(): number {
    const total = this.status.metrics.tasksCompleted + this.status.metrics.tasksPending;
    return total > 0 ? Math.round((this.status.metrics.tasksCompleted / total) * 100) : 0;
  }

  /**
   * Count modified files
   */
  private async countModifiedFiles(): Promise<number> {
    try {
      const { stdout } = await execAsync('git diff --name-only HEAD~10..HEAD | wc -l', {
        cwd: this.projectPath,
      });
      return parseInt(stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate test coverage
   */
  private async calculateTestCoverage(): Promise<number> {
    // This would normally integrate with a test coverage tool
    // For now, return a calculated estimate
    const { testsWritten, testsPassing } = this.status.metrics;
    return testsWritten > 0
      ? Math.round((testsPassing / testsWritten) * 85) // Assume 85% coverage when tests pass
      : 0;
  }

  /**
   * Calculate code review pass rate
   */
  private calculateCodeReviewPassRate(): number {
    // This would normally track actual code review outcomes
    // For now, use error rate as a proxy
    const codeErrors = this.errors.filter(
      (e) => e.type === 'code-quality' || e.message.includes('review')
    ).length;
    return Math.max(0, 100 - codeErrors * 10);
  }

  /**
   * Format agent statuses for report
   */
  private formatAgentStatuses(): Array<any> {
    const statuses = [];

    for (const [agentId, session] of this.agents) {
      const config = this.getAgentConfig(agentId);
      const blocker = this.errors
        .filter((e) => e.agentId === agentId && e.type === 'task-blocked')
        .pop();

      statuses.push({
        name: config?.name || agentId,
        role: config?.role || 'unknown',
        status: session.status,
        sessionName: session.sessionName,
        windowIndex: session.windowIndex,
        currentTask: 'Task tracking not implemented', // Would need task tracking
        lastActivity: session.lastActivity.toISOString(),
        completedTasks: session.completedTasks,
        gitCommits: session.gitCommits,
        messagesExchanged: session.messagesExchanged,
        blockerDescription: blocker?.message,
      });
    }

    return statuses;
  }

  /**
   * Format current phase info
   */
  private formatCurrentPhase(): any | null {
    // This would track actual phase progress
    // For now, return placeholder
    if (this.status.completedPhases.length === 0) {
      return {
        name: 'Initial Development',
        progress: 25,
        tasksComplete: this.status.metrics.tasksCompleted,
        totalTasks: this.status.metrics.tasksCompleted + this.status.metrics.tasksPending,
        estimatedCompletion: 'In Progress',
      };
    }
    return null;
  }

  /**
   * Count active branches
   */
  private async countActiveBranches(): Promise<number> {
    try {
      const { stdout } = await execAsync('git branch -r | wc -l', { cwd: this.projectPath });
      return parseInt(stdout.trim()) || 1;
    } catch {
      return 1;
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(): string[] {
    const recommendations = [];

    // Check for blocked agents
    const blockedAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === 'blocked'
    ).length;
    if (blockedAgents > 0) {
      recommendations.push(`${blockedAgents} agent(s) are blocked. Consider manual intervention.`);
    }

    // Check error rate
    if (this.errors.length > 10) {
      recommendations.push('High error rate detected. Review error logs for patterns.');
    }

    // Check git compliance
    const gitStats = this.gitDiscipline.getStats();
    if (gitStats.complianceRate < 80) {
      recommendations.push('Git commit compliance below 80%. Agents may need reminders.');
    }

    // Check productivity
    const idleAgents = Array.from(this.agents.values()).filter((a) => a.status === 'idle').length;
    if (idleAgents > this.agents.size * 0.3) {
      recommendations.push('Over 30% of agents are idle. Consider task redistribution.');
    }

    return recommendations;
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(): string[] {
    const steps = [];

    if (this.status.status === 'completed') {
      steps.push(
        'Review final report and agent logs',
        'Merge feature branches to main',
        'Tag release version',
        'Archive orchestration data'
      );
    } else {
      steps.push(
        'Monitor agent progress',
        'Address any blockers',
        'Review code quality metrics',
        'Prepare for next phase'
      );
    }

    return steps;
  }

  /**
   * Generate orchestration summary
   */
  async generateSummary(): Promise<string> {
    const status = await this.getStatus();
    const gitStats = this.gitDiscipline.getStats();
    const activeAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === 'active'
    ).length;

    return `📊 Orchestration Status:
• Project: ${this.config.projectName}
• Active Agents: ${activeAgents}/${status.metrics.totalAgents}
• Tasks: ${status.metrics.tasksCompleted} completed, ${status.metrics.tasksPending} pending
• Git: ${gitStats.totalCommits} commits (${gitStats.complianceRate.toFixed(0)}% compliance)
• Uptime: ${status.metrics.uptime}`;
  }
}

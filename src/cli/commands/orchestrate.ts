import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { OrchestrationService } from '../../services/orchestrationService';
import {
  OrchestrationConfig,
  AgentRole,
  AgentConfig,
  OrchestrationStrategy,
  CommunicationModel,
  TeamStructure,
} from '../../types/orchestration';
import { v4 as uuidv4 } from 'uuid';

export const orchestrateCommand = new Command('orchestrate')
  .description('Deploy autonomous AI orchestration for your project')
  .argument('[size]', 'team size: small, medium (default), or large', 'medium')
  .option(
    '-s, --strategy <strategy>',
    'deployment strategy: big-bang, phased, or adaptive',
    'big-bang'
  )
  .option(
    '-c, --communication <model>',
    'communication model: hub-and-spoke, hierarchical, or mesh',
    'hub-and-spoke'
  )
  .option('--no-git', 'disable git auto-commit')
  .option('--no-scheduling', 'disable self-scheduling')
  .option('--commit-interval <minutes>', 'git commit interval in minutes', '30')
  .option('--check-interval <minutes>', 'self-scheduling check interval', '15')
  .action(async (size: string, options) => {
    console.log(chalk.blue.bold('\n🤖 Context Forge Orchestrator\n'));
    console.log(chalk.gray('Deploying autonomous AI team for your project...\n'));

    const spinner = ora();
    const projectPath = process.cwd();

    try {
      // Check prerequisites
      spinner.start('Checking prerequisites...');

      // Check if git initialized
      if (!fs.existsSync(path.join(projectPath, '.git'))) {
        spinner.fail('Git not initialized');
        console.log(chalk.red('\nThis project needs to be a git repository.'));
        console.log(chalk.yellow('Run: git init'));
        return;
      }

      // Check for CLAUDE.md
      if (!fs.existsSync(path.join(projectPath, 'CLAUDE.md'))) {
        spinner.warn('CLAUDE.md not found');
        console.log(chalk.yellow('\nCLAUDE.md provides important context for agents.'));
        console.log(chalk.yellow('Consider running: context-forge init'));
      }

      spinner.succeed('Prerequisites checked');

      // Get project name from package.json or directory name
      let projectName = path.basename(projectPath);
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        projectName = packageJson.name || projectName;
      }

      // Create orchestration configuration
      const config = createOrchestrationConfig(
        projectName,
        size,
        options.strategy as OrchestrationStrategy,
        options.communication as CommunicationModel,
        options.git !== false,
        options.scheduling !== false,
        parseInt(options.commitInterval),
        parseInt(options.checkInterval)
      );

      // Initialize orchestration service
      const orchestrator = new OrchestrationService(projectPath, config);

      // Deploy the orchestration
      spinner.start('Deploying AI agents...');
      await orchestrator.deploy();
      spinner.succeed('AI team deployed successfully!');

      // Get initial status
      const status = await orchestrator.getStatus();

      // Display deployment summary
      console.log(chalk.cyan('\n📊 Orchestration Summary:'));
      console.log(`  • Project: ${chalk.bold(projectName)}`);
      console.log(`  • Team Size: ${chalk.green(size)} (${status.metrics.totalAgents} agents)`);
      console.log(`  • Strategy: ${config.strategy}`);
      console.log(`  • Communication: ${config.communicationModel}`);
      console.log(
        `  • Git Discipline: ${config.gitDiscipline.enabled ? chalk.green('Enabled') : chalk.gray('Disabled')}`
      );
      console.log(
        `  • Self-Scheduling: ${config.selfScheduling.enabled ? chalk.green('Enabled') : chalk.gray('Disabled')}`
      );

      // Display team structure
      console.log(chalk.cyan('\n👥 Team Structure:'));
      const team = config.teamStructure;
      console.log(`  • Orchestrator: ${team.orchestrator.name}`);

      if (team.projectManagers.length > 0) {
        console.log(
          `  • Project Managers: ${team.projectManagers.map((pm) => pm.name).join(', ')}`
        );
      }

      console.log(`  • Developers: ${team.developers.map((dev) => dev.name).join(', ')}`);

      if (team.qaEngineers && team.qaEngineers.length > 0) {
        console.log(`  • QA Engineers: ${team.qaEngineers.map((qa) => qa.name).join(', ')}`);
      }

      // Display session information
      const sessionName = `cf-${projectName.toLowerCase().replace(/\s+/g, '-')}`;
      console.log(chalk.cyan('\n🖥️  Monitoring:'));
      console.log(`  • Session: ${sessionName}`);
      console.log(`  • View agents: ${chalk.yellow(`tmux attach -t ${sessionName}`)}`);
      console.log(`  • Check status: ${chalk.yellow('/orchestrate-status')}`);
      console.log(`  • View logs: ${chalk.yellow('.claude/orchestration/logs/')}`);

      // Display important notes
      console.log(chalk.blue.bold('\n📝 Important Notes:'));
      console.log('  • Agents will begin working autonomously');
      console.log('  • Git commits happen automatically every 30 minutes');
      console.log('  • Agents self-schedule their check-ins');
      console.log('  • Monitor progress with /orchestrate-status');
      console.log('  • Review commits regularly for quality');

      // Next steps
      console.log(chalk.green.bold('\n✅ Next Steps:'));
      console.log('1. Let agents analyze the project (5-10 minutes)');
      console.log('2. Check initial status with /orchestrate-status');
      console.log('3. Monitor first auto-commit for progress');
      console.log('4. Intervene only if agents are blocked');
      console.log('5. Review and merge completed work');
    } catch (error) {
      spinner.fail('Orchestration deployment failed');
      console.error(chalk.red('\nError:'), error);
      throw error;
    }
  });

/**
 * Create orchestration configuration based on team size
 */
function createOrchestrationConfig(
  projectName: string,
  size: string,
  strategy: OrchestrationStrategy,
  communicationModel: CommunicationModel,
  gitEnabled: boolean,
  schedulingEnabled: boolean,
  commitInterval: number,
  checkInterval: number
): OrchestrationConfig {
  const baseConfig: OrchestrationConfig = {
    projectName,
    strategy,
    communicationModel,
    gitDiscipline: {
      enabled: gitEnabled,
      autoCommitInterval: commitInterval,
      branchingStrategy: 'feature',
      commitMessageFormat: 'Progress: $TASK - $DESCRIPTION',
      tagStrategy: 'stable',
      requireTests: true,
      requireReview: false,
    },
    selfScheduling: {
      enabled: schedulingEnabled,
      defaultCheckInterval: checkInterval,
      adaptiveScheduling: true,
      maxCheckInterval: 60,
      minCheckInterval: 5,
      recoveryStrategy: 'resume',
    },
    teamStructure: createTeamStructure(size, projectName),
  };

  return baseConfig;
}

/**
 * Create team structure based on size
 */
function createTeamStructure(size: string, projectName: string): TeamStructure {
  const orchestratorId = uuidv4();

  const orchestrator: AgentConfig = {
    id: orchestratorId,
    role: 'orchestrator',
    name: 'Chief Orchestrator',
    briefing: `You are the chief orchestrator for ${projectName}. Maintain high-level oversight without micromanaging.`,
    responsibilities: [
      'Monitor overall project progress',
      'Make architectural decisions',
      'Resolve cross-team dependencies',
      'Ensure quality standards',
      'Handle escalations',
    ],
    constraints: [
      'Do not implement code directly',
      'Do not micromanage team members',
      'Focus on strategic decisions',
    ],
  };

  const team: TeamStructure = {
    orchestrator,
    projectManagers: [],
    developers: [],
    qaEngineers: [],
    devops: [],
    codeReviewers: [],
  };

  if (size === 'small') {
    // Small team: 1 PM, 2 developers
    const pmId = uuidv4();
    team.projectManagers = [
      {
        id: pmId,
        role: 'project-manager' as AgentRole,
        name: 'Project Manager',
        briefing: 'Coordinate the development team and maintain exceptional quality standards.',
        responsibilities: [
          'Coordinate developer tasks',
          'Track progress and blockers',
          'Ensure code quality',
          'Report to orchestrator',
        ],
        reportingTo: orchestratorId,
      },
    ];

    team.developers = [
      createDeveloper('Lead Developer', pmId, ['Architecture', 'Core features']),
      createDeveloper('Developer', pmId, ['Features', 'Bug fixes']),
    ];
  } else if (size === 'large') {
    // Large team: 2 PMs, 4 developers, 2 QA, 1 DevOps, 1 Code Reviewer
    const pm1Id = uuidv4();
    const pm2Id = uuidv4();

    team.projectManagers = [
      {
        id: pm1Id,
        role: 'project-manager' as AgentRole,
        name: 'Frontend PM',
        briefing: 'Manage frontend development team.',
        responsibilities: [
          'Coordinate frontend developers',
          'Ensure UI/UX quality',
          'Track frontend progress',
        ],
        reportingTo: orchestratorId,
      },
      {
        id: pm2Id,
        role: 'project-manager' as AgentRole,
        name: 'Backend PM',
        briefing: 'Manage backend development team.',
        responsibilities: [
          'Coordinate backend developers',
          'Ensure API quality',
          'Track backend progress',
        ],
        reportingTo: orchestratorId,
      },
    ];

    team.developers = [
      createDeveloper('Senior Frontend Dev', pm1Id, ['UI components', 'State management']),
      createDeveloper('Frontend Dev', pm1Id, ['UI implementation', 'Testing']),
      createDeveloper('Senior Backend Dev', pm2Id, ['API design', 'Database']),
      createDeveloper('Backend Dev', pm2Id, ['API implementation', 'Integration']),
    ];

    team.qaEngineers = [
      createQAEngineer('Senior QA', orchestratorId, ['Test strategy', 'Automation']),
      createQAEngineer('QA Engineer', orchestratorId, ['Manual testing', 'Bug tracking']),
    ];

    team.devops = [createDevOpsEngineer(orchestratorId)];
    team.codeReviewers = [createCodeReviewer(orchestratorId)];
  } else {
    // Medium team (default): 1 PM, 2 developers, 1 QA
    const pmId = uuidv4();

    team.projectManagers = [
      {
        id: pmId,
        role: 'project-manager' as AgentRole,
        name: 'Project Manager',
        briefing: 'Coordinate the development team and maintain exceptional quality standards.',
        responsibilities: [
          'Coordinate all team members',
          'Track progress and quality',
          'Remove blockers',
          'Report to orchestrator',
        ],
        reportingTo: orchestratorId,
      },
    ];

    team.developers = [
      createDeveloper('Lead Developer', pmId, ['Architecture', 'Core features', 'Code review']),
      createDeveloper('Developer', pmId, ['Feature implementation', 'Testing', 'Documentation']),
    ];

    team.qaEngineers = [
      createQAEngineer('QA Engineer', pmId, [
        'Test planning',
        'Test execution',
        'Quality assurance',
      ]),
    ];
  }

  return team;
}

function createDeveloper(name: string, reportingTo: string, focusAreas: string[]): AgentConfig {
  return {
    id: uuidv4(),
    role: 'developer',
    name,
    briefing: `You are a ${name} responsible for implementing features with high quality.`,
    responsibilities: [
      'Implement features according to PRPs',
      'Write comprehensive tests',
      'Follow coding standards',
      'Document your code',
      'Collaborate with team',
    ],
    reportingTo,
    focusAreas,
    constraints: ['All code must have tests', 'Follow existing patterns', 'Commit regularly'],
  };
}

function createQAEngineer(name: string, reportingTo: string, focusAreas: string[]): AgentConfig {
  return {
    id: uuidv4(),
    role: 'qa-engineer',
    name,
    briefing: `You are a ${name} ensuring the highest quality standards.`,
    responsibilities: [
      'Create test plans',
      'Execute tests thoroughly',
      'Track and report bugs',
      'Verify fixes',
      'Ensure coverage targets',
    ],
    reportingTo,
    focusAreas,
    constraints: ['Be thorough in testing', 'Document all issues', 'Verify before approving'],
  };
}

function createDevOpsEngineer(reportingTo: string): AgentConfig {
  return {
    id: uuidv4(),
    role: 'devops',
    name: 'DevOps Engineer',
    briefing: 'Manage infrastructure, deployment, and CI/CD pipelines.',
    responsibilities: [
      'Set up CI/CD pipelines',
      'Manage deployments',
      'Monitor infrastructure',
      'Ensure security',
      'Optimize performance',
    ],
    reportingTo,
    focusAreas: ['CI/CD', 'Infrastructure', 'Security', 'Monitoring'],
  };
}

function createCodeReviewer(reportingTo: string): AgentConfig {
  return {
    id: uuidv4(),
    role: 'code-reviewer',
    name: 'Code Reviewer',
    briefing: 'Review all code for quality, security, and best practices.',
    responsibilities: [
      'Review pull requests',
      'Ensure code quality',
      'Check security issues',
      'Verify best practices',
      'Provide feedback',
    ],
    reportingTo,
    focusAreas: ['Code quality', 'Security', 'Best practices', 'Performance'],
  };
}

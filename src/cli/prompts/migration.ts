import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  ProjectConfig,
  SupportedIDE,
  TechStackInfo,
  MigrationConfig,
  SharedResource,
  MigrationPhase,
  CheckpointTrigger,
} from '../../types';
import { BasicAnalysis } from '../../services/projectAnalyzer';
import { MigrationAnalyzer, MigrationAnalysis } from '../../services/migrationAnalyzer';
import { ideSelection } from './ideSelection';
import { projectConfig } from './projectConfig';

export async function runMigrationPrompts(
  basicAnalysis: BasicAnalysis,
  targetStackHint: Partial<TechStackInfo>,
  ideOverride?: SupportedIDE[],
  quickMode: boolean = false
): Promise<ProjectConfig> {
  console.log(chalk.blue.bold('\n🔄 Migration Configuration\n'));

  // Step 1: Basic project info
  const projectInfo = await getMigrationProjectInfo(basicAnalysis);

  // Step 2: Target stack selection
  const targetStack = await selectTargetStack(basicAnalysis, targetStackHint);

  // Step 3: Analyze migration
  const migrationAnalyzer = new MigrationAnalyzer(process.cwd(), targetStack);
  const migrationAnalysis = await migrationAnalyzer.analyzeMigration(basicAnalysis);

  // Step 4: Migration strategy
  const strategy = quickMode
    ? migrationAnalysis.recommendedStrategy
    : await selectMigrationStrategy(migrationAnalysis);

  // Step 5: Shared resources configuration
  const sharedResources = quickMode
    ? migrationAnalysis.sharedResources
    : await configureSharedResources(migrationAnalysis.sharedResources);

  // Step 6: Migration phases
  const phases = quickMode
    ? migrationAnalysis.suggestedPhases
    : await configureMigrationPhases(migrationAnalysis.suggestedPhases);

  // Step 7: Rollback strategy
  const rollbackStrategy = await migrationAnalyzer.generateRollbackStrategy(
    phases,
    sharedResources
  );

  // Step 8: IDE selection
  const targetIDEs = ideOverride || (await ideSelection());

  // Step 9: Project configuration
  const config = await projectConfig();

  // Step 10: Checkpoint configuration (enhanced for migration)
  let checkpoints = undefined;
  if (config.extras.checkpoints) {
    checkpoints = await migrationCheckpointConfig(phases);
  }

  // Build migration config
  const migrationConfig: MigrationConfig = {
    strategy,
    sourceStack: migrationAnalysis.sourceStack,
    targetStack: migrationAnalysis.targetStack,
    sharedResources,
    migrationPhases: phases,
    rollbackStrategy,
    riskLevel: migrationAnalysis.complexity.level,
    checkpoints: checkpoints?.triggers.map((t: CheckpointTrigger) => ({
      phaseId: phases[0].id, // Will be mapped properly
      name: t.name,
      description: t.description,
      validationSteps: [],
      rollbackEnabled: true,
      requiresApproval: t.category === 'critical',
    })),
  };

  return {
    ...projectInfo,
    targetIDEs,
    techStack: {
      frontend: targetStack.name,
      backend: targetStack.name,
      database: sharedResources.find((r) => r.type === 'database')?.name,
    },
    features: [],
    ...config,
    checkpointConfig: checkpoints,
    migrationConfig,
    isRetrofit: true,
  };
}

async function getMigrationProjectInfo(analysis: BasicAnalysis) {
  console.log(chalk.cyan('📋 Migration Project Information'));

  const { projectName, description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: process.cwd().split('/').pop() + '-migration',
      validate: (input: string) => input.trim().length > 0 || 'Project name is required',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Migration description:',
      default: `Migration from ${analysis.techStack[0]} to new technology stack`,
      validate: (input: string) => input.trim().length > 0 || 'Description is required',
    },
  ]);

  return {
    projectName,
    description,
    projectType: analysis.projectType.toLowerCase() as
      | 'web'
      | 'mobile'
      | 'desktop'
      | 'api'
      | 'fullstack',
  };
}

async function selectTargetStack(
  analysis: BasicAnalysis,
  hint: Partial<TechStackInfo>
): Promise<TechStackInfo> {
  console.log(chalk.cyan('\n🎯 Target Technology Stack'));
  console.log(chalk.gray(`Current stack: ${analysis.techStack.join(', ')}\n`));

  if (hint.name) {
    const { confirmTarget } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmTarget',
        message: `Migrate to ${hint.name}?`,
        default: true,
      },
    ]);

    if (confirmTarget) {
      return {
        name: hint.name,
        type: 'fullstack',
        docs: '',
        dependencies: [],
        ...hint,
      };
    }
  }

  // Common migration paths
  const migrationOptions = getMigrationOptions(analysis.techStack);

  const { targetStack } = await inquirer.prompt([
    {
      type: 'list',
      name: 'targetStack',
      message: 'Select target technology stack:',
      choices: [...migrationOptions, { name: 'Other (specify)', value: 'other' }],
    },
  ]);

  if (targetStack === 'other') {
    const { customStack } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customStack',
        message: 'Enter target stack name:',
        validate: (input: string) => input.trim().length > 0 || 'Stack name is required',
      },
    ]);

    return {
      name: customStack,
      type: 'fullstack',
      docs: '',
      dependencies: [],
    };
  }

  return {
    name: targetStack,
    type: 'fullstack',
    docs: '',
    dependencies: [],
  };
}

interface MigrationOption {
  name: string;
  value: string;
}

function getMigrationOptions(currentStack: string[]): MigrationOption[] {
  const options = [];

  // Python migrations
  if (currentStack.some((s) => s.includes('Flask') || s.includes('Django'))) {
    options.push(
      { name: 'FastAPI (Modern Python async)', value: 'FastAPI' },
      { name: 'Next.js (Full-stack React)', value: 'Next.js' },
      { name: 'Express.js (Node.js)', value: 'Express' }
    );
  }

  // JavaScript migrations
  if (currentStack.some((s) => s.includes('Express') || s.includes('React'))) {
    options.push(
      { name: 'Next.js (Full-stack React)', value: 'Next.js' },
      { name: 'Fastify (Fast Node.js)', value: 'Fastify' },
      { name: 'NestJS (Enterprise Node.js)', value: 'NestJS' }
    );
  }

  // Legacy migrations
  options.push(
    { name: 'Next.js 15 (Latest React)', value: 'Next.js' },
    { name: 'SvelteKit (Modern alternative)', value: 'SvelteKit' },
    { name: 'Remix (Full-stack React)', value: 'Remix' }
  );

  return options;
}

async function selectMigrationStrategy(
  analysis: MigrationAnalysis
): Promise<MigrationConfig['strategy']> {
  console.log(chalk.cyan('\n🚀 Migration Strategy'));
  console.log(chalk.gray(`Recommended: ${analysis.recommendedStrategy}\n`));

  const { strategy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: 'Select migration strategy:',
      choices: [
        {
          name: 'Parallel Run - Both systems run simultaneously (safest)',
          value: 'parallel-run',
        },
        {
          name: 'Incremental - Migrate features one by one',
          value: 'incremental',
        },
        {
          name: 'Big Bang - Complete replacement at once (fastest)',
          value: 'big-bang',
        },
      ],
      default: analysis.recommendedStrategy,
    },
  ]);

  return strategy;
}

async function configureSharedResources(detected: SharedResource[]): Promise<SharedResource[]> {
  if (detected.length === 0) {
    return [];
  }

  console.log(chalk.cyan('\n🔗 Shared Resources Configuration'));
  console.log(chalk.gray('Detected shared resources that need special handling:\n'));

  detected.forEach((resource) => {
    const icon =
      resource.criticalityLevel === 'critical'
        ? '🔴'
        : resource.criticalityLevel === 'high'
          ? '🟡'
          : '🟢';
    console.log(`${icon} ${resource.name} (${resource.type})`);
    console.log(`   ${chalk.gray(resource.description)}`);
  });

  const { confirmResources } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmResources',
      message: 'Are these shared resources correct?',
      default: true,
    },
  ]);

  if (!confirmResources) {
    // Allow manual configuration
    return await manuallyConfigureResources(detected);
  }

  // Enhance migration strategies for critical resources
  const enhanced = [];
  for (const resource of detected) {
    if (resource.criticalityLevel === 'critical') {
      console.log(chalk.yellow(`\n⚠️  Critical Resource: ${resource.name}`));
      const { strategy } = await inquirer.prompt([
        {
          type: 'input',
          name: 'strategy',
          message: 'Migration strategy for this resource:',
          default: resource.migrationStrategy,
        },
      ]);

      enhanced.push({
        ...resource,
        migrationStrategy: strategy,
      });
    } else {
      enhanced.push(resource);
    }
  }

  return enhanced;
}

async function manuallyConfigureResources(suggested: SharedResource[]): Promise<SharedResource[]> {
  const resources: SharedResource[] = [...suggested];

  const { addMore } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addMore',
      message: 'Add additional shared resources?',
      default: false,
    },
  ]);

  if (addMore) {
    let adding = true;
    while (adding) {
      const resource = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Resource type:',
          choices: ['database', 'api', 'auth', 'storage', 'cache', 'queue'],
        },
        {
          type: 'input',
          name: 'name',
          message: 'Resource name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
        },
        {
          type: 'list',
          name: 'criticalityLevel',
          message: 'Criticality level:',
          choices: ['low', 'medium', 'high', 'critical'],
        },
        {
          type: 'input',
          name: 'migrationStrategy',
          message: 'Migration strategy:',
        },
      ]);

      resources.push(resource as SharedResource);

      const { continueAdding } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAdding',
          message: 'Add another resource?',
          default: false,
        },
      ]);

      adding = continueAdding;
    }
  }

  return resources;
}

async function configureMigrationPhases(suggested: MigrationPhase[]): Promise<MigrationPhase[]> {
  console.log(chalk.cyan('\n📅 Migration Phases'));
  console.log(chalk.gray('Suggested migration phases:\n'));

  suggested.forEach((phase, index) => {
    console.log(`${index + 1}. ${chalk.bold(phase.name)} (${phase.estimatedDuration})`);
    console.log(`   ${chalk.gray(phase.description)}`);
    if (phase.rollbackPoint) {
      console.log(`   ${chalk.green('✓ Rollback point')}`);
    }
  });

  const { usePhases } = await inquirer.prompt([
    {
      type: 'list',
      name: 'usePhases',
      message: 'How would you like to configure phases?',
      choices: [
        { name: 'Use suggested phases', value: 'suggested' },
        { name: 'Modify suggested phases', value: 'modify' },
        { name: 'Create custom phases', value: 'custom' },
      ],
    },
  ]);

  switch (usePhases) {
    case 'suggested':
      return suggested;
    case 'modify':
      return await modifyPhases(suggested);
    case 'custom':
      return await createCustomPhases();
    default:
      return suggested;
  }
}

async function modifyPhases(phases: MigrationPhase[]): Promise<MigrationPhase[]> {
  const modified = [...phases];

  for (let i = 0; i < modified.length; i++) {
    const phase = modified[i];
    console.log(chalk.cyan(`\n📝 Phase ${i + 1}: ${phase.name}`));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Keep as is', value: 'keep' },
          { name: 'Modify details', value: 'modify' },
          { name: 'Remove phase', value: 'remove' },
        ],
      },
    ]);

    if (action === 'modify') {
      const updates = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Phase name:',
          default: phase.name,
        },
        {
          type: 'input',
          name: 'estimatedDuration',
          message: 'Estimated duration:',
          default: phase.estimatedDuration,
        },
        {
          type: 'confirm',
          name: 'rollbackPoint',
          message: 'Is this a rollback point?',
          default: phase.rollbackPoint,
        },
      ]);

      modified[i] = {
        ...phase,
        ...updates,
      };
    } else if (action === 'remove') {
      modified.splice(i, 1);
      i--; // Adjust index
    }
  }

  return modified;
}

async function createCustomPhases(): Promise<MigrationPhase[]> {
  const phases: MigrationPhase[] = [];
  let addMore = true;
  let phaseIndex = 0;

  while (addMore) {
    console.log(chalk.cyan(`\n📋 Phase ${phaseIndex + 1}`));

    const phase = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Phase name:',
        validate: (input: string) => input.trim().length > 0 || 'Name is required',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        validate: (input: string) => input.trim().length > 0 || 'Description is required',
      },
      {
        type: 'input',
        name: 'estimatedDuration',
        message: 'Estimated duration (e.g., "1-2 weeks"):',
        default: '1-2 weeks',
      },
      {
        type: 'confirm',
        name: 'rollbackPoint',
        message: 'Is this a rollback point?',
        default: true,
      },
    ]);

    phases.push({
      id: `phase-${phaseIndex}`,
      name: phase.name,
      description: phase.description,
      estimatedDuration: phase.estimatedDuration,
      rollbackPoint: phase.rollbackPoint,
      dependencies: phaseIndex > 0 ? [`phase-${phaseIndex - 1}`] : [],
      criticalCheckpoints: [],
      risks: [],
      validationCriteria: [],
    });

    const { continueAdding } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAdding',
        message: 'Add another phase?',
        default: phases.length < 3,
      },
    ]);

    addMore = continueAdding;
    phaseIndex++;
  }

  return phases;
}

interface MigrationCheckpointConfig {
  enabled: boolean;
  triggers: CheckpointTrigger[];
}

async function migrationCheckpointConfig(
  phases: MigrationPhase[]
): Promise<MigrationCheckpointConfig> {
  console.log(chalk.cyan('\n🛑 Migration Checkpoint Configuration'));
  console.log(chalk.gray('Configure checkpoints for critical migration milestones\n'));

  const checkpointTriggers: CheckpointTrigger[] = [
    {
      id: 'migration-start',
      name: 'Migration Start',
      description: 'Verify readiness before starting migration',
      category: 'critical',
      autoTrigger: false,
      conditions: ['migration', 'start', 'begin'],
    },
    {
      id: 'shared-resource',
      name: 'Shared Resource Access',
      description: 'Verify shared resource connectivity',
      category: 'critical',
      autoTrigger: true,
      conditions: ['database', 'auth', 'shared', 'connection'],
    },
    {
      id: 'phase-complete',
      name: 'Phase Completion',
      description: 'Verify phase completion before proceeding',
      category: 'important',
      autoTrigger: true,
      conditions: ['phase', 'complete', 'finished'],
    },
    {
      id: 'rollback-point',
      name: 'Rollback Point',
      description: 'Confirm before passing rollback point',
      category: 'critical',
      autoTrigger: true,
      conditions: ['rollback', 'point', 'critical'],
    },
    {
      id: 'go-live',
      name: 'Production Cutover',
      description: 'Final verification before production switch',
      category: 'critical',
      autoTrigger: false,
      conditions: ['production', 'cutover', 'go-live'],
    },
  ];

  // Add phase-specific checkpoints
  phases.forEach((phase) => {
    if (phase.rollbackPoint) {
      checkpointTriggers.push({
        id: `${phase.id}-complete`,
        name: `${phase.name} Complete`,
        description: `Verify ${phase.name} completion`,
        category: 'important',
        autoTrigger: true,
        conditions: [phase.id, 'complete'],
      });
    }
  });

  return {
    enabled: true,
    triggers: checkpointTriggers,
  };
}

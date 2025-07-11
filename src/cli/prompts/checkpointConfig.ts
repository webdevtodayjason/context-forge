import inquirer from 'inquirer';
import { CheckpointConfig, CustomMilestone } from '../../types';
import { getDefaultCheckpointTriggers } from '../../generators/checkpointCommands';

export async function checkpointConfig(projectType: string): Promise<CheckpointConfig | undefined> {
  console.log('\n🛑 Checkpoint System Configuration:\n');

  const { enableCheckpoints } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableCheckpoints',
      message: 'Enable Human-in-the-Loop checkpoint system?',
      default: false,
    },
  ]);

  if (!enableCheckpoints) {
    return undefined;
  }

  console.log('\n   The checkpoint system will pause development at critical milestones');
  console.log('   and request human verification before proceeding.\n');

  const { triggerTypes } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'triggerTypes',
      message: 'Which types of milestones should trigger checkpoints?',
      choices: [
        {
          name: 'Database connections and schema changes',
          value: 'database-connection',
          checked: true,
        },
        {
          name: 'Authentication and security implementations',
          value: 'authentication-setup',
          checked: true,
        },
        {
          name: 'API endpoints that modify data',
          value: 'api-endpoints',
          checked: true,
        },
        {
          name: 'External service integrations',
          value: 'integration-setup',
          checked: false,
        },
        {
          name: 'Production deployment configurations',
          value: 'production-deployment',
          checked: true,
        },
        ...(projectType === 'fullstack' || projectType === 'api'
          ? [
              {
                name: 'Data migrations and transformations',
                value: 'data-migration',
                checked: true,
              },
            ]
          : []),
      ],
    },
  ]);

  const { customMilestones } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customMilestones',
      message: 'Add custom project-specific milestones?',
      default: false,
    },
  ]);

  // Get default triggers and filter by selected types
  const allTriggers = getDefaultCheckpointTriggers(projectType);
  const selectedTriggers = allTriggers.filter((trigger) => triggerTypes.includes(trigger.id));

  const config: CheckpointConfig = {
    enabled: true,
    triggers: selectedTriggers,
  };

  // Add custom milestones if requested
  if (customMilestones) {
    config.customMilestones = await collectCustomMilestones();
  }

  return config;
}

async function collectCustomMilestones(): Promise<CustomMilestone[]> {
  const milestones: CustomMilestone[] = [];

  console.log('\n   Define custom milestones for your project:');

  let addMore = true;
  while (addMore) {
    const milestone = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Milestone name:',
        validate: (input) => input.length > 0 || 'Please enter a milestone name',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        validate: (input) => input.length > 0 || 'Please enter a description',
      },
      {
        type: 'input',
        name: 'testInstructions',
        message: 'Test instructions (comma-separated):',
        filter: (input) =>
          input
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0),
      },
      {
        type: 'confirm',
        name: 'blocksUntilApproved',
        message: 'Should this milestone BLOCK development until approved?',
        default: true,
      },
    ]);

    const verificationPoints = [
      `${milestone.name} functionality works as expected`,
      'No breaking changes introduced',
      'Performance is acceptable',
    ];

    const fullMilestone = {
      ...milestone,
      verificationPoints,
    };

    milestones.push(fullMilestone);

    const { continueAdding } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAdding',
        message: 'Add another custom milestone?',
        default: false,
      },
    ]);

    addMore = continueAdding;
  }

  return milestones;
}

export function generateCheckpointSummary(config: CheckpointConfig): string {
  if (!config.enabled) {
    return 'Checkpoint system: Disabled';
  }

  const triggerCount = config.triggers.length;
  const customCount = config.customMilestones?.length || 0;
  const criticalTriggers = config.triggers.filter((t) => t.category === 'critical').length;

  return `Checkpoint system: Enabled
  - ${triggerCount} automatic triggers (${criticalTriggers} critical)
  - ${customCount} custom milestones
  - Human verification required at key development points`;
}

import { ProjectConfig } from '../../types';
import { projectInfo } from './projectInfo';
import { ideSelection } from './ideSelection';
import { prdInput } from './prdInput';
import { techStack } from './techStack';
import { features } from './features';
import { projectConfig } from './projectConfig';
import { checkpointConfig } from './checkpointConfig';
import chalk from 'chalk';

export async function runPrompts(aiSuggestions?: any): Promise<ProjectConfig> {
  console.log(chalk.blue.bold('\n🧞\u200d♂️  Interactive Setup Wizard'));
  console.log(
    chalk.gray("Let's configure your project step by step. This will take about 2-3 minutes.\n")
  );

  // Show AI suggestions overview if available
  if (aiSuggestions && aiSuggestions.suggestions.length > 0) {
    console.log(chalk.yellow('📊 AI Analysis Complete'));
    console.log(
      chalk.gray(
        `Found ${aiSuggestions.suggestions.length} optimization suggestions (confidence: ${aiSuggestions.confidence}%)`
      )
    );
    console.log(chalk.gray('These will be integrated into the setup process.\n'));
  }

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■□□□□□□') + chalk.gray(' (1/7)\n'));

  // Step 1: Basic project information
  const basicInfo = await projectInfo(aiSuggestions);

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■■□□□□□') + chalk.gray(' (2/7)\n'));

  // Step 2: IDE selection
  const targetIDEs = await ideSelection();

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■■■□□□□') + chalk.gray(' (3/7)\n'));

  // Step 3: PRD input
  const prd = await prdInput();

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■■■■□□□') + chalk.gray(' (4/7)\n'));

  // Step 4: Tech stack selection
  const stack = await techStack(basicInfo.projectType);

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■■■■■□□') + chalk.gray(' (5/7)\n'));

  // Step 5: Feature selection
  const selectedFeatures = await features(basicInfo.projectType);

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■■■■■■□') + chalk.gray(' (6/7)\n'));

  // Step 6: Project configuration
  const config = await projectConfig();

  // Progress indicator
  console.log(chalk.cyan('Progress: ') + chalk.gray('■■■■■■■') + chalk.gray(' (7/7)\n'));

  // Step 7: Checkpoint configuration (if enabled)
  let checkpoints = undefined;
  if (config.extras.checkpoints) {
    checkpoints = await checkpointConfig(basicInfo.projectType);
  }

  console.log(chalk.green.bold('\n✨ Setup wizard completed successfully!'));
  console.log(chalk.gray('All configuration collected. Generating your project files...\n'));

  return {
    ...basicInfo,
    targetIDEs,
    prd,
    techStack: stack,
    features: selectedFeatures,
    ...config,
    checkpointConfig: checkpoints,
  };
}

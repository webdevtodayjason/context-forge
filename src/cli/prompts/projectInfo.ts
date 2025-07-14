import inquirer from 'inquirer';
import chalk from 'chalk';
import { validateProjectName, validateDescription } from '../../utils/validator';
import { AIAnalysisResult } from '../../services/aiIntelligenceService';

export async function projectInfo(aiSuggestions?: AIAnalysisResult) {
  console.log(chalk.blue('\n📋 Step 1 of 7: Project Information'));
  console.log(chalk.gray('Tell us about your project to get started.\n'));

  // Show AI suggestions if available
  if (aiSuggestions?.suggestions) {
    const configSuggestions = aiSuggestions.suggestions.filter((s) => s.type === 'config');
    if (configSuggestions.length > 0) {
      console.log(chalk.yellow('💡 AI detected the following about your project:'));
      configSuggestions.slice(0, 2).forEach((suggestion) => {
        console.log(chalk.gray(`   • ${suggestion.description}`));
      });
      console.log('');
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: validateProjectName,
      transformer: (input: string) => {
        if (input && input.length > 0) {
          return chalk.green(input);
        }
        return input;
      },
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      choices: [
        {
          name: '🌐 Web Application',
          value: 'web',
          short: 'Web App',
        },
        {
          name: '📱 Mobile Application',
          value: 'mobile',
          short: 'Mobile App',
        },
        {
          name: '🖥️  Desktop Application',
          value: 'desktop',
          short: 'Desktop App',
        },
        {
          name: '🔌 API Service',
          value: 'api',
          short: 'API',
        },
        {
          name: '🚀 Full-Stack Application',
          value: 'fullstack',
          short: 'Full-Stack',
        },
      ],
      pageSize: 10,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Brief description:',
      validate: validateDescription,
      transformer: (input: string) => {
        if (input && input.length > 10) {
          return chalk.green(input);
        } else if (input && input.length > 0) {
          return chalk.yellow(input);
        }
        return input;
      },
    },
  ]);

  console.log(chalk.green('✓ Project information collected\n'));
  return answers;
}

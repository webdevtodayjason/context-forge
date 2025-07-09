import inquirer from 'inquirer';
import { validateProjectName, validateDescription } from '../../utils/validator';

export async function projectInfo() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: validateProjectName,
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      choices: [
        { name: 'Web Application', value: 'web' },
        { name: 'Mobile Application', value: 'mobile' },
        { name: 'Desktop Application', value: 'desktop' },
        { name: 'API Service', value: 'api' },
        { name: 'Full-Stack Application', value: 'fullstack' },
      ],
    },
    {
      type: 'input',
      name: 'description',
      message: 'Brief description:',
      validate: validateDescription,
    },
  ]);

  return answers;
}

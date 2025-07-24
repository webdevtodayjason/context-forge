import inquirer from 'inquirer';
import { SupportedIDE } from '../../types';
import { IDE_INFO } from '../../adapters';
import chalk from 'chalk';

export async function ideSelection(): Promise<SupportedIDE[]> {
  console.log(chalk.blue('\n📱 Step 2 of 7: IDE Selection'));
  console.log(chalk.gray('Context Forge can generate configuration for multiple AI IDEs.\n'));

  console.log(chalk.yellow('💡 Tip: Choose Claude Code for the best experience with this tool!\n'));

  const { ideChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ideChoice',
      message: 'Which AI IDE are you using?',
      choices: [
        {
          name: `${chalk.green('★ Claude Code')} ${chalk.gray('(recommended)')} - Anthropic's official CLI`,
          value: 'single:claude',
        },
        {
          name: 'Cursor IDE - AI-powered IDE built on VS Code',
          value: 'single:cursor',
        },
        {
          name: 'Roo Code - VS Code extension for AI development',
          value: 'single:roo',
        },
        {
          name: 'Cline - VS Code AI pair programming extension',
          value: 'single:cline',
        },
        {
          name: 'Windsurf IDE - IDE with Cascade AI integration (Coming soon)',
          value: 'single:windsurf',
          disabled: true,
        },
        {
          name: 'GitHub Copilot - AI pair programmer (Coming soon)',
          value: 'single:copilot',
          disabled: true,
        },
        {
          name: "Gemini - Google's AI tools (CLI & Code Assist)",
          value: 'single:gemini',
        },
        new inquirer.Separator(),
        {
          name: chalk.cyan('Multiple IDEs') + ' - Generate for several IDEs',
          value: 'multiple',
        },
      ],
    },
  ]);

  // If single IDE selected, return it
  if (ideChoice.startsWith('single:')) {
    const selectedIDE = ideChoice.replace('single:', '') as SupportedIDE;
    console.log(chalk.green(`\n✓ Selected: ${IDE_INFO[selectedIDE].name}\n`));
    return [selectedIDE];
  }

  // If multiple IDEs selected, show checkbox list
  const { selectedIDEs } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedIDEs',
      message: 'Select all IDEs you want to generate configuration for:',
      choices: [
        {
          name: `Claude Code - ${IDE_INFO.claude.description}`,
          value: 'claude',
          checked: true,
          disabled: false,
        },
        {
          name: `Cursor IDE - ${IDE_INFO.cursor.description}`,
          value: 'cursor',
          disabled: false,
        },
        {
          name: `Roo Code - ${IDE_INFO.roo.description}`,
          value: 'roo',
          disabled: false,
        },
        {
          name: `Cline - ${IDE_INFO.cline.description}`,
          value: 'cline',
          disabled: false,
        },
        {
          name: `Windsurf IDE - ${IDE_INFO.windsurf.description} (Coming soon)`,
          value: 'windsurf',
          disabled: true,
        },
        {
          name: `GitHub Copilot - ${IDE_INFO.copilot.description} (Coming soon)`,
          value: 'copilot',
          disabled: true,
        },
        {
          name: `Gemini - ${IDE_INFO.gemini.description}`,
          value: 'gemini',
          disabled: false,
        },
      ],
      validate: (answers) => {
        if (answers.length === 0) {
          return 'Please select at least one IDE';
        }
        return true;
      },
    },
  ]);

  console.log(chalk.green(`\n✓ Selected ${selectedIDEs.length} IDE(s):`));
  selectedIDEs.forEach((ide: SupportedIDE) => {
    console.log(chalk.gray(`  - ${IDE_INFO[ide].name}`));
  });
  console.log();

  return selectedIDEs;
}

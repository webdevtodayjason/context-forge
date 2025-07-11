import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import inquirer from 'inquirer';
import { copyHooksFromRepo } from '../../generators/hooks';
import fs from 'fs-extra';

export const copyHooksCommand = new Command('copy-hooks')
  .description('Copy Claude Code hooks from an external repository')
  .option('-s, --source <path>', 'source repository path')
  .option('-t, --target <path>', 'target directory (default: current directory)', '.')
  .option('-a, --all', 'copy all hooks without prompting')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🪝 Copy Claude Code Hooks\n'));

    const spinner = ora();

    try {
      let sourcePath = options.source;

      // If no source provided, prompt for it
      if (!sourcePath) {
        const { repoPath } = await inquirer.prompt([
          {
            type: 'input',
            name: 'repoPath',
            message: 'Path to hooks repository:',
            default: '../claude-hooks-repo',
            validate: async (input) => {
              const exists = await fs.pathExists(input);
              return exists || 'Repository path does not exist';
            },
          },
        ]);
        sourcePath = repoPath;
      }

      const targetPath = path.resolve(options.target);
      const hooksRepoPath = path.resolve(sourcePath);

      // Validate source repository
      spinner.start('Validating hooks repository...');
      const hooksDir = path.join(hooksRepoPath, 'hooks');

      if (!(await fs.pathExists(hooksDir))) {
        spinner.fail('Hooks directory not found in repository');
        console.log(chalk.red(`Expected hooks directory at: ${hooksDir}`));
        return;
      }

      const availableHooks = await fs.readdir(hooksDir);
      spinner.succeed(`Found ${availableHooks.length} hooks in repository`);

      let selectedHooks: string[] = [];

      if (options.all) {
        selectedHooks = availableHooks;
      } else {
        // Let user select which hooks to copy
        const { hooks } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'hooks',
            message: 'Select hooks to copy:',
            choices: availableHooks.map((hook) => ({
              name: hook,
              value: hook,
              checked: true, // Default to all selected
            })),
          },
        ]);
        selectedHooks = hooks;
      }

      if (selectedHooks.length === 0) {
        console.log(chalk.yellow('No hooks selected. Exiting.'));
        return;
      }

      // Copy selected hooks
      spinner.start(`Copying ${selectedHooks.length} hooks...`);
      await copyHooksFromRepo(hooksRepoPath, targetPath, selectedHooks);
      spinner.succeed('Hooks copied successfully');

      // Display success message
      console.log(chalk.green.bold('\n✨ Hooks installation complete!\n'));
      console.log(chalk.white('Copied hooks:'));
      selectedHooks.forEach((hook) => {
        console.log(chalk.gray(`  • ${hook}`));
      });

      console.log(chalk.blue.bold('\n🎯 Next steps:\n'));
      console.log(chalk.white('1. Review hooks in .claude/hooks/'));
      console.log(chalk.white('2. Customize hooks for your project'));
      console.log(chalk.white('3. Ensure Claude Code has hooks enabled'));
      console.log(chalk.white('4. Test hooks by running development commands\n'));

      // Show hook status
      const targetHooksPath = path.join(targetPath, '.claude', 'hooks');
      const installedHooks = await fs.readdir(targetHooksPath);
      console.log(chalk.cyan(`📁 Hooks directory: ${targetHooksPath}`));
      console.log(chalk.cyan(`📊 Total hooks installed: ${installedHooks.length}`));
    } catch (error) {
      spinner.fail('Failed to copy hooks');
      throw error;
    }
  });

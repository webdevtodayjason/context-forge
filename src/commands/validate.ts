import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { ProjectConfig } from '../types';
import { ValidationExecutor } from '../services/validationExecutor';
import { validationLevels } from '../data/validationCommands';

export const validateCommand = new Command('validate')
  .description('Run validation commands for your project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-l, --levels <levels>', 'Comma-separated list of validation levels to run')
  .option('-a, --all', 'Run all validation levels including optional ones')
  .option('-r, --report', 'Show detailed validation report')
  .action(async (options) => {
    try {
      console.log(chalk.bold.blue('🔍 Context Forge - Validation Runner\n'));

      // Check if project has been initialized
      const configPath = path.join(options.path, '.context-forge', 'config.json');
      if (!(await fs.pathExists(configPath))) {
        console.error(chalk.red('❌ No context-forge configuration found.'));
        console.log(chalk.yellow('Run "context-forge init" first to initialize your project.'));
        process.exit(1);
      }

      // Load project configuration
      const config: ProjectConfig = await fs.readJson(configPath);
      console.log(chalk.gray(`Project: ${config.projectName}`));
      console.log(
        chalk.gray(
          `Tech Stack: ${Object.entries(config.techStack)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}\n`
        )
      );

      // Determine which validation levels to run
      let levelsToRun: string[] = [];

      if (options.levels) {
        levelsToRun = options.levels.split(',').map((l: string) => l.trim());
      } else if (options.all) {
        levelsToRun = Object.keys(validationLevels);
      } else {
        // Interactive selection
        const { selectedLevels } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedLevels',
            message: 'Select validation levels to run:',
            choices: Object.entries(validationLevels).map(([key, info]) => ({
              name: `${info.name} - ${info.description}`,
              value: key,
              checked: info.critical,
            })),
          },
        ]);
        levelsToRun = selectedLevels;
      }

      if (levelsToRun.length === 0) {
        console.log(chalk.yellow('No validation levels selected.'));
        return;
      }

      // Run validation
      const executor = new ValidationExecutor(options.path, config);
      const report = await executor.runValidation(levelsToRun);

      // Show detailed report if requested
      if (options.report) {
        console.log(chalk.bold.blue('\n📄 Detailed Report\n'));

        report.results.forEach((result) => {
          const icon = result.success ? '✅' : '❌';
          const color = result.success ? chalk.green : chalk.red;

          console.log(color(`${icon} ${result.level}`));
          console.log(chalk.gray(`   Command: ${result.command}`));
          console.log(chalk.gray(`   Duration: ${result.duration}ms`));

          if (!result.success && result.error) {
            console.log(chalk.red(`   Error: ${result.error.split('\n')[0]}`));
          }
          console.log();
        });
      }

      // Save validation gate if PRP is enabled
      if (config.extras.prp) {
        const validationGate = await executor.generateValidationGate();
        const prpDir = path.join(options.path, 'PRPs');
        await fs.ensureDir(prpDir);
        await fs.writeFile(path.join(prpDir, 'validation-gate.md'), validationGate);
        console.log(chalk.green('\n✓ Validation gate saved to PRPs/validation-gate.md'));
      }

      // Exit with appropriate code
      process.exit(report.overallSuccess ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('\n❌ Validation failed:'));
      console.error(error);
      process.exit(1);
    }
  });

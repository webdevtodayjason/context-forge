import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { validateCommand } from '../commands/validate';
import { version } from '../../package.json';

const program = new Command();

program
  .name('context-forge')
  .description('CLI tool that generates context engineering documentation for Claude Code projects')
  .version(version, '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for command');

// Add commands
program.addCommand(initCommand);
program.addCommand(validateCommand);

// Error handling wrapper
const handleError = (error: Error) => {
  console.error(chalk.red('Error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
};

// Parse commands
program.parseAsync(process.argv).catch(handleError);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

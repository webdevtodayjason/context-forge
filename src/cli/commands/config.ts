import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export const configCommand = new Command('config')
  .description('Show or manage project configuration')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--show', 'Show current configuration (default)')
  .option('--validate', 'Validate configuration file')
  .option('--backup', 'Create a backup of the current configuration')
  .action(async (options) => {
    const configPath = path.join(options.path, '.context-forge', 'config.json');
    
    try {
      // Check if configuration exists
      if (!(await fs.pathExists(configPath))) {
        console.error(chalk.red('❌ No context-forge configuration found.'));
        console.log(chalk.yellow('Run "context-forge init" first to initialize your project.'));
        process.exit(1);
      }

      if (options.backup) {
        await createConfigBackup(configPath, options.path);
        return;
      }

      if (options.validate) {
        await validateConfiguration(configPath);
        return;
      }

      // Default: Show configuration
      await showConfiguration(configPath);
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function showConfiguration(configPath: string): Promise<void> {
  try {
    const config: ProjectConfig = await fs.readJson(configPath);
    
    console.log(chalk.blue.bold('📋 Context Forge Configuration\n'));
    
    // Project Info
    console.log(chalk.cyan('Project Information:'));
    console.log(`  Name: ${chalk.white(config.projectName)}`);
    console.log(`  Type: ${chalk.white(config.projectType)}`);
    console.log(`  Description: ${chalk.gray(config.description)}`);
    
    // Tech Stack
    console.log(chalk.cyan('\nTech Stack:'));
    Object.entries(config.techStack).forEach(([key, value]) => {
      if (value) {
        console.log(`  ${key}: ${chalk.white(value)}`);
      }
    });
    
    // Features
    if (config.features && config.features.length > 0) {
      console.log(chalk.cyan('\nFeatures:'));
      config.features.forEach((feature) => {
        const priorityColor = feature.priority === 'must-have' ? 'red' : 
                             feature.priority === 'should-have' ? 'yellow' : 'gray';
        console.log(`  • ${chalk.white(feature.name)} ${chalk[priorityColor](`(${feature.priority})`)}`);
      });
    }
    
    // Target IDEs
    console.log(chalk.cyan('\nTarget IDEs:'));
    config.targetIDEs.forEach((ide) => {
      console.log(`  • ${chalk.white(ide)}`);
    });
    
    // Extras
    const enabledExtras = Object.entries(config.extras)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => key);
    
    if (enabledExtras.length > 0) {
      console.log(chalk.cyan('\nEnabled Features:'));
      enabledExtras.forEach((extra) => {
        console.log(`  • ${chalk.white(extra)}`);
      });
    }
    
    // Configuration file info
    console.log(chalk.gray(`\nConfiguration file: ${configPath}`));
    const stats = await fs.stat(configPath);
    console.log(chalk.gray(`Last modified: ${stats.mtime.toLocaleString()}`));
    
  } catch (error) {
    throw new Error(`Failed to read configuration: ${error}`);
  }
}

async function validateConfiguration(configPath: string): Promise<void> {
  try {
    const config = await fs.readJson(configPath);
    
    console.log(chalk.blue('🔍 Validating configuration...\n'));
    
    const issues: string[] = [];
    
    // Required fields
    if (!config.projectName) issues.push('Missing project name');
    if (!config.projectType) issues.push('Missing project type');
    if (!config.description) issues.push('Missing description');
    if (!config.techStack) issues.push('Missing tech stack');
    if (!config.targetIDEs || config.targetIDEs.length === 0) issues.push('Missing target IDEs');
    
    // Features validation
    if (config.features) {
      config.features.forEach((feature: any, index: number) => {
        if (!feature.name) issues.push(`Feature ${index + 1}: Missing name`);
        if (!feature.priority) issues.push(`Feature ${index + 1}: Missing priority`);
        if (!feature.complexity) issues.push(`Feature ${index + 1}: Missing complexity`);
      });
    }
    
    if (issues.length === 0) {
      console.log(chalk.green('✅ Configuration is valid!'));
    } else {
      console.log(chalk.red('❌ Configuration issues found:'));
      issues.forEach((issue) => {
        console.log(chalk.red(`  • ${issue}`));
      });
    }
    
  } catch (error) {
    throw new Error(`Failed to validate configuration: ${error}`);
  }
}

async function createConfigBackup(configPath: string, projectPath: string): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(projectPath, '.context-forge', `config.backup.${timestamp}.json`);
    
    await fs.copy(configPath, backupPath);
    
    console.log(chalk.green('✅ Configuration backup created'));
    console.log(chalk.gray(`Backup saved to: ${backupPath}`));
    
  } catch (error) {
    throw new Error(`Failed to create backup: ${error}`);
  }
}
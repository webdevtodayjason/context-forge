import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { runPrompts } from '../prompts';
import { generateDocumentation } from '../../generators';
import { validateOutputPath } from '../../utils/validator';
import { ProjectConfig } from '../../types';

export const initCommand = new Command('init')
  .description('Initialize context engineering documentation for your project')
  .option('-o, --output <path>', 'output directory for generated files', '.')
  .option('-p, --preset <preset>', 'use a preset configuration')
  .option('-c, --config <path>', 'path to configuration file')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 Welcome to Context Forge!\n'));
    console.log(
      chalk.gray("Let's set up context engineering documentation for your Claude Code project.\n")
    );

    const spinner = ora();

    try {
      // Validate output path
      const outputPath = path.resolve(options.output);
      await validateOutputPath(outputPath);

      let config: ProjectConfig;

      if (options.config) {
        // Load configuration from file
        spinner.start('Loading configuration file...');
        const configPath = path.resolve(options.config);
        config = await fs.readJson(configPath);
        spinner.succeed('Configuration loaded');
      } else if (options.preset) {
        // Load preset configuration
        spinner.start('Loading preset configuration...');
        config = await loadPreset(options.preset);
        spinner.succeed('Preset loaded');
      } else {
        // Run interactive prompts
        config = await runPrompts();
      }

      // Generate documentation
      console.log(chalk.blue.bold('\n📝 Generating documentation...\n'));
      await generateDocumentation(config, outputPath);

      // Success message
      console.log(chalk.green.bold('\n✨ Context Forge setup complete!\n'));
      console.log(chalk.white('Generated files:'));
      console.log(chalk.gray(`  ${outputPath}/`));
      console.log(chalk.gray('  ├── CLAUDE.md'));
      console.log(chalk.gray('  └── Docs/'));
      console.log(chalk.gray('      ├── Implementation.md'));
      console.log(chalk.gray('      ├── project_structure.md'));
      console.log(chalk.gray('      ├── UI_UX_doc.md'));
      console.log(chalk.gray('      └── Bug_tracking.md'));

      console.log(chalk.blue.bold('\n🎯 Next steps:\n'));
      console.log(chalk.white('1. Review the generated documentation'));
      console.log(chalk.white('2. Open your project in Claude Code'));
      console.log(chalk.white('3. Start implementing using the staged approach'));
      console.log(chalk.white('4. Update documentation as your project evolves\n'));
    } catch (error) {
      spinner.fail('Setup failed');
      throw error;
    }
  });

async function loadPreset(presetName: string): Promise<ProjectConfig> {
  // Preset configurations will be implemented in data/presets.ts
  const presets: Record<string, Partial<ProjectConfig>> = {
    'nextjs-fastapi': {
      projectType: 'fullstack',
      techStack: {
        frontend: 'nextjs',
        backend: 'fastapi',
        database: 'postgresql',
        auth: 'jwt',
      },
    },
    'react-express': {
      projectType: 'fullstack',
      techStack: {
        frontend: 'react',
        backend: 'express',
        database: 'mongodb',
        auth: 'jwt',
      },
    },
  };

  if (!presets[presetName]) {
    throw new Error(
      `Unknown preset: ${presetName}. Available presets: ${Object.keys(presets).join(', ')}`
    );
  }

  // For presets, we still need some basic info
  const { projectInfo } = await import('../prompts/projectInfo');
  const basicInfo = await projectInfo();

  return {
    ...basicInfo,
    ...presets[presetName],
    features: [],
    timeline: 'mvp',
    teamSize: 'solo',
    deployment: 'vercel',
    extras: {
      docker: true,
      testing: true,
      linting: true,
    },
  } as ProjectConfig;
}

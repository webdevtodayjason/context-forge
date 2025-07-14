import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { runPrompts } from '../prompts';
import { generateDocumentation } from '../../generators';
import { validateOutputPath } from '../../utils/validator';
import { ProjectConfig, SupportedIDE } from '../../types';
import { getSupportedIDEs } from '../../adapters';
import { AIIntelligenceService } from '../../services/aiIntelligenceService';
import { ProjectAnalyzer } from '../../services/projectAnalyzer';
import { ErrorRecoveryService } from '../../services/errorRecoveryService';
import { ProgressTracker } from '../../services/progressTracker';

export const initCommand = new Command('init')
  .description('Initialize AI IDE configurations and documentation for your project')
  .option('-o, --output <path>', 'output directory for generated files', '.')
  .option('-p, --preset <preset>', 'use a preset configuration')
  .option('-c, --config <path>', 'path to configuration file')
  .option('--no-ai', 'disable AI-powered smart suggestions')
  .option('--quick', 'use quick setup with smart defaults')
  .option(
    '-i, --ide <ide>',
    'target IDE (claude, cursor, windsurf, cline, roo, gemini, copilot)',
    (value) => {
      const validIDEs = getSupportedIDEs();
      const ides = value.split(',').map((ide) => ide.trim());
      for (const ide of ides) {
        if (!validIDEs.includes(ide as SupportedIDE)) {
          throw new Error(`Invalid IDE: ${ide}. Valid options: ${validIDEs.join(', ')}`);
        }
      }
      return ides as SupportedIDE[];
    }
  )
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 Welcome to Context Forge!\n'));
    console.log(chalk.gray("Let's set up AI-optimized documentation for your project.\n"));

    const spinner = ora();
    const aiService = new AIIntelligenceService();
    const errorRecovery = new ErrorRecoveryService();
    const progressTracker = new ProgressTracker();

    const outputPath = path.resolve(options.output);
    let config: ProjectConfig | undefined;
    let operationId: string = '';

    // Show AI status
    const aiStatus = aiService.getAIStatus();
    console.log(chalk.gray(`${aiStatus}\n`));

    try {
      // Start progress tracking
      operationId = await progressTracker.startOperation('init', 'Project initialization', {
        aiEnabled: aiService.isAIEnabled(),
        targetIDEs: options.ide || ['claude'],
      });

      // Validate output path
      await validateOutputPath(outputPath);

      let aiSuggestions = null;

      if (options.config) {
        // Load configuration from file
        const stepId = await progressTracker.addStep(operationId, 'Load configuration file');
        spinner.start('Loading configuration file...');
        const configPath = path.resolve(options.config);
        config = await fs.readJson(configPath);
        spinner.succeed('Configuration loaded');
        await progressTracker.completeStep(operationId, stepId);
      } else if (options.preset) {
        // Load preset configuration
        const stepId = await progressTracker.addStep(operationId, 'Load preset configuration');
        spinner.start('Loading preset configuration...');
        config = await loadPreset(options.preset);
        spinner.succeed('Preset loaded');
        await progressTracker.completeStep(operationId, stepId);
      } else if (options.quick) {
        // Quick setup with AI-powered smart defaults
        const stepId = await progressTracker.addStep(
          operationId,
          'Quick setup with smart defaults'
        );
        spinner.start('Analyzing project for smart defaults...');

        const analyzer = new ProjectAnalyzer(outputPath);
        const basicAnalysis = await analyzer.analyzeBasic();

        if (aiService.isAIEnabled() && !options.ai === false) {
          aiSuggestions = await aiService.generateSmartDefaults(outputPath, basicAnalysis);
          spinner.succeed('AI analysis complete');

          // Show AI suggestions
          if (aiSuggestions.suggestions.length > 0) {
            console.log(chalk.yellow('\n🤖 AI Suggestions:'));
            aiSuggestions.suggestions.slice(0, 3).forEach((suggestion, index) => {
              console.log(
                chalk.gray(`  ${index + 1}. ${suggestion.title} (${suggestion.priority})`)
              );
              console.log(chalk.gray(`     ${suggestion.description}`));
            });
            console.log('');
          }
        } else {
          spinner.succeed('Project analysis complete');
        }

        // Generate smart default config
        config = await generateSmartDefaultConfig(basicAnalysis, aiSuggestions || null);
        await progressTracker.completeStep(operationId, stepId);
      } else {
        // Run interactive prompts with AI enhancement
        const stepId = await progressTracker.addStep(operationId, 'Interactive setup wizard');
        if (aiService.isAIEnabled() && !options.ai === false) {
          spinner.start('Analyzing project for intelligent suggestions...');
          const analyzer = new ProjectAnalyzer(outputPath);
          const basicAnalysis = await analyzer.analyzeBasic();
          aiSuggestions = await aiService.generateSmartDefaults(outputPath, basicAnalysis);
          spinner.succeed('Project analyzed');
        }

        config = await runPrompts(aiSuggestions);
        await progressTracker.completeStep(operationId, stepId);
      }

      // Override targetIDEs if --ide flag was used
      if (options.ide && config) {
        config.targetIDEs = options.ide;
      }

      if (!config) {
        throw new Error('Configuration not created');
      }

      // Generate documentation
      const docStepId = await progressTracker.addStep(operationId, 'Generate documentation');
      console.log(chalk.blue.bold('\n📝 Generating documentation...\n'));
      await generateDocumentation(config, outputPath);
      await progressTracker.completeStep(operationId, docStepId);

      // Success message
      console.log(chalk.green.bold('\n✨ Context Forge setup complete!\n'));
      console.log(chalk.white('Generated files in:'), chalk.cyan(outputPath));

      // Show IDE-specific instructions
      const targetIDEs = config.targetIDEs || ['claude'];
      console.log(chalk.white('\nGenerated configurations for:'));
      targetIDEs.forEach((ide) => {
        console.log(chalk.gray(`  • ${ide.charAt(0).toUpperCase() + ide.slice(1)}`));
      });

      // Show AI enhancement summary
      if (aiSuggestions && aiSuggestions.suggestions.length > 0) {
        console.log(
          chalk.yellow(`\n🤖 Applied ${aiSuggestions.suggestions.length} AI suggestions`)
        );
        console.log(chalk.gray(`   Confidence: ${aiSuggestions.confidence}%`));
      }

      console.log(chalk.blue.bold('\n🎯 Next steps:\n'));
      console.log(chalk.white('1. Review the generated documentation'));
      console.log(chalk.white(`2. Open your project in your AI IDE`));
      console.log(chalk.white('3. Start implementing using the staged approach'));
      console.log(chalk.white('4. Update documentation as your project evolves\n'));

      // Complete progress tracking
      await progressTracker.completeOperation(operationId, 'completed', {
        filesGenerated: config.targetIDEs.length + (config.features?.length || 0),
        targetIDEs: config.targetIDEs,
      });
    } catch (error) {
      spinner.fail('Setup failed');

      // Use error recovery service to provide intelligent suggestions
      await errorRecovery.handleError(error as Error, {
        command: 'init',
        operation: 'initialization',
        projectPath: outputPath,
        config,
      });

      // Mark operation as failed
      if (operationId) {
        await progressTracker.completeOperation(operationId, 'failed', {
          errors: [(error as Error).message],
        });
      }

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

async function generateSmartDefaultConfig(
  basicAnalysis: Record<string, unknown>,
  aiSuggestions: Record<string, unknown> | null
): Promise<ProjectConfig> {
  const { projectInfo } = await import('../prompts/projectInfo');
  const basicInfo = await projectInfo();

  // Smart defaults based on analysis
  const detectedTechStack = Array.isArray(basicAnalysis.techStack) ? basicAnalysis.techStack : [];
  const smartDefaults: Partial<ProjectConfig> = {
    projectType: detectProjectType(detectedTechStack),
    techStack: {
      frontend: detectFrontend(detectedTechStack),
      backend: detectBackend(detectedTechStack),
      database: detectDatabase(detectedTechStack),
      auth: 'jwt',
    },
    timeline: 'standard',
    teamSize: 'small',
    deployment: detectDeployment(detectedTechStack),
    extras: {
      docker: detectedTechStack.includes('docker'),
      testing: true, // Always recommend testing
      linting: true, // Always recommend linting
      examples: true,
      prp: true,
      claudeCommands: true,
      hooks: true,
      checkpoints: true,
    },
  };

  // Apply AI suggestions if available
  if (aiSuggestions && aiSuggestions.suggestions) {
    (aiSuggestions.suggestions as Array<Record<string, unknown>>).forEach(
      (suggestion: Record<string, unknown>) => {
        if (suggestion.suggestedConfig) {
          Object.assign(smartDefaults, suggestion.suggestedConfig);
        }
      }
    );
  }

  return {
    ...basicInfo,
    ...smartDefaults,
    features: [],
  } as ProjectConfig;
}

function detectProjectType(
  techStack: string[]
): 'web' | 'mobile' | 'desktop' | 'api' | 'fullstack' {
  if (techStack.some((tech) => ['react-native', 'flutter', 'ionic'].includes(tech.toLowerCase()))) {
    return 'mobile';
  }
  if (techStack.some((tech) => ['electron', 'tauri'].includes(tech.toLowerCase()))) {
    return 'desktop';
  }
  if (
    techStack.some((tech) =>
      ['express', 'fastapi', 'django', 'rails', 'spring'].includes(tech.toLowerCase())
    )
  ) {
    if (
      techStack.some((tech) => ['react', 'vue', 'angular', 'svelte'].includes(tech.toLowerCase()))
    ) {
      return 'fullstack';
    }
    return 'api';
  }
  return 'web';
}

function detectFrontend(techStack: string[]): string {
  if (techStack.includes('React')) return 'react';
  if (techStack.includes('Next.js')) return 'nextjs';
  if (techStack.includes('Vue')) return 'vue';
  if (techStack.includes('Angular')) return 'angular';
  if (techStack.includes('Svelte')) return 'svelte';
  return 'react'; // Default
}

function detectBackend(techStack: string[]): string {
  if (techStack.includes('Express')) return 'express';
  if (techStack.includes('FastAPI')) return 'fastapi';
  if (techStack.includes('Django')) return 'django';
  if (techStack.includes('Rails')) return 'rails';
  if (techStack.includes('Spring')) return 'spring';
  return 'express'; // Default
}

function detectDatabase(techStack: string[]): string {
  if (techStack.some((tech) => tech.toLowerCase().includes('postgres'))) return 'postgresql';
  if (techStack.some((tech) => tech.toLowerCase().includes('mongo'))) return 'mongodb';
  if (techStack.some((tech) => tech.toLowerCase().includes('mysql'))) return 'mysql';
  if (techStack.some((tech) => tech.toLowerCase().includes('sqlite'))) return 'sqlite';
  return 'postgresql'; // Default
}

function detectDeployment(techStack: string[]): string {
  if (techStack.includes('Next.js')) return 'vercel';
  if (techStack.includes('FastAPI') || techStack.includes('Django')) return 'railway';
  if (techStack.includes('Docker')) return 'docker';
  return 'vercel'; // Default
}

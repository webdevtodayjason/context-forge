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
import { KeyManager } from '../../services/keyManager';
// The TUI is compiled separately as ESM (so Ink + yoga-layout's top-level
// await can be loaded). We dynamic-import it from this CJS module and only
// reference it via the inline types below — never touching src/cli/tui from
// the main tsc graph (so the main project doesn't need to type-check Ink).

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  detail?: string;
}

interface GenerationResult {
  outputPath: string;
  filesCreated: number;
  filesSkipped?: number;
  filesUpdated?: number;
  summary?: string;
}

type RunGenerators = (
  config: ProjectConfig,
  onProgress: (steps: GenerationStep[]) => void
) => Promise<GenerationResult>;

export const initCommand = new Command('init')
  .description('Initialize AI IDE configurations and documentation for your project')
  .option('-o, --output <path>', 'output directory for generated files', '.')
  .option('-p, --preset <preset>', 'use a preset configuration')
  .option('-c, --config <path>', 'path to configuration file')
  .option('--no-ai', 'disable AI-powered smart suggestions')
  .option('--ai-prp', 'enable AI-powered PRP generation (requires API keys)')
  .option('--quick', 'use quick setup with smart defaults')
  .option('--no-tui', 'use the legacy inquirer prompt flow instead of the Ink TUI')
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
    const outputPath = path.resolve(options.output);

    // TUI path: full-screen Ink wizard. Used for interactive runs unless the user
    // disables it (`--no-tui`) or has provided enough non-interactive flags
    // (`--preset`, `--config`, `--quick`) that the legacy path is preferable.
    const wantsTui =
      process.stdout.isTTY &&
      options.tui !== false &&
      !options.preset &&
      !options.config &&
      !options.quick;

    if (wantsTui) {
      try {
        await runInitWithTui(options, outputPath);
        return;
      } catch (error) {
        // Fall back to inquirer path on TUI failure so the user is never stranded.
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('cancelled by user')) {
          console.log(chalk.gray('\nCancelled. No files were written.'));
          process.exitCode = 130;
          return;
        }
        console.error(chalk.yellow(`\n⚠️  TUI failed: ${message}`));
        console.error(chalk.gray('Falling back to inquirer prompt flow…\n'));
      }
    }

    console.log(chalk.blue.bold('\n🚀 Welcome to Context Forge!\n'));
    console.log(chalk.gray("Let's set up AI-optimized documentation for your project.\n"));

    const spinner = ora();
    const aiService = new AIIntelligenceService();
    const errorRecovery = new ErrorRecoveryService();
    const progressTracker = new ProgressTracker();

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

      // Handle AI PRP flag
      if (options.aiPrp && config) {
        const availableProviders = await KeyManager.getAvailableProviders();
        if (availableProviders.length === 0) {
          console.log(
            chalk.yellow('\n⚠️  AI-powered PRP generation requested but no API keys found.')
          );
          console.log(chalk.gray('Run: context-forge ai-keys to set up API keys\n'));
          console.log(chalk.blue('Proceeding with template-based PRP generation...'));
          config.extras.prp = true;
        } else {
          console.log(
            chalk.green(
              `\n🤖 AI-powered PRP generation enabled using ${availableProviders[0].toUpperCase()}`
            )
          );
          config.extras.prp = true;
          config.extras.aiPrp = true;
        }
      }

      if (!config) {
        throw new Error('Configuration not created');
      }

      // Save configuration file
      const configStepId = await progressTracker.addStep(operationId, 'Save configuration');
      const configDir = path.join(outputPath, '.context-forge');
      const configPath = path.join(configDir, 'config.json');

      await fs.ensureDir(configDir);
      await fs.writeJson(configPath, config, { spaces: 2 });

      // Add .context-forge to .gitignore
      await ensureGitignoreEntry(outputPath, '.context-forge/');

      console.log(
        chalk.blue(`📁 Configuration saved to: ${path.relative(process.cwd(), configPath)}`)
      );
      await progressTracker.completeStep(operationId, configStepId);

      // Generate documentation
      const docStepId = await progressTracker.addStep(operationId, 'Generate documentation');
      console.log(chalk.blue.bold('\n📝 Generating documentation...\n'));
      await generateDocumentation(config, outputPath);
      await progressTracker.completeStep(operationId, docStepId);

      // Success message
      console.log(chalk.green.bold('\n✨ Context Forge setup complete!\n'));
      console.log(chalk.white('Generated files in:'), chalk.cyan(outputPath));
      console.log(chalk.white('Configuration saved to:'), chalk.cyan('.context-forge/config.json'));

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

/**
 * Ensure a specific entry exists in .gitignore
 */
async function ensureGitignoreEntry(projectPath: string, entry: string): Promise<void> {
  const gitignorePath = path.join(projectPath, '.gitignore');

  try {
    let gitignoreContent = '';

    if (await fs.pathExists(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    }

    // Check if the entry already exists
    if (gitignoreContent.includes(entry)) {
      return;
    }

    // Add entry with a comment
    const newContent =
      gitignoreContent +
      (gitignoreContent.endsWith('\n') ? '' : '\n') +
      `\n# Context Forge configuration (added automatically)\n${entry}\n`;

    await fs.writeFile(gitignorePath, newContent, 'utf-8');
  } catch (error) {
    // Don't fail the entire process if gitignore update fails
    console.warn(chalk.yellow(`Warning: Could not update .gitignore: ${error}`));
  }
}

/**
 * Build a progress-emitting runGenerators callback for the Ink TUI.
 *
 * Suppresses console.log/error/warn and stderr writes while generateDocumentation
 * runs so its ora spinners don't fight with Ink's render loop.
 */
function buildTuiRunGenerators(
  options: { aiPrp?: boolean; ide?: SupportedIDE[] },
  outputPath: string
): RunGenerators {
  return async (config, onProgress) => {
    const steps: GenerationStep[] = [
      { id: 'validate', label: 'Validate output path', status: 'pending' },
      { id: 'aiprp', label: 'Check AI providers', status: 'pending' },
      { id: 'save', label: 'Save .context-forge/config.json', status: 'pending' },
      { id: 'docs', label: 'Generate documentation', status: 'pending' },
    ];

    const tick = (id: string, status: GenerationStep['status'], detail?: string): void => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) steps[idx] = { ...steps[idx], status, detail };
      onProgress(steps.map((s) => ({ ...s })));
    };

    // Step 1 — validate output path
    tick('validate', 'running');
    await validateOutputPath(outputPath);
    tick('validate', 'done');

    // Apply --ide override (TUI's choice can be replaced by CLI flag)
    if (options.ide && options.ide.length > 0) {
      config.targetIDEs = options.ide;
    }

    // Step 2 — AI PRP check
    tick('aiprp', 'running');
    if (options.aiPrp) {
      const availableProviders = await KeyManager.getAvailableProviders();
      if (availableProviders.length === 0) {
        config.extras.prp = true;
        tick('aiprp', 'done', 'no API keys — using template PRP');
      } else {
        config.extras.prp = true;
        config.extras.aiPrp = true;
        tick('aiprp', 'done', `using ${availableProviders[0].toUpperCase()}`);
      }
    } else {
      tick('aiprp', 'done', 'skipped');
    }

    // Step 3 — save config
    tick('save', 'running');
    const configDir = path.join(outputPath, '.context-forge');
    const configPath = path.join(configDir, 'config.json');
    await fs.ensureDir(configDir);
    await fs.writeJson(configPath, config, { spaces: 2 });
    await ensureGitignoreEntry(outputPath, '.context-forge/');
    tick('save', 'done', path.relative(process.cwd(), configPath));

    // Step 4 — generate documentation (silenced — Ink owns the screen)
    tick('docs', 'running');
    const restoreLog = console.log;
    const restoreError = console.error;
    const restoreWarn = console.warn;
    const restoreInfo = console.info;
    const restoreStderr = process.stderr.write.bind(process.stderr);

    const noop: typeof console.log = () => undefined;
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    process.stderr.write = ((): true => true) as typeof process.stderr.write;

    try {
      await generateDocumentation(config, outputPath);
    } finally {
      console.log = restoreLog;
      console.error = restoreError;
      console.warn = restoreWarn;
      console.info = restoreInfo;
      process.stderr.write = restoreStderr;
    }

    const ideCount = config.targetIDEs.length;
    tick('docs', 'done', `${ideCount} IDE config${ideCount === 1 ? '' : 's'}`);

    const result: GenerationResult = {
      outputPath,
      filesCreated: ideCount + (config.features?.length || 0),
      summary: `Documentation written under ${path.relative(process.cwd(), outputPath) || '.'}`,
    };
    return result;
  };
}

/**
 * Run the Ink-based init wizard. Throws on user cancellation; otherwise returns
 * after the user dismisses the Done screen.
 */
interface TuiModule {
  runInitTui: (opts: {
    outputPath: string;
    runGenerators: RunGenerators;
    initial?: Record<string, unknown>;
  }) => Promise<unknown>;
}

async function runInitWithTui(
  options: { aiPrp?: boolean; ide?: SupportedIDE[] },
  outputPath: string
): Promise<void> {
  const runGenerators = buildTuiRunGenerators(options, outputPath);
  // Dynamic import: the TUI module is compiled as ESM (see tsconfig.tui.json
  // and src/cli/tui/package.json) so it can load Ink, which requires a
  // top-level-await-capable graph via yoga-layout.
  //
  // The path is constructed at runtime so the main `tsc` invocation does not
  // walk into src/cli/tui (which has its own separate build).
  const tuiPath = path.join(__dirname, '..', 'tui', 'index.js');
  const dynamicImport = new Function('p', 'return import(p)') as (p: string) => Promise<TuiModule>;
  const tuiModule = await dynamicImport(tuiPath);
  await tuiModule.runInitTui({
    outputPath,
    runGenerators,
    initial: {
      targetIDEs: options.ide && options.ide.length > 0 ? options.ide : undefined,
    },
  });
}

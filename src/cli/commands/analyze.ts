import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { ProjectConfig, SupportedIDE } from '../../types';
import { getSupportedIDEs } from '../../adapters';
import { ProjectAnalyzer } from '../../services/projectAnalyzer';
import { ApiKeyManager } from '../../services/apiKeyManager';
import { runRetrofitPrompts } from '../prompts/retrofit';
import { generateDocumentation } from '../../generators';

export const analyzeCommand = new Command('analyze')
  .description('Analyze existing project and generate AI-optimized documentation')
  .option('-o, --output <path>', 'output directory for generated files', '.')
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
  .option('--no-ai', 'skip AI analysis and use pattern-based analysis only')
  .option('--config-only', 'generate configuration file only without documentation')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🔍 Context Forge Analyzer\n'));
    console.log(
      chalk.gray("Let's analyze your existing project and create AI-optimized documentation.\n")
    );

    const spinner = ora();
    const projectPath = process.cwd();
    const outputPath = path.resolve(options.output);

    try {
      // Initialize services
      const analyzer = new ProjectAnalyzer(projectPath);
      const apiKeyManager = new ApiKeyManager(projectPath);

      // Step 1: Basic Project Analysis
      spinner.start('Analyzing project structure...');
      const basicAnalysis = await analyzer.analyzeBasic();
      spinner.succeed(`Detected: ${basicAnalysis.summary}`);

      console.log(chalk.cyan('\n📊 Project Overview:'));
      console.log(`  • Type: ${basicAnalysis.projectType}`);
      console.log(`  • Tech Stack: ${basicAnalysis.techStack.join(', ')}`);
      console.log(`  • Components: ${basicAnalysis.fileStats.components} files`);
      console.log(`  • API Routes: ${basicAnalysis.fileStats.routes} files`);
      if (basicAnalysis.existingDocs.length > 0) {
        console.log(`  • Documentation: ${basicAnalysis.existingDocs.join(', ')}`);
      }

      let detailedAnalysis = null;

      // Step 2: AI Analysis (if requested)
      if (options.ai !== false) {
        const useAI = await analyzer.shouldUseAI();

        if (useAI) {
          const apiKey = await apiKeyManager.setupApiKey();
          if (apiKey) {
            spinner.start('Analyzing with AI...');
            detailedAnalysis = await analyzer.analyzeDeep(apiKey);
            spinner.succeed('AI analysis complete');

            if (detailedAnalysis.insights.length > 0) {
              console.log(chalk.cyan('\n🤖 AI Insights:'));
              detailedAnalysis.insights.forEach((insight) => {
                console.log(`  • ${insight}`);
              });
            }
          }
        }
      }

      // Step 3: Retrofit Questions
      spinner.start('Preparing project-specific questions...');
      const config: ProjectConfig = await runRetrofitPrompts(
        basicAnalysis,
        detailedAnalysis,
        options.ide
      );
      spinner.succeed('Configuration complete');

      // Step 4: Generate Documentation
      if (!options.configOnly) {
        spinner.start('Generating AI-optimized documentation...');
        await generateDocumentation(config, outputPath);
        spinner.succeed('Documentation generated successfully!');

        console.log(chalk.green('\n✅ Analysis and generation complete!'));
        console.log(chalk.gray(`\nFiles generated in: ${outputPath}`));
        console.log(chalk.gray('Your existing project now has AI-optimized documentation.'));
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      throw error;
    }
  });

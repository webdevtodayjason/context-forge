import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { ProjectConfig, SupportedIDE } from '../../types';
import { getSupportedIDEs } from '../../adapters';
import { ProjectAnalyzer } from '../../services/projectAnalyzer';
import { ApiKeyManager } from '../../services/apiKeyManager';
import { runRetrofitPrompts } from '../prompts/retrofit';
import { generateDocumentation } from '../../generators';
import { version } from '../../../package.json';

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
      let apiConfig = null;

      // Step 2: AI Analysis (if requested)
      if (options.ai !== false) {
        const useAI = await analyzer.shouldUseAI();

        if (useAI) {
          apiConfig = await apiKeyManager.setupApiKey();
          if (apiConfig) {
            spinner.start('Analyzing with AI...');
            detailedAnalysis = await analyzer.analyzeDeep(apiConfig);
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
      spinner.stop(); // Stop spinner before interactive prompts
      const config: ProjectConfig = await runRetrofitPrompts(
        basicAnalysis,
        detailedAnalysis,
        options.ide
      );
      console.log(chalk.green('✔ Configuration complete'));

      // Step 4: Generate Documentation
      if (!options.configOnly) {
        spinner.start('Generating AI-optimized documentation...');
        await generateDocumentation(config, outputPath);
        spinner.succeed('Documentation generated successfully!');

        console.log(chalk.green('\n✅ Analysis and generation complete!'));
        
        // Show comprehensive summary
        console.log(chalk.blue.bold('\n📋 Summary of Changes:\n'));
        
        // API Configuration
        if (apiConfig) {
          console.log(chalk.cyan('🔑 API Configuration:'));
          console.log(`   • API key stored in: ${chalk.green('.context-forge-api')}`);
          console.log(`   • Provider: ${chalk.green(apiConfig.provider)}`);
          console.log(`   • Added to .gitignore: ${chalk.green('✓')}\n`);
        }
        
        // Generated Files
        console.log(chalk.cyan('📁 Generated Files:'));
        console.log(chalk.gray('   ' + outputPath + '/'));
        
        // CLAUDE.md status
        const claudeMdPath = path.join(outputPath, 'CLAUDE.md');
        if (await fs.pathExists(claudeMdPath)) {
          console.log(chalk.yellow('   ├── CLAUDE.md (UPDATED - appended retrofit section)'));
        }
        
        // Docs folder
        const docsPath = path.join(outputPath, 'Docs');
        if (await fs.pathExists(docsPath)) {
          console.log('   ├── Docs/');
          const docFiles = await fs.readdir(docsPath);
          docFiles.forEach((file, index) => {
            const isLast = index === docFiles.length - 1;
            console.log(`   │   ${isLast ? '└──' : '├──'} ${chalk.green(file)}`);
          });
        }
        
        // PRPs folder
        const prpsPath = path.join(outputPath, 'PRPs');
        if (await fs.pathExists(prpsPath)) {
          console.log('   └── PRPs/');
          const prpFiles = await fs.readdir(prpsPath);
          prpFiles.forEach((file, index) => {
            const isLast = index === prpFiles.length - 1;
            console.log(`       ${isLast ? '└──' : '├──'} ${chalk.green(file)}`);
          });
        }
        
        console.log(chalk.gray('\n💡 Next steps:'));
        console.log(chalk.gray('   1. Review the updated CLAUDE.md file'));
        console.log(chalk.gray('   2. Check the PRPs folder for feature-specific implementations'));
        console.log(chalk.gray('   3. Use these files with Claude Code for development'));
        
        // Save summary to file
        let summaryContent = `# Context Forge Retrofit Summary
Generated on: ${new Date().toLocaleString()}

## Project Analysis
- **Type**: ${config.projectType}
- **Tech Stack**: ${Object.values(config.techStack).filter(Boolean).join(', ')}
- **Components**: ${basicAnalysis.fileStats.components} files
- **API Routes**: ${basicAnalysis.fileStats.routes} files
- **Test Coverage**: ${basicAnalysis.fileStats.tests} test files

## API Configuration
${apiConfig ? `- **Provider**: ${apiConfig.provider}
- **Key Location**: .context-forge-api
- **Added to .gitignore**: ✓` : 'No API configuration used'}

## Generated Files

### Updated Files
- **CLAUDE.md**: Appended retrofit section with date marker

### New Files Created
`;

        // Add Docs files
        if (await fs.pathExists(docsPath)) {
          summaryContent += '\n#### Docs/\n';
          const docFiles = await fs.readdir(docsPath);
          docFiles.forEach(file => {
            summaryContent += `- ${file}\n`;
          });
        }
        
        // Add PRP files
        if (await fs.pathExists(prpsPath)) {
          summaryContent += '\n#### PRPs/\n';
          const prpFiles = await fs.readdir(prpsPath);
          prpFiles.forEach(file => {
            summaryContent += `- ${file}\n`;
          });
        }
        
        summaryContent += `\n## Planned Features
${config.plannedFeatures && config.plannedFeatures.length > 0 
  ? config.plannedFeatures.map(f => `- ${f}`).join('\n')
  : 'No specific features documented'}

## Next Steps
1. Review the updated CLAUDE.md file
2. Check the PRPs folder for feature-specific implementations
3. Use these files with Claude Code for development

---
*Generated by Context Forge v${version}*
`;

        const summaryPath = path.join(outputPath, 'retrofit-summary.md');
        await fs.writeFile(summaryPath, summaryContent);
        console.log(chalk.gray(`\n📄 Summary saved to: ${chalk.green('retrofit-summary.md')}`));
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      throw error;
    }
  });

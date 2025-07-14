import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { ProjectConfig, SupportedIDE } from '../../types';
import { getSupportedIDEs } from '../../adapters';
import { ProjectAnalyzer } from '../../services/projectAnalyzer';
import { FeatureAnalyzer } from '../../services/featureAnalyzer';
import { EnhancementPlanner } from '../../services/enhancementPlanner';
import { runEnhancementPrompts } from '../prompts/enhancement';
import { generateDocumentation } from '../../generators';
import { generateEnhancementPRPs } from '../../generators/enhancementPrp';
import { generateEnhancementCheckpoints } from '../../generators/enhancementCheckpoints';
import { generateEnhancementHooks } from '../../generators/enhancementHooks';
import { generateEnhancementCommands } from '../../generators/enhancementCommands';
import { ErrorRecoveryService } from '../../services/errorRecoveryService';

export const enhanceCommand = new Command('enhance')
  .description('Plan and implement new features for existing projects')
  .option('-o, --output <path>', 'output directory for enhancement files', '.')
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
  .option('--analyze-only', 'only analyze and show enhancement plan without generating files')
  .option('--quick', 'skip detailed analysis and use quick enhancement setup')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 Context Forge Enhancement Assistant\n'));
    console.log(chalk.gray("Let's plan new features for your existing project.\n"));

    const spinner = ora();
    const projectPath = process.cwd();
    const outputPath = path.resolve(options.output);
    const errorRecovery = new ErrorRecoveryService();
    let config: ProjectConfig | undefined;

    try {
      // Initialize services
      const projectAnalyzer = new ProjectAnalyzer(projectPath);
      const featureAnalyzer = new FeatureAnalyzer(projectPath);

      // Step 1: Analyze current project
      spinner.start('Analyzing current project...');
      const basicAnalysis = await projectAnalyzer.analyzeBasic();
      const detailedAnalysis = !options.quick
        ? await projectAnalyzer.analyzeDeep({ provider: 'anthropic', apiKey: '' })
        : null;
      spinner.succeed(`Current stack: ${basicAnalysis.techStack.join(', ')}`);

      // Display project overview
      console.log(chalk.cyan('\n📊 Current Project Analysis:'));
      console.log(`  • Type: ${basicAnalysis.projectType}`);
      console.log(`  • Tech Stack: ${basicAnalysis.techStack.join(', ')}`);
      console.log(`  • Components: ${basicAnalysis.fileStats.components} files`);
      console.log(`  • API Routes: ${basicAnalysis.fileStats.routes} files`);
      console.log(`  • Test Files: ${basicAnalysis.fileStats.tests}`);
      console.log(`  • Total Files: ${basicAnalysis.fileStats.total}`);

      if (detailedAnalysis && detailedAnalysis.codeQuality) {
        console.log(chalk.cyan('\n📈 Code Quality:'));
        console.log(`  • Quality Score: ${detailedAnalysis.codeQuality.score}/100`);
        console.log(`  • Issues Found: ${detailedAnalysis.codeQuality.issues.length}`);
        console.log(`  • Suggestions: ${detailedAnalysis.codeQuality.suggestions.length}`);
      }

      // Step 2: Run enhancement prompts
      spinner.stop(); // Stop spinner before interactive prompts
      config = await runEnhancementPrompts(basicAnalysis, detailedAnalysis, options.ide);

      if (!config.enhancementConfig) {
        throw new Error('Enhancement configuration not created');
      }

      // Step 3: Analyze feature feasibility
      if (!options.quick && config.enhancementConfig.features.length > 0) {
        spinner.start('Analyzing feature feasibility...');
        const feasibilityAnalysis = await featureAnalyzer.analyzeFeasibility(
          config.enhancementConfig.features,
          basicAnalysis
        );
        spinner.succeed('Feature analysis complete');

        // Display feasibility results
        console.log(chalk.cyan('\n🔍 Feature Feasibility Analysis:'));
        feasibilityAnalysis.forEach((analysis) => {
          const icon =
            analysis.feasibility === 'high'
              ? '🟢'
              : analysis.feasibility === 'medium'
                ? '🟡'
                : '🔴';
          console.log(`  ${icon} ${analysis.featureName}: ${analysis.feasibility} feasibility`);
          if (analysis.concerns.length > 0) {
            analysis.concerns.forEach((concern) => {
              console.log(`     ⚠️  ${concern}`);
            });
          }
        });
      }

      // Step 4: Create enhancement plan
      if (!options.quick) {
        spinner.start('Creating enhancement plan...');
        const enhancementPlanner = new EnhancementPlanner(projectPath, config.enhancementConfig);
        const enhancementPlan = await enhancementPlanner.createPlan(basicAnalysis);
        config.enhancementConfig = enhancementPlan;
        spinner.succeed('Enhancement plan created');

        // Display enhancement plan
        console.log(chalk.cyan('\n📋 Enhancement Plan:'));
        console.log(
          `  • Strategy: ${chalk.green(config.enhancementConfig.implementationStrategy)}`
        );
        console.log(`  • Phases: ${config.enhancementConfig.enhancementPhases.length}`);
        console.log(`  • Duration: ${chalk.yellow(config.enhancementConfig.estimatedDuration)}`);

        config.enhancementConfig.enhancementPhases.forEach((phase, index) => {
          console.log(chalk.cyan(`\n  Phase ${index + 1}: ${phase.name}`));
          console.log(`    Features: ${phase.features.length}`);
          console.log(`    Tasks: ${phase.tasks.length}`);
          console.log(`    Duration: ${phase.estimatedDuration}`);
        });
      }

      if (options.analyzeOnly) {
        console.log(chalk.green('\n✅ Analysis complete!'));
        return;
      }

      // Step 5: Generate enhancement artifacts
      console.log(chalk.blue.bold('\n📝 Generating enhancement artifacts...\n'));

      // Generate base documentation
      spinner.start('Generating base documentation...');
      await generateDocumentation(config, outputPath);
      spinner.succeed('Base documentation generated');

      // Generate enhancement-specific PRPs
      spinner.start('Generating enhancement PRPs...');
      const enhancementPRPs = await generateEnhancementPRPs(config);
      for (const prp of enhancementPRPs) {
        const prpPath = path.join(outputPath, prp.path);
        await fs.ensureDir(path.dirname(prpPath));
        await fs.writeFile(prpPath, prp.content);
      }
      spinner.succeed(`Generated ${enhancementPRPs.length} enhancement PRPs`);

      // Generate enhancement commands
      spinner.start('Generating enhancement commands...');
      const commands = await generateEnhancementCommands(config);
      for (const command of commands) {
        const commandPath = path.join(outputPath, command.path);
        await fs.ensureDir(path.dirname(commandPath));
        await fs.writeFile(commandPath, command.content);
      }
      spinner.succeed('Enhancement commands configured');

      // Generate enhancement checkpoints
      if (config.extras.checkpoints) {
        spinner.start('Generating enhancement checkpoints...');
        await generateEnhancementCheckpoints(config);
        spinner.succeed('Enhancement checkpoints configured');
      }

      // Generate enhancement hooks
      if (config.extras.hooks) {
        spinner.start('Generating enhancement hooks...');
        const hooks = await generateEnhancementHooks(config);
        for (const hook of hooks) {
          const hookPath = path.join(outputPath, hook.path);
          await fs.ensureDir(path.dirname(hookPath));
          await fs.writeFile(hookPath, hook.content);
          if (hook.path.endsWith('.py')) {
            await fs.chmod(hookPath, 0o755);
          }
        }
        spinner.succeed(`Generated ${hooks.length} enhancement hooks`);
      }

      // Generate enhancement summary
      const summaryContent = await generateEnhancementSummary(config, basicAnalysis);
      const summaryPath = path.join(outputPath, 'ENHANCEMENT_PLAN.md');
      await fs.writeFile(summaryPath, summaryContent);

      // Success message
      console.log(chalk.green.bold('\n✨ Enhancement plan generated successfully!\n'));

      // Show file structure
      console.log(chalk.cyan('📁 Generated Enhancement Structure:'));
      console.log(chalk.gray('   ' + outputPath + '/'));
      console.log('   ├── ENHANCEMENT_PLAN.md');
      console.log('   ├── CLAUDE.md (updated with enhancement context)');
      console.log('   ├── PRPs/');
      console.log('   │   ├── enhancement-overview.md');

      if (config.enhancementConfig) {
        config.enhancementConfig.features.forEach((feature) => {
          console.log(`   │   ├── feature-${feature.id}.md`);
        });
        console.log('   │   └── implementation-guide.md');

        if (config.extras.checkpoints) {
          console.log('   └── .claude/');
          console.log('       └── commands/');
          console.log('           └── enhancement/');
          console.log('               ├── enhancement-status.md');
          console.log('               ├── feature-status.md');
          console.log('               └── enhancement-validate.md');
        }
      }

      // Next steps
      console.log(chalk.blue.bold('\n🎯 Next Steps:\n'));
      console.log(chalk.white('1. Review ENHANCEMENT_PLAN.md for the complete strategy'));
      console.log(chalk.white('2. Check PRPs folder for feature-specific implementation guides'));
      console.log(chalk.white('3. Use /enhancement-status to track overall progress'));
      console.log(chalk.white('4. Implement features according to the phased plan'));
      console.log(chalk.white('5. Use checkpoints to validate each milestone'));
      console.log(chalk.white('6. Run /enhancement-validate before marking features complete'));

      if (config.enhancementConfig && config.enhancementConfig.features.length > 0) {
        const criticalFeatures = config.enhancementConfig.features.filter(
          (f) => f.priority === 'critical'
        );
        if (criticalFeatures.length > 0) {
          console.log(chalk.yellow('\n⚠️  Critical Features:'));
          criticalFeatures.forEach((feature) => {
            console.log(chalk.red(`   • ${feature.name}: ${feature.description}`));
          });
        }
      }
    } catch (error) {
      spinner.fail('Enhancement planning failed');

      // Use error recovery service to provide intelligent suggestions
      await errorRecovery.handleError(error as Error, {
        command: 'enhance',
        operation: 'enhancement planning',
        projectPath,
        config,
      });

      throw error;
    }
  });

async function generateEnhancementSummary(
  config: ProjectConfig,
  basicAnalysis: Record<string, unknown>
): Promise<string> {
  const enhancement = config.enhancementConfig;
  if (!enhancement) {
    return '# Enhancement Plan\n\nNo enhancement configuration generated.';
  }

  const featuresByPriority = {
    critical: enhancement.features.filter((f) => f.priority === 'critical'),
    high: enhancement.features.filter((f) => f.priority === 'high'),
    medium: enhancement.features.filter((f) => f.priority === 'medium'),
    low: enhancement.features.filter((f) => f.priority === 'low'),
  };

  return `# Enhancement Plan: ${config.projectName}

Generated on: ${new Date().toLocaleString()}

## Executive Summary

**Project**: ${enhancement.projectName}  
**Current Stack**: ${enhancement.existingStack.name} (${Array.isArray(basicAnalysis.techStack) ? basicAnalysis.techStack.join(', ') : 'Unknown'})  
**Features Planned**: ${enhancement.features.length}  
**Implementation Strategy**: ${enhancement.implementationStrategy}  
**Estimated Duration**: ${enhancement.estimatedDuration}

## Features Overview

### Priority Breakdown
- **Critical**: ${featuresByPriority.critical.length} features
- **High**: ${featuresByPriority.high.length} features
- **Medium**: ${featuresByPriority.medium.length} features
- **Low**: ${featuresByPriority.low.length} features

## Planned Features

${enhancement.features
  .map(
    (feature) => `### ${feature.name}
**ID**: ${feature.id}  
**Priority**: ${feature.priority}  
**Complexity**: ${feature.complexity}  
**Category**: ${feature.category}  
**Effort**: ${feature.estimatedEffort}

${feature.description}

#### Acceptance Criteria
${feature.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n')}

#### Technical Requirements
${feature.technicalRequirements.map((req) => `- ${req}`).join('\n')}

${
  feature.dependencies.length > 0
    ? `#### Dependencies
${feature.dependencies.map((dep) => `- ${dep}`).join('\n')}`
    : ''
}

${
  feature.risks.length > 0
    ? `#### Risks
${feature.risks
  .map((risk) => `- **${risk.category}** (${risk.impact}): ${risk.description}`)
  .join('\n')}`
    : ''
}`
  )
  .join('\n\n')}

## Implementation Phases

${enhancement.enhancementPhases
  .map(
    (phase, index) => `### Phase ${index + 1}: ${phase.name}
**Duration**: ${phase.estimatedDuration}  
**Features**: ${phase.features.join(', ')}

${phase.description}

#### Tasks (${phase.tasks.length})
${phase.tasks
  .slice(0, 5)
  .map((task) => `- ${task.name} (${task.complexity})`)
  .join('\n')}${phase.tasks.length > 5 ? `\n- ... and ${phase.tasks.length - 5} more tasks` : ''}

#### Validation Criteria
${phase.validationCriteria.map((criteria) => `- ${criteria}`).join('\n')}

#### Checkpoints
${phase.checkpoints
  .map((checkpoint) => `- **${checkpoint.name}**: ${checkpoint.description}`)
  .join('\n')}
`
  )
  .join('\n')}

## Validation Strategy

${Object.entries(enhancement.validationStrategy)
  .filter(([_, enabled]) => enabled)
  .map(([strategy, _]) => `- ✅ ${strategy.replace(/([A-Z])/g, ' $1').trim()}`)
  .join('\n')}

## Success Criteria

1. All features implemented according to specifications
2. All acceptance criteria met for each feature
3. No regression in existing functionality
4. Performance benchmarks maintained or improved
5. All validation tests passing
6. Documentation updated for new features

## Commands and Tools

### Enhancement Management
- \`/enhancement-status\` - Check overall enhancement progress
- \`/feature-status [feature-id]\` - Check specific feature progress
- \`/enhancement-validate\` - Run validation suite
- \`/feature-complete [feature-id]\` - Mark feature as complete

### Monitoring
- \`/enhancement-metrics\` - View implementation metrics
- \`/feature-dependencies\` - Check feature dependency graph
- \`/enhancement-risks\` - Review current risk status

## Resources

- PRPs folder contains detailed implementation guides for each feature
- .claude/hooks contains enhancement-specific automation
- Checkpoint system will validate progress at critical milestones

---
*Generated by Context Forge Enhancement Assistant*
`;
}

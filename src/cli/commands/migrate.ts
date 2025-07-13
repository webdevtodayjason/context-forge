import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { ProjectConfig, SupportedIDE, TechStackInfo } from '../../types';
import { getSupportedIDEs } from '../../adapters';
import { ProjectAnalyzer, BasicAnalysis } from '../../services/projectAnalyzer';
import { MigrationAnalyzer } from '../../services/migrationAnalyzer';
import { runMigrationPrompts } from '../prompts/migration';
import { generateDocumentation } from '../../generators';
import { generateMigrationPRPs } from '../../generators/migrationPrp';
import { generateMigrationCheckpoints } from '../../generators/migrationCheckpoints';
import { generateMigrationHooks } from '../../generators/migrationHooks';

export const migrateCommand = new Command('migrate')
  .description('Create a comprehensive migration plan for technology stack transitions')
  .option('-o, --output <path>', 'output directory for migration files', '.')
  .option('-s, --source <stack>', 'source technology stack (auto-detected if not provided)')
  .option('-t, --target <stack>', 'target technology stack')
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
  .option('--analyze-only', 'only analyze and show migration complexity without generating files')
  .option('--quick', 'skip detailed analysis and use quick migration setup')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 Context Forge Migration Assistant\n'));
    console.log(chalk.gray("Let's create a safe migration plan for your technology transition.\n"));

    const spinner = ora();
    const projectPath = process.cwd();
    const outputPath = path.resolve(options.output);

    try {
      // Initialize services
      const projectAnalyzer = new ProjectAnalyzer(projectPath);

      // Step 1: Analyze current project
      spinner.start('Analyzing current project...');
      const basicAnalysis = await projectAnalyzer.analyzeBasic();
      spinner.succeed(`Current stack detected: ${basicAnalysis.techStack.join(', ')}`);

      // Display project overview
      console.log(chalk.cyan('\n📊 Current Project Analysis:'));
      console.log(`  • Type: ${basicAnalysis.projectType}`);
      console.log(`  • Tech Stack: ${basicAnalysis.techStack.join(', ')}`);
      console.log(`  • Components: ${basicAnalysis.fileStats.components} files`);
      console.log(`  • API Routes: ${basicAnalysis.fileStats.routes} files`);
      console.log(`  • Test Files: ${basicAnalysis.fileStats.tests}`);

      // Determine target stack
      let targetStack: Partial<TechStackInfo> = {};
      if (options.target) {
        targetStack.name = options.target;
      } else if (!options.quick) {
        // Will be determined in prompts
        targetStack = {};
      }

      // Initialize migration analyzer
      const migrationAnalyzer = new MigrationAnalyzer(projectPath, targetStack);

      // Step 2: Analyze migration complexity
      if (!options.quick) {
        spinner.start('Analyzing migration complexity...');
        const migrationAnalysis = await migrationAnalyzer.analyzeMigration(basicAnalysis);
        spinner.succeed('Migration analysis complete');

        // Display framework detection results
        if (migrationAnalysis.sourceStack.metadata) {
          console.log(chalk.cyan('\n🔍 Framework Detection:'));
          console.log(
            `  • Primary: ${chalk.green(migrationAnalysis.sourceStack.name)} v${migrationAnalysis.sourceStack.version || 'unknown'} (${migrationAnalysis.sourceStack.metadata.confidence}% confidence)`
          );

          const otherFrameworks = migrationAnalysis.sourceStack.metadata.detectedFrameworks
            .filter((f) => (f.variant || f.framework) !== migrationAnalysis.sourceStack.name)
            .slice(0, 3);

          if (otherFrameworks.length > 0) {
            console.log('  • Also detected:');
            otherFrameworks.forEach((f) => {
              const name = f.variant || f.framework;
              console.log(
                `    - ${name} ${f.version ? `v${f.version}` : ''} (${f.confidence}% confidence)`
              );
            });
          }
        }

        // Display migration complexity
        console.log(chalk.cyan('\n🎯 Migration Analysis:'));
        console.log(
          `  • Complexity: ${chalk.yellow(migrationAnalysis.complexity.level.toUpperCase())} (${migrationAnalysis.complexity.score}/100)`
        );
        console.log(
          `  • Recommended Strategy: ${chalk.green(migrationAnalysis.recommendedStrategy)}`
        );
        console.log(`  • Estimated Duration: ${chalk.yellow(migrationAnalysis.estimatedDuration)}`);
        console.log(`  • Shared Resources: ${migrationAnalysis.sharedResources.length}`);
        console.log(`  • Risk Factors: ${migrationAnalysis.risks.length}`);

        if (migrationAnalysis.complexity.factors.length > 0) {
          console.log(chalk.cyan('\n📈 Complexity Factors:'));
          migrationAnalysis.complexity.factors.forEach((factor) => {
            const impact = '█'.repeat(factor.impact) + '░'.repeat(10 - factor.impact);
            console.log(`  • ${factor.name}: [${impact}] ${factor.impact}/10`);
            console.log(`    ${chalk.gray(factor.description)}`);
          });
        }

        if (
          migrationAnalysis.breakingChangesSummary &&
          migrationAnalysis.breakingChangesSummary.total > 0
        ) {
          console.log(chalk.cyan('\n🔧 Breaking Changes:'));
          console.log(
            `  • Total: ${chalk.yellow(migrationAnalysis.breakingChangesSummary.total)} changes detected`
          );
          console.log(
            `  • Critical: ${chalk.red(migrationAnalysis.breakingChangesSummary.critical)}`
          );
          console.log(
            `  • Automatable: ${chalk.green(migrationAnalysis.breakingChangesSummary.automatable)}`
          );
          console.log(
            `  • Est. Hours: ${chalk.yellow(migrationAnalysis.breakingChangesSummary.estimatedHours)}`
          );

          if (migrationAnalysis.breakingChanges && migrationAnalysis.breakingChanges.length > 0) {
            console.log(chalk.gray('\n  Top Breaking Changes:'));
            migrationAnalysis.breakingChanges.slice(0, 3).forEach((change) => {
              const icon =
                change.severity === 'critical' ? '🔴' : change.severity === 'high' ? '🟡' : '🟢';
              console.log(`  ${icon} ${change.description}`);
              if (change.automatable) {
                console.log(chalk.green(`     ✓ Automatable - ${change.effort} effort`));
              } else {
                console.log(
                  chalk.yellow(`     ⚠ Manual migration required - ${change.effort} effort`)
                );
              }
            });
          }
        }

        if (
          migrationAnalysis.dependencyAnalysis &&
          migrationAnalysis.dependencyAnalysis.totalDependencies > 0
        ) {
          console.log(chalk.cyan('\n📦 Dependency Analysis:'));
          console.log(
            `  • Total Dependencies: ${chalk.yellow(migrationAnalysis.dependencyAnalysis.totalDependencies)}`
          );
          console.log(
            `  • Incompatible: ${chalk.red(migrationAnalysis.dependencyAnalysis.incompatibleCount)}`
          );
          console.log(
            `  • Replacements Available: ${chalk.green(migrationAnalysis.dependencyAnalysis.hasReplacements)}`
          );
          console.log(
            `  • Complexity: ${chalk.yellow(migrationAnalysis.dependencyAnalysis.migrationComplexity.toUpperCase())}`
          );

          if (migrationAnalysis.dependencyAnalysis.incompatible.length > 0) {
            console.log(chalk.gray('\n  Top Incompatible Dependencies:'));
            migrationAnalysis.dependencyAnalysis.incompatible.slice(0, 3).forEach((dep) => {
              const icon =
                dep.severity === 'critical' ? '🔴' : dep.severity === 'high' ? '🟡' : '🟢';
              console.log(`  ${icon} ${dep.package} - ${dep.reason}`);
              if (dep.resolution) {
                console.log(chalk.green(`     → ${dep.resolution}`));
              }
            });
          }
        }

        if (migrationAnalysis.risks.length > 0) {
          console.log(chalk.cyan('\n⚠️  Migration Risks:'));
          migrationAnalysis.risks.slice(0, 5).forEach((risk) => {
            const icon = risk.impact === 'critical' ? '🔴' : risk.impact === 'high' ? '🟡' : '🟢';
            console.log(`  ${icon} ${risk.description}`);
            console.log(`     Impact: ${risk.impact}, Probability: ${risk.probability}`);
            console.log(`     Mitigation: ${chalk.gray(risk.mitigation)}`);
          });
        }

        if (options.analyzeOnly) {
          console.log(chalk.green('\n✅ Analysis complete!'));
          return;
        }
      }

      // Step 3: Run migration prompts
      spinner.stop(); // Stop spinner before interactive prompts
      const config: ProjectConfig = await runMigrationPrompts(
        basicAnalysis,
        targetStack,
        options.ide,
        options.quick
      );

      // Step 4: Generate migration artifacts
      console.log(chalk.blue.bold('\n📝 Generating migration artifacts...\n'));

      // Generate base documentation
      spinner.start('Generating base documentation...');
      await generateDocumentation(config, outputPath);
      spinner.succeed('Base documentation generated');

      // Generate migration-specific PRPs
      if (config.migrationConfig) {
        spinner.start('Generating migration PRPs...');
        const migrationPRPs = await generateMigrationPRPs(config);
        for (const prp of migrationPRPs) {
          const prpPath = path.join(outputPath, prp.path);
          await fs.ensureDir(path.dirname(prpPath));
          await fs.writeFile(prpPath, prp.content);
        }
        spinner.succeed(`Generated ${migrationPRPs.length} migration PRPs`);

        // Generate migration checkpoints
        if (config.extras.checkpoints) {
          spinner.start('Generating migration checkpoints...');
          await generateMigrationCheckpoints(config);
          // Checkpoints are integrated into slash commands
          spinner.succeed('Migration checkpoints configured');
        }

        // Generate migration hooks
        if (config.extras.hooks) {
          spinner.start('Generating migration hooks...');
          const hooks = await generateMigrationHooks(config);
          for (const hook of hooks) {
            const hookPath = path.join(outputPath, hook.path);
            await fs.ensureDir(path.dirname(hookPath));
            await fs.writeFile(hookPath, hook.content);
            if (hook.path.endsWith('.py')) {
              await fs.chmod(hookPath, 0o755);
            }
          }
          spinner.succeed(`Generated ${hooks.length} migration hooks`);
        }
      }

      // Generate migration summary
      const summaryContent = await generateMigrationSummary(config, basicAnalysis);
      const summaryPath = path.join(outputPath, 'MIGRATION_PLAN.md');
      await fs.writeFile(summaryPath, summaryContent);

      // Success message
      console.log(chalk.green.bold('\n✨ Migration plan generated successfully!\n'));

      // Show file structure
      console.log(chalk.cyan('📁 Generated Migration Structure:'));
      console.log(chalk.gray('   ' + outputPath + '/'));
      console.log('   ├── MIGRATION_PLAN.md');
      console.log('   ├── CLAUDE.md (updated with migration context)');

      if (config.migrationConfig) {
        console.log('   ├── PRPs/');
        console.log('   │   ├── migration-overview.md');
        config.migrationConfig.migrationPhases.forEach((phase, index) => {
          const isLast = index === config.migrationConfig!.migrationPhases.length - 1;
          console.log(`   │   ${isLast ? '└──' : '├──'} phase-${phase.id}.md`);
        });

        if (config.extras.checkpoints) {
          console.log('   ├── .claude/');
          console.log('   │   └── commands/');
          console.log('   │       └── migration/');
          console.log('   │           ├── migration-status.md');
          console.log('   │           └── migration-checkpoint.md');
        }
      }

      // Next steps
      console.log(chalk.blue.bold('\n🎯 Next Steps:\n'));
      console.log(chalk.white('1. Review MIGRATION_PLAN.md for the complete strategy'));
      console.log(chalk.white('2. Check PRPs folder for phase-specific implementation guides'));
      console.log(chalk.white('3. Use /migration-status to track progress'));
      console.log(chalk.white('4. Follow checkpoints at critical milestones'));
      console.log(chalk.white('5. Test rollback procedures before production changes'));

      if (config.migrationConfig && config.migrationConfig.sharedResources.length > 0) {
        console.log(chalk.yellow('\n⚠️  Important Reminders:'));
        config.migrationConfig.sharedResources.forEach((resource) => {
          if (resource.criticalityLevel === 'critical') {
            console.log(chalk.red(`   • ${resource.name}: ${resource.migrationStrategy}`));
          }
        });
      }
    } catch (error) {
      spinner.fail('Migration planning failed');
      throw error;
    }
  });

async function generateMigrationSummary(
  config: ProjectConfig,
  basicAnalysis: BasicAnalysis
): Promise<string> {
  const migration = config.migrationConfig;
  if (!migration) {
    return '# Migration Plan\n\nNo migration configuration generated.';
  }

  return `# Migration Plan: ${config.projectName}

Generated on: ${new Date().toLocaleString()}

## Executive Summary

**Migration**: ${migration.sourceStack.name} → ${migration.targetStack.name}  
**Strategy**: ${migration.strategy}  
**Risk Level**: ${migration.riskLevel.toUpperCase()}  
**Estimated Duration**: ${migration.migrationPhases.length} phases

## Current State Analysis

- **Project Type**: ${config.projectType}
- **Current Stack**: ${basicAnalysis.techStack.join(', ')}
- **Components**: ${basicAnalysis.fileStats.components} files
- **API Routes**: ${basicAnalysis.fileStats.routes} files
- **Test Coverage**: ${basicAnalysis.fileStats.tests} test files

## Migration Strategy: ${migration.strategy}

${
  migration.strategy === 'parallel-run'
    ? `### Parallel Run Approach
Both systems will run simultaneously during migration, allowing for:
- Zero downtime migration
- Gradual traffic shifting
- Easy rollback capability
- A/B testing opportunities`
    : migration.strategy === 'incremental'
      ? `### Incremental Migration
Features will be migrated one at a time, providing:
- Reduced risk per deployment
- Continuous delivery capability
- Early feedback opportunities
- Flexible timeline management`
      : `### Big Bang Migration
Complete system replacement in a single cutover:
- Shortest overall timeline
- Single testing phase
- Clear cutover point
- Requires comprehensive preparation`
}

## Shared Resources

${migration.sharedResources
  .map(
    (resource) =>
      `### ${resource.name} (${resource.type})
- **Criticality**: ${resource.criticalityLevel}
- **Strategy**: ${resource.migrationStrategy}
- **Description**: ${resource.description}`
  )
  .join('\n\n')}

## Migration Phases

${migration.migrationPhases
  .map(
    (phase, index) =>
      `### Phase ${index + 1}: ${phase.name}
**Duration**: ${phase.estimatedDuration}  
**Rollback Point**: ${phase.rollbackPoint ? '✅ Yes' : '❌ No'}

${phase.description}

#### Validation Criteria
${phase.validationCriteria.map((criteria) => `- ${criteria}`).join('\n')}

#### Critical Checkpoints
${phase.criticalCheckpoints
  .map((checkpoint) => `- **${checkpoint.name}**: ${checkpoint.description}`)
  .join('\n')}
`
  )
  .join('\n')}

## Risk Management

### Identified Risks
${migration.rollbackStrategy.triggers
  .map((trigger) => `- **${trigger.condition}** (${trigger.severity}): ${trigger.action}`)
  .join('\n')}

### Rollback Strategy
- **Automatic Rollback**: ${migration.rollbackStrategy.automatic ? 'Enabled' : 'Manual'}
- **Data Backup Required**: ${migration.rollbackStrategy.dataBackupRequired ? 'Yes' : 'No'}
- **Estimated Rollback Time**: ${migration.rollbackStrategy.estimatedTime}

## Success Criteria

1. All validation criteria met for each phase
2. No critical issues in production
3. Performance metrics within acceptable range
4. Zero data loss during migration
5. Successful rollback capability demonstrated

## Commands and Tools

### Migration Management
- \`/migration-status\` - Check current migration progress
- \`/migration-checkpoint [phase]\` - Trigger manual checkpoint
- \`/migration-validate\` - Run validation suite
- \`/migration-rollback [phase]\` - Execute rollback procedure

### Monitoring
- \`/migration-compare\` - Compare old vs new system metrics
- \`/migration-logs\` - View migration-specific logs
- \`/migration-health\` - System health check

## Resources

- PRPs folder contains detailed implementation guides for each phase
- .claude/hooks contains migration-specific automation
- Checkpoint system will pause at critical points for verification

---
*Generated by Context Forge Migration Assistant*
`;
}

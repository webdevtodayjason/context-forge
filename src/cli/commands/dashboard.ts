import { Command } from 'commander';
import chalk from 'chalk';
import { ProgressTracker, ProgressEntry, ProgressSummary } from '../../services/progressTracker';
import { ProjectAnalyzer } from '../../services/projectAnalyzer';

export const dashboardCommand = new Command('dashboard')
  .description('Show progress dashboard and project status')
  .option('-w, --watch', 'watch mode - continuously update dashboard')
  .option('-h, --history', 'show full operation history')
  .option('-s, --summary', 'show summary statistics only')
  .option('--clear-old [days]', 'clear operations older than specified days (default: 30)', '30')
  .action(async (options) => {
    const tracker = new ProgressTracker();

    if (options.clearOld) {
      const days = parseInt(options.clearOld);
      const removed = await tracker.clearHistory(days);
      console.log(chalk.green(`✅ Cleared ${removed} operations older than ${days} days\n`));
      return;
    }

    if (options.watch) {
      await watchDashboard(tracker);
    } else if (options.history) {
      await showFullHistory(tracker);
    } else if (options.summary) {
      await showSummary(tracker);
    } else {
      await showDashboard(tracker);
    }
  });

async function showDashboard(tracker: ProgressTracker): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold('📊 Context Forge Dashboard\n'));

  // Current operation
  const currentOp = await tracker.getCurrentOperation();
  if (currentOp) {
    console.log(chalk.yellow.bold('🔄 Current Operation'));
    displayOperation(currentOp, true);
    console.log('');
  }

  // Summary statistics
  const summary = await tracker.getProgressSummary();
  console.log(chalk.cyan.bold('📈 Summary Statistics'));
  displaySummaryStats(summary);
  console.log('');

  // Recent activity
  if (summary.recentActivity.length > 0) {
    console.log(chalk.cyan.bold('📅 Recent Activity (Last 7 days)'));
    summary.recentActivity.slice(0, 5).forEach((op) => {
      displayOperation(op, false);
    });
    console.log('');
  }

  // Project status
  await showProjectStatus();

  console.log(chalk.gray('💡 Use --watch for real-time updates, --history for full history'));
}

async function watchDashboard(tracker: ProgressTracker): Promise<void> {
  console.log(chalk.blue.bold('👀 Watch Mode - Press Ctrl+C to exit\n'));

  const updateInterval = 2000; // 2 seconds

  const update = async () => {
    console.clear();
    console.log(chalk.blue.bold('📊 Context Forge Dashboard (Live)\n'));
    console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}\n`));

    const currentOp = await tracker.getCurrentOperation();
    if (currentOp) {
      console.log(chalk.yellow.bold('🔄 Current Operation'));
      displayOperation(currentOp, true);
      console.log('');
    } else {
      console.log(chalk.gray('💤 No operations in progress\n'));
    }

    const summary = await tracker.getProgressSummary();
    console.log(chalk.cyan.bold('📈 Quick Stats'));
    console.log(
      `Total: ${summary.totalOperations} | Completed: ${chalk.green(summary.completedOperations)} | Failed: ${chalk.red(summary.failedOperations)} | Success Rate: ${chalk.yellow(summary.successRate.toFixed(1))}%\n`
    );

    if (summary.recentActivity.length > 0) {
      console.log(chalk.cyan.bold('📅 Recent (Last 3)'));
      summary.recentActivity.slice(0, 3).forEach((op) => {
        displayOperation(op, false);
      });
    }

    console.log(chalk.gray('\n🔄 Updating every 2 seconds... Press Ctrl+C to exit'));
  };

  // Initial update
  await update();

  // Set up interval
  const interval = setInterval(update, updateInterval);

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(chalk.yellow('\n👋 Dashboard watch stopped'));
    process.exit(0);
  });
}

async function showFullHistory(tracker: ProgressTracker): Promise<void> {
  console.log(chalk.blue.bold('📜 Full Operation History\n'));

  const progress = await tracker.getProgress();

  if (progress.length === 0) {
    console.log(chalk.gray('No operations found'));
    return;
  }

  // Group by date
  const groupedByDate = progress.reduce(
    (groups, op) => {
      const date = op.startTime.toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(op);
      return groups;
    },
    {} as Record<string, ProgressEntry[]>
  );

  Object.entries(groupedByDate)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(([date, ops]) => {
      console.log(chalk.cyan.bold(`📅 ${date}`));
      ops.forEach((op) => displayOperation(op, false));
      console.log('');
    });
}

async function showSummary(tracker: ProgressTracker): Promise<void> {
  console.log(chalk.blue.bold('📊 Summary Statistics\n'));

  const summary = await tracker.getProgressSummary();
  displaySummaryStats(summary);
}

function displayOperation(op: ProgressEntry, detailed: boolean = false): void {
  const icon = new ProgressTracker().getStatusIcon(op.status);
  const color = new ProgressTracker().getStatusColor(op.status) as any;
  const duration = op.duration ? new ProgressTracker().formatDuration(op.duration) : 'ongoing';

  console.log(`${icon} ${(chalk as any)[color](op.command)} - ${op.operation}`);
  console.log(
    `   ${chalk.gray(`Started: ${op.startTime.toLocaleString()}`)} ${op.duration ? chalk.gray(`• Duration: ${duration}`) : ''}`
  );

  if (op.metadata) {
    const details = [];
    if (op.metadata.filesGenerated) details.push(`${op.metadata.filesGenerated} files`);
    if (op.metadata.targetIDEs) details.push(`IDEs: ${op.metadata.targetIDEs.join(', ')}`);
    if (op.metadata.features) details.push(`${op.metadata.features.length} features`);
    if (op.metadata.phases) details.push(`${op.metadata.phases} phases`);
    if (op.metadata.aiEnabled !== undefined)
      details.push(`AI: ${op.metadata.aiEnabled ? 'enabled' : 'disabled'}`);

    if (details.length > 0) {
      console.log(`   ${chalk.gray(details.join(' • '))}`);
    }
  }

  if (detailed && op.steps && op.steps.length > 0) {
    console.log(chalk.gray('   Steps:'));
    op.steps.forEach((step) => {
      const stepIcon =
        step.status === 'completed'
          ? '✓'
          : step.status === 'failed'
            ? '✗'
            : step.status === 'in_progress'
              ? '●'
              : '○';
      const stepColor =
        step.status === 'completed'
          ? 'green'
          : step.status === 'failed'
            ? 'red'
            : step.status === 'in_progress'
              ? 'yellow'
              : 'gray';
      console.log(`   ${chalk[stepColor](stepIcon)} ${step.name}`);
    });
  }

  if (op.metadata?.errors && op.metadata.errors.length > 0) {
    console.log(`   ${chalk.red('Errors:')} ${op.metadata.errors.join(', ')}`);
  }

  if (op.metadata?.warnings && op.metadata.warnings.length > 0) {
    console.log(`   ${chalk.yellow('Warnings:')} ${op.metadata.warnings.join(', ')}`);
  }
}

function displaySummaryStats(summary: ProgressSummary): void {
  const successRate = summary.successRate;
  const avgDuration = summary.averageDuration;

  console.log(`📊 Total Operations: ${chalk.white.bold(summary.totalOperations)}`);
  console.log(`✅ Completed: ${chalk.green.bold(summary.completedOperations)}`);
  console.log(`❌ Failed: ${chalk.red.bold(summary.failedOperations)}`);
  console.log(`🔄 In Progress: ${chalk.yellow.bold(summary.inProgressOperations)}`);
  console.log(
    `🎯 Success Rate: ${chalk[successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red'].bold(successRate.toFixed(1))}%`
  );

  if (avgDuration > 0) {
    const formattedDuration = new ProgressTracker().formatDuration(avgDuration);
    console.log(`⏱️  Average Duration: ${chalk.cyan.bold(formattedDuration)}`);
  }
}

async function showProjectStatus(): Promise<void> {
  try {
    console.log(chalk.cyan.bold('🏗️  Project Status'));

    const analyzer = new ProjectAnalyzer(process.cwd());
    const analysis = await analyzer.analyzeBasic();

    console.log(`📁 Project Type: ${chalk.white(analysis.projectType)}`);
    console.log(`🛠️  Tech Stack: ${chalk.white(analysis.techStack.join(', '))}`);
    console.log(
      `📊 Files: ${chalk.white(analysis.fileStats.total)} total, ${chalk.white(analysis.fileStats.components)} components, ${chalk.white(analysis.fileStats.routes)} routes`
    );

    if (analysis.fileStats.tests > 0) {
      console.log(`🧪 Tests: ${chalk.green(analysis.fileStats.tests)} test files`);
    } else {
      console.log(`🧪 Tests: ${chalk.red('No test files found')}`);
    }

    if (analysis.existingDocs.length > 0) {
      console.log(`📚 Documentation: ${chalk.green(analysis.existingDocs.join(', '))}`);
    } else {
      console.log(`📚 Documentation: ${chalk.yellow('No docs found')}`);
    }
  } catch {
    console.log(chalk.gray('🏗️  Project Status: Unable to analyze current directory'));
  }
}

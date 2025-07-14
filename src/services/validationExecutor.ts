import { exec } from 'child_process';
import { promisify } from 'util';
import { ProjectConfig } from '../types';
import { getValidationCommands, validationLevels } from '../data/validationCommands';
import { saveValidationReport, generateValidationSummary } from '../generators/validationReport';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export interface ValidationResult {
  level: string;
  command: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

export interface ValidationReport {
  projectName: string;
  timestamp: string;
  overallSuccess: boolean;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

export class ValidationExecutor {
  private projectPath: string;
  private config: ProjectConfig;
  private results: ValidationResult[] = [];

  constructor(projectPath: string, config: ProjectConfig) {
    this.projectPath = projectPath;
    this.config = config;
  }

  async runValidation(levels?: string[]): Promise<ValidationReport> {
    console.log(chalk.bold.blue('\n🔍 Running validation commands...\n'));

    const commands = getValidationCommands(this.config.techStack);
    const levelsToRun = levels || ['syntax', 'lint', 'tests', 'build'];

    for (const level of levelsToRun) {
      if (level === 'syntax' && commands.syntax) {
        await this.runCommandSet('syntax', commands.syntax);
      } else if (level === 'lint' && commands.lint) {
        await this.runCommand('lint', commands.lint);
      } else if (level === 'tests' && commands.tests) {
        await this.runCommandSet('tests', commands.tests);
      } else if (level === 'build' && commands.build) {
        await this.runCommand('build', commands.build);
      } else if (level === 'coverage' && commands.coverage) {
        await this.runCommand('coverage', commands.coverage);
      } else if (level === 'security' && commands.security) {
        await this.runCommandSet('security', commands.security);
      }
    }

    const report = this.generateReport();
    await this.saveReport(report);

    // Save markdown report
    const reportPath = await saveValidationReport(report, this.projectPath);
    console.log(chalk.gray(`\n📄 Full report saved to: ${reportPath}`));

    this.printSummary(report);

    return report;
  }

  private async runCommand(level: string, command: string): Promise<void> {
    const spinner = ora(`Running ${level}: ${command}`).start();
    const startTime = Date.now();

    try {
      const { stdout } = await execAsync(command, {
        cwd: this.projectPath,
        env: { ...process.env, CI: 'true' },
      });

      const duration = Date.now() - startTime;

      this.results.push({
        level,
        command,
        success: true,
        output: stdout,
        duration,
      });

      spinner.succeed(chalk.green(`✓ ${level} passed (${duration}ms)`));

      if (stdout && process.env.VERBOSE) {
        console.log(chalk.gray(stdout));
      }
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorOutput = error instanceof Error && 'stdout' in error ? (error as any).stdout : '';

      this.results.push({
        level,
        command,
        success: false,
        error: errorMessage,
        output: errorOutput,
        duration,
      });

      spinner.fail(chalk.red(`✗ ${level} failed (${duration}ms)`));

      if (errorOutput || (error instanceof Error && 'stderr' in error)) {
        const errorOutput2 =
          error instanceof Error && 'stderr' in error ? (error as any).stderr : '';
        console.log(chalk.red(errorOutput || errorOutput2));
      }

      // Only throw for critical errors
      const levelInfo = validationLevels[level as keyof typeof validationLevels];
      if (levelInfo?.critical) {
        throw new Error(`Critical validation failed: ${level}`);
      }
    }
  }

  private async runCommandSet(level: string, commands: string[]): Promise<void> {
    for (const command of commands) {
      await this.runCommand(`${level}:${command}`, command);
    }
  }

  private generateReport(): ValidationReport {
    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    return {
      projectName: this.config.projectName,
      timestamp: new Date().toISOString(),
      overallSuccess: failed === 0,
      results: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        skipped: 0,
      },
    };
  }

  private async saveReport(report: ValidationReport): Promise<void> {
    const reportsDir = path.join(this.projectPath, '.validation-reports');
    await fs.ensureDir(reportsDir);

    const filename = `validation-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeJson(filepath, report, { spaces: 2 });

    // Also save as latest
    const latestPath = path.join(reportsDir, 'latest.json');
    await fs.writeJson(latestPath, report, { spaces: 2 });
  }

  private printSummary(report: ValidationReport): void {
    console.log(generateValidationSummary(report));
  }

  // Generate a validation gate for PRP
  async generateValidationGate(): Promise<string> {
    const commands = getValidationCommands(this.config.techStack);

    let gate = '## Validation Gate\n\n';
    gate += 'Run the following commands to validate your implementation:\n\n';

    gate += '### Syntax & Type Checking\n';
    gate += '```bash\n';
    if (commands.syntax) {
      commands.syntax.forEach((cmd) => {
        gate += `${cmd}\n`;
      });
    }
    gate += '```\n\n';

    gate += '### Linting\n';
    gate += '```bash\n';
    gate += `${commands.lint || 'npm run lint'}\n`;
    gate += '```\n\n';

    gate += '### Tests\n';
    gate += '```bash\n';
    if (commands.tests) {
      commands.tests.forEach((cmd) => {
        gate += `${cmd}\n`;
      });
    }
    gate += '```\n\n';

    gate += '### Build\n';
    gate += '```bash\n';
    gate += `${commands.build}\n`;
    gate += '```\n\n';

    gate += '### Start Application\n';
    gate += '```bash\n';
    gate += `${commands.start}\n`;
    gate += '```\n\n';

    if (commands.security) {
      gate += '### Security Checks\n';
      gate += '```bash\n';
      commands.security.forEach((cmd) => {
        gate += `${cmd}\n`;
      });
      gate += '```\n\n';
    }

    gate += '✅ All commands must pass before considering the implementation complete.\n';

    return gate;
  }
}

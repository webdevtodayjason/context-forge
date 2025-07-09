import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { ValidationReport } from '../services/validationExecutor';

export async function generateValidationReport(report: ValidationReport): Promise<string> {
  const templatePath = path.join(__dirname, '../../templates/validation/report.md');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);

  // Handlebars already has built-in if, unless, and each helpers
  // No need to register them again

  return template(report);
}

export async function saveValidationReport(
  report: ValidationReport,
  projectPath: string
): Promise<string> {
  const reportContent = await generateValidationReport(report);
  const reportsDir = path.join(projectPath, '.validation-reports');
  await fs.ensureDir(reportsDir);

  // Save markdown report
  const filename = `validation-report-${Date.now()}.md`;
  const filepath = path.join(reportsDir, filename);
  await fs.writeFile(filepath, reportContent);

  // Also save as latest
  const latestPath = path.join(reportsDir, 'latest-report.md');
  await fs.writeFile(latestPath, reportContent);

  return filepath;
}

// Generate a summary for CLI output
export function generateValidationSummary(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push(`\n📊 Validation Report - ${report.projectName}`);
  lines.push('='.repeat(50));

  if (report.overallSuccess) {
    lines.push('✅ Status: PASSED');
  } else {
    lines.push('❌ Status: FAILED');
  }

  lines.push(
    `\nTotal: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed}`
  );

  if (report.results.some((r) => !r.success)) {
    lines.push('\nFailed Commands:');
    report.results
      .filter((r) => !r.success)
      .forEach((r) => {
        lines.push(`  ❌ ${r.level}: ${r.command}`);
      });
  }

  lines.push('\nRun "context-forge validate --report" for detailed report');

  return lines.join('\n');
}

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { spawn } from 'child_process';

export const runPrpCommand = new Command('run-prp')
  .description('Execute a PRP (Product Requirement Prompt) with Claude Code')
  .argument('[prp-name]', 'Name of the PRP file (without .md extension)')
  .option('-p, --prp-path <path>', 'Direct path to PRP file')
  .option('-i, --interactive', 'Run in interactive mode', true)
  .option('-o, --output-format <format>', 'Output format: text, json, stream-json', 'text')
  .option('-m, --model <model>', 'CLI executable for the LLM', 'claude')
  .action(async (prpName, options) => {
    console.log(chalk.blue.bold('\n🚀 Context Forge PRP Runner\n'));

    const spinner = ora();

    try {
      // Determine PRP file path
      let prpPath: string;

      if (options.prpPath) {
        prpPath = path.resolve(options.prpPath);
      } else if (prpName) {
        // Look in PRPs directory
        prpPath = path.join(process.cwd(), 'PRPs', `${prpName}.md`);

        // Also check with -prp suffix
        if (!(await fs.pathExists(prpPath))) {
          prpPath = path.join(process.cwd(), 'PRPs', `${prpName}-prp.md`);
        }
      } else {
        // Interactive selection
        const prpsDir = path.join(process.cwd(), 'PRPs');
        if (!(await fs.pathExists(prpsDir))) {
          console.error(
            chalk.red('No PRPs directory found. Run this command from a Context Forge project.')
          );
          process.exit(1);
        }

        const prpFiles = (await fs.readdir(prpsDir)).filter(
          (f) => f.endsWith('.md') && !f.includes('README') && !f.includes('template')
        );

        if (prpFiles.length === 0) {
          console.error(chalk.red('No PRP files found in PRPs directory.'));
          process.exit(1);
        }

        const { selectedPrp } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedPrp',
            message: 'Select a PRP to execute:',
            choices: prpFiles.map((f) => ({
              name: f.replace('.md', ''),
              value: path.join(prpsDir, f),
            })),
          },
        ]);

        prpPath = selectedPrp;
      }

      // Verify PRP exists
      if (!(await fs.pathExists(prpPath))) {
        console.error(chalk.red(`PRP file not found: ${prpPath}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n📄 Loading PRP: ${path.basename(prpPath)}`));

      // Read PRP content
      const prpContent = await fs.readFile(prpPath, 'utf-8');

      // Build meta prompt
      const metaPrompt = buildMetaPrompt(prpContent);

      // Check if claude is available
      spinner.start('Checking Claude Code availability...');
      const claudeAvailable = await checkClaudeAvailable();
      spinner.stop();

      if (!claudeAvailable) {
        console.error(chalk.red('\nClaude Code not found. Please install it first:'));
        console.log(chalk.yellow('npm install -g @anthropic-ai/claude-code'));
        process.exit(1);
      }

      // Execute with Claude
      console.log(chalk.cyan('\n🤖 Executing PRP with Claude Code...\n'));

      if (options.interactive) {
        // Interactive mode - user can continue conversation
        await runInteractive(metaPrompt);
      } else {
        // Headless mode - single execution
        await runHeadless(metaPrompt, options.outputFormat);
      }
    } catch (error) {
      spinner.fail('PRP execution failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

function buildMetaPrompt(prpContent: string): string {
  return `Ingest and understand the Product Requirement Prompt (PRP) below in detail.

# WORKFLOW GUIDANCE:

## Planning Phase
- Think hard before you code. Create a comprehensive plan addressing all requirements.
- Break down complex tasks into smaller, manageable steps.
- Use the TodoWrite tool to create and track your implementation plan.
- Identify implementation patterns from existing code to follow.

## Implementation Phase
- Follow code conventions and patterns found in existing files.
- Implement one component at a time and verify it works correctly.
- Write clear, maintainable code with appropriate comments.
- Consider error handling, edge cases, and potential security issues.
- Use type hints to ensure type safety.

## Testing Phase
- Test each component thoroughly as you build it.
- Use the provided validation gates to verify your implementation.
- Verify that all requirements have been satisfied.
- Run all validation commands and fix any issues.

## Example Implementation Approach:
1. Analyze the PRP requirements in detail
2. Search for and understand existing patterns in the codebase
3. Search the Web and gather additional context and examples
4. Create a step-by-step implementation plan with TodoWrite
5. Implement core functionality first, then additional features
6. Test and validate each component
7. Ensure all validation gates pass

When all validation gates pass and requirements are met, output "✅ PRP COMPLETE" on a new line.

---

# PRP CONTENT:

${prpContent}`;
}

async function checkClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const check = spawn('which', ['claude']);
    check.on('close', (code) => {
      resolve(code === 0);
    });
    check.on('error', () => {
      resolve(false);
    });
  });
}

async function runInteractive(prompt: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Start claude in interactive mode with prompt via stdin
    const claude = spawn('claude', [], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    // Send the prompt
    claude.stdin.write(prompt);
    claude.stdin.end();

    claude.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✅ PRP execution completed successfully!'));
        resolve();
      } else {
        reject(new Error(`Claude exited with code ${code}`));
      }
    });

    claude.on('error', (err) => {
      reject(err);
    });
  });
}

async function runHeadless(prompt: string, outputFormat: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Run claude with -p flag for single execution
    const args = ['-p', prompt];

    if (outputFormat !== 'text') {
      args.push('--output-format', outputFormat);
    }

    const claude = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    claude.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;

      if (outputFormat === 'stream-json') {
        // Stream JSON output line by line
        const lines = chunk.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            console.log(chalk.gray('[Stream]'), parsed);
          } catch {
            // Not valid JSON, skip
          }
        }
      }
    });

    claude.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    claude.on('close', (code) => {
      if (code === 0) {
        if (outputFormat === 'text') {
          console.log(output);
        } else if (outputFormat === 'json') {
          try {
            const parsed = JSON.parse(output);
            console.log(JSON.stringify(parsed, null, 2));
          } catch {
            console.error(chalk.red('Failed to parse JSON output'));
            console.log(output);
          }
        }

        if (output.includes('✅ PRP COMPLETE')) {
          console.log(chalk.green('\n✅ PRP execution completed successfully!'));
        }

        resolve();
      } else {
        console.error(chalk.red('Error output:'), errorOutput);
        reject(new Error(`Claude exited with code ${code}`));
      }
    });

    claude.on('error', (err) => {
      reject(err);
    });
  });
}

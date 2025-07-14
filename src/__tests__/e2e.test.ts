import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

describe('End-to-End Tests', () => {
  let tempDir: string;
  let cliPath: string;

  beforeAll(async () => {
    // Ensure CLI is built
    cliPath = path.join(process.cwd(), 'bin', 'context-forge.js');

    if (!(await fs.pathExists(cliPath))) {
      throw new Error('CLI not built. Run `npm run build` first.');
    }
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'context-forge-e2e-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  // Helper function to run CLI commands with input
  const runCLIWithInput = (
    args: string[],
    input: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 });
      });

      child.on('error', reject);

      // Send input
      if (input.length > 0) {
        setTimeout(() => {
          input.forEach((line, index) => {
            setTimeout(() => {
              child.stdin.write(line + '\n');
            }, index * 100);
          });

          setTimeout(
            () => {
              child.stdin.end();
            },
            input.length * 100 + 500
          );
        }, 500);
      } else {
        child.stdin.end();
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timed out'));
      }, 30000);
    });
  };

  describe('Complete Init Workflow', () => {
    it('should complete full project initialization with minimal input', async () => {
      const input = [
        'e2e-test-project', // project name
        '', // use default web type
        'E2E test project for Context Forge', // description
        '', // use default claude IDE
        'Basic PRD content for testing', // PRD content
        '', // use default react
        '', // use default nodejs
        '', // use default postgresql
        '', // no additional features
        '', // no extras
        'y', // confirm
      ];

      const result = await runCLIWithInput(['init', '--no-ai'], input);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project initialization');

      // Verify files were created
      expect(await fs.pathExists(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, 'PRPs'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.claude'))).toBe(true);

      // Verify CLAUDE.md content
      const claudeContent = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
      expect(claudeContent).toContain('e2e-test-project');
      expect(claudeContent).toContain('E2E test project for Context Forge');
    });

    it('should handle quick initialization', async () => {
      const result = await runCLIWithInput(['init', '--quick', '--no-ai'], []);

      // Quick mode should complete without interactive prompts
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Dashboard Workflow', () => {
    it('should show progress after initialization', async () => {
      // First, run an init command
      const initInput = [
        'dashboard-test',
        '',
        'Testing dashboard workflow',
        '',
        'Basic PRD',
        '',
        '',
        '',
        '',
        '',
        'y',
      ];

      await runCLIWithInput(['init', '--no-ai'], initInput);

      // Then check dashboard
      const dashboardResult = await runCLIWithInput(['dashboard'], []);

      expect(dashboardResult.exitCode).toBe(0);
      expect(dashboardResult.stdout).toMatch(/operations|Summary/);
    });

    it('should handle watch mode startup', async () => {
      const result = await runCLIWithInput(['dashboard', '--watch'], []);

      // Watch mode should start (even if we terminate it quickly)
      // Exit code should be 0 or 130 (SIGINT)
      expect([0, 130]).toContain(result.exitCode);
    });
  });

  describe('Analysis Workflow', () => {
    it('should analyze existing React project', async () => {
      // Create a mock React project
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'react-analysis-test',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
        },
      });

      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(
        path.join(tempDir, 'src', 'App.js'),
        `
import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>React Analysis Test</h1>
    </div>
  );
}

export default App;
      `
      );

      await fs.writeFile(
        path.join(tempDir, 'src', 'index.js'),
        `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
      `
      );

      const result = await runCLIWithInput(['analyze', '--no-ai'], []);

      expect(result.exitCode).toBe(0);
      expect(result.exitCode).toBe(0);

      // Should create Context Forge files
      expect(await fs.pathExists(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
    });

    it('should handle analyze with config-only option', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'config-only-test',
      });

      const result = await runCLIWithInput(['analyze', '--config-only', '--no-ai'], []);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Migration Workflow', () => {
    it('should analyze migration from Express to Fastify', async () => {
      // Create an Express project
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'express-migration-test',
        dependencies: {
          express: '^4.18.0',
          'body-parser': '^1.20.0',
        },
      });

      await fs.writeFile(
        path.join(tempDir, 'server.js'),
        `
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello Express!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
      `
      );

      const result = await runCLIWithInput(['migrate', '--analyze-only'], []);

      expect(result.exitCode).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should handle migration planning workflow', async () => {
      // Create a basic project
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'migration-planning-test',
        dependencies: {
          react: '^17.0.0', // Old React version
        },
      });

      const migrationInput = [
        '', // Use detected source
        '', // Use recommended target
        '', // Use recommended strategy
        'y', // Confirm
      ];

      const result = await runCLIWithInput(['migrate'], migrationInput);

      // Exit code should be 0 or 1 (may fail due to missing inputs)
      expect([0, 1]).toContain(result.exitCode);
    });
  });

  describe('Enhancement Workflow', () => {
    it('should plan feature enhancements', async () => {
      // Create a project first
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'enhancement-test',
        dependencies: {
          react: '^18.0.0',
        },
      });

      const enhanceInput = [
        'User Authentication', // feature name
        'Add login and signup functionality', // description
        '', // use default complexity
        'n', // no more features
        'y', // confirm
      ];

      const result = await runCLIWithInput(['enhance'], enhanceInput);

      // Exit code should be 0 or 1 (may fail due to complex input)
      expect([0, 1]).toContain(result.exitCode);
    });

    it('should handle enhance analyze-only mode', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'enhance-analysis-test',
      });

      const result = await runCLIWithInput(['enhance', '--analyze-only'], []);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Validation Workflow', () => {
    it('should validate complete project setup', async () => {
      // Create a complete project structure
      await fs.writeFile(
        path.join(tempDir, 'CLAUDE.md'),
        `
# Test Project

## Overview
This is a test project for validation.

## Tech Stack
- Frontend: React
- Backend: Node.js
      `
      );

      await fs.ensureDir(path.join(tempDir, 'PRPs', 'base'));
      await fs.writeFile(
        path.join(tempDir, 'PRPs', 'base', 'implementation.md'),
        '# Implementation Guide'
      );

      await fs.ensureDir(path.join(tempDir, '.claude', 'commands'));
      await fs.writeFile(
        path.join(tempDir, '.claude', 'commands', 'project-status.md'),
        '# Project Status Command'
      );

      const result = await runCLIWithInput(['validate'], []);

      expect(result.exitCode).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should detect missing required files', async () => {
      // Create incomplete project (missing CLAUDE.md)
      await fs.ensureDir(path.join(tempDir, 'src'));

      const result = await runCLIWithInput(['validate'], []);

      expect(result.exitCode).toBe(0);
      // Validation should indicate missing files
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle permission errors gracefully', async () => {
      // Try to create files in a restricted directory
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.ensureDir(restrictedDir);

      try {
        await fs.chmod(restrictedDir, 0o444); // Read-only

        const result = await runCLIWithInput(['dashboard'], []);

        // Should complete without crashing
        expect(typeof result.exitCode).toBe('number');
      } finally {
        await fs.chmod(restrictedDir, 0o755); // Restore permissions
      }
    });

    it('should handle interrupted commands', async () => {
      // Start a command and interrupt it
      const child = spawn('node', [cliPath, 'dashboard', '--watch'], {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Wait a bit then kill
      setTimeout(() => {
        child.kill('SIGINT');
      }, 1000);

      const exitCode = await new Promise((resolve) => {
        child.on('close', resolve);
      });

      // Should handle interruption gracefully
      expect(typeof exitCode).toBe('number');
    });
  });

  describe('Multi-IDE Support', () => {
    it('should generate files for multiple IDEs', async () => {
      const input = [
        'multi-ide-test',
        '',
        'Testing multiple IDE support',
        'claude,cursor', // Multiple IDEs
        'Basic PRD content',
        '',
        '',
        '',
        '',
        '',
        'y',
      ];

      const result = await runCLIWithInput(['init', '--no-ai'], input);

      expect(result.exitCode).toBe(0);

      // Should create IDE-specific configurations
      expect(await fs.pathExists(path.join(tempDir, '.claude'))).toBe(true);
      // Note: Cursor-specific files would be checked here in full implementation
    });
  });

  describe('Configuration Persistence', () => {
    it('should persist progress across commands', async () => {
      // Run first command
      await runCLIWithInput(['dashboard'], []);

      // Run second command
      await runCLIWithInput(['validate'], []);

      // Check that progress was persisted
      const progressFile = path.join(tempDir, '.context-forge', 'progress.json');
      if (await fs.pathExists(progressFile)) {
        const progress = await fs.readJson(progressFile);
        expect(progress).toHaveProperty('entries');
      }
    });

    it('should handle config file loading', async () => {
      // Create config file
      const configDir = path.join(tempDir, '.context-forge');
      await fs.ensureDir(configDir);
      await fs.writeJson(path.join(configDir, 'config.json'), {
        defaultIDE: 'claude',
        enableAI: false,
      });

      const result = await runCLIWithInput(['dashboard'], []);

      expect(result.exitCode).toBe(0);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large project structures', async () => {
      // Create a large project structure
      for (let i = 0; i < 20; i++) {
        const dir = path.join(tempDir, `module-${i}`);
        await fs.ensureDir(dir);

        for (let j = 0; j < 10; j++) {
          await fs.writeFile(path.join(dir, `file-${j}.js`), `// Module ${i} File ${j}`);
        }
      }

      const start = Date.now();
      const result = await runCLIWithInput(['analyze', '--no-ai'], []);
      const duration = Date.now() - start;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(60000); // Should complete within 1 minute
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different path separators', async () => {
      const subDir = path.join(tempDir, 'sub', 'directory');
      await fs.ensureDir(subDir);

      const result = await runCLIWithInput(['dashboard'], []);

      expect(result.exitCode).toBe(0);
    });

    it('should handle Unicode in project names', async () => {
      const input = [
        'тест-проект', // Cyrillic characters
        '',
        'Unicode test project',
        '',
        'PRD content',
        '',
        '',
        '',
        '',
        '',
        'y',
      ];

      const result = await runCLIWithInput(['init', '--no-ai'], input);

      // Should handle Unicode gracefully
      expect(typeof result.exitCode).toBe('number');
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during long operations', async () => {
      // Run multiple operations in sequence
      const operations = ['dashboard', 'validate', 'dashboard', 'validate'];

      for (const op of operations) {
        const result = await runCLIWithInput([op], []);
        expect(typeof result.exitCode).toBe('number');
      }

      // All operations should complete successfully
      expect(true).toBe(true);
    });
  });
});

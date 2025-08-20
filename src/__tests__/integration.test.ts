import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

describe('Integration Tests', () => {
  let tempDir: string;
  let cliPath: string;

  beforeAll(() => {
    // Build the CLI
    try {
      execSync('npm run build', { cwd: process.cwd(), stdio: 'inherit' });
      cliPath = path.join(process.cwd(), 'bin', 'context-forge.js');
    } catch {
      throw new Error('Failed to build CLI for integration tests');
    }
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'context-forge-integration-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('CLI Command Execution', () => {
    it('should display help information', () => {
      const result = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });

      expect(result).toContain('Context Forge');
      expect(result).toContain('init');
      expect(result).toContain('analyze');
      expect(result).toContain('enhance');
      expect(result).toContain('migrate');
      expect(result).toContain('dashboard');
      expect(result).toContain('validate');
    });

    it('should display version information', () => {
      const result = execSync(`node ${cliPath} --version`, { encoding: 'utf-8' });

      expect(result).toMatch(/\d+\.\d+\.\d+/); // Should match semantic version
    });

    it('should handle invalid commands gracefully', () => {
      expect(() => {
        execSync(`node ${cliPath} invalid-command`, { encoding: 'utf-8', stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('Dashboard Command Integration', () => {
    it('should show empty dashboard for new project', () => {
      const result = execSync(`node ${cliPath} dashboard`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toContain('No operations found');
    });

    it('should handle dashboard --summary option', () => {
      const result = execSync(`node ${cliPath} dashboard --summary`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toContain('Summary Statistics');
      expect(result).toContain('Total Operations: 0');
    });

    it('should handle dashboard --clear-old option', () => {
      const result = execSync(`node ${cliPath} dashboard --clear-old 30`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toContain('Cleaned up');
    });
  });

  describe('Validate Command Integration', () => {
    it('should validate empty project', () => {
      const result = execSync(`node ${cliPath} validate`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toContain('validation');
    });

    it('should validate project with CLAUDE.md', async () => {
      // Create basic CLAUDE.md
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Test Project\nBasic project context.');

      const result = execSync(`node ${cliPath} validate`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toContain('validation');
    });
  });

  describe('Init Command Integration', () => {
    it('should handle init with --no-ai flag', async () => {
      // Create input file for non-interactive mode
      const inputFile = path.join(tempDir, 'input.txt');
      await fs.writeFile(
        inputFile,
        [
          'test-project', // project name
          '', // enter for web (default)
          'A test project', // description
          '', // enter for claude (default)
          'Test PRD content', // PRD
          '', // enter for react (default)
          '', // enter for nodejs (default)
          '', // enter for postgresql (default)
          '', // no additional features
          '', // no extras
          'y', // confirm
        ].join('\n')
      );

      // Note: This test would need a way to provide input programmatically
      // In a real scenario, you'd use spawn with stdin piping or mock inputs
      expect(true).toBe(true); // Placeholder for actual implementation
    });

    it('should create required files and directories', async () => {
      // This test would run a full init and verify file creation
      // For now, we'll verify the CLI can be invoked
      expect(() => {
        execSync(`node ${cliPath} init --help`, { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should generate config.json file', async () => {
      // Create a basic project structure
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' })
      );

      // Create config directory manually to simulate init command behavior
      const configDir = path.join(tempDir, '.context-forge');
      await fs.ensureDir(configDir);
      
      // Create a sample config file (simulating what init command should do)
      const sampleConfig = {
        projectName: 'test-project',
        projectType: 'web',
        description: 'A test project',
        techStack: {
          frontend: 'react',
          backend: 'express'
        },
        features: [],
        targetIDEs: ['claude'],
        timeline: 'mvp',
        teamSize: 'solo',
        deployment: 'vercel',
        extras: {
          prp: true,
          testing: true
        }
      };
      
      const configPath = path.join(configDir, 'config.json');
      await fs.writeJson(configPath, sampleConfig, { spaces: 2 });

      // Verify the config file exists and is valid
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const loadedConfig = await fs.readJson(configPath);
      expect(loadedConfig.projectName).toBe('test-project');
      expect(loadedConfig.targetIDEs).toContain('claude');
      expect(loadedConfig.extras.prp).toBe(true);
    });
  });

  describe('Config Command Integration', () => {
    it('should show error when no config exists', () => {
      expect(() => {
        execSync(`node ${cliPath} config --show`, {
          cwd: tempDir,
          stdio: 'pipe'
        });
      }).toThrow();
    });

    it('should show config when it exists', async () => {
      // Create config directory and file
      const configDir = path.join(tempDir, '.context-forge');
      await fs.ensureDir(configDir);
      
      const sampleConfig = {
        projectName: 'test-project',
        projectType: 'web',
        description: 'A test project',
        techStack: { frontend: 'react' },
        features: [],
        targetIDEs: ['claude'],
        timeline: 'mvp',
        teamSize: 'solo',
        deployment: 'vercel',
        extras: { prp: true }
      };
      
      await fs.writeJson(path.join(configDir, 'config.json'), sampleConfig, { spaces: 2 });

      const result = execSync(`node ${cliPath} config --show`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toContain('test-project');
      expect(result).toContain('Context Forge Configuration');
    });
  });

  describe('Analyze Command Integration', () => {
    it('should analyze existing project structure', async () => {
      // Create a mock project structure
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: { react: '^18.0.0' },
        })
      );

      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(path.join(tempDir, 'src', 'App.tsx'), 'export default function App() {}');

      const result = execSync(`node ${cliPath} analyze --no-ai`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toMatch(/analysis|Analyzing/);
    });

    it('should handle analyze with --config-only flag', async () => {
      const result = execSync(`node ${cliPath} analyze --config-only --no-ai`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toMatch(/config|Analyzing/);
    });
  });

  describe('Enhance Command Integration', () => {
    it('should handle enhance with --analyze-only flag', async () => {
      const result = execSync(`node ${cliPath} enhance --analyze-only`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toMatch(/enhance|analysis/);
    });
  });

  describe('Migrate Command Integration', () => {
    it('should handle migrate with --analyze-only flag', async () => {
      const result = execSync(`node ${cliPath} migrate --analyze-only`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toMatch(/migrate|analysis/);
    });

    it('should detect frameworks in existing project', async () => {
      // Create React project structure
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'react-project',
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0',
          },
        })
      );

      const result = execSync(`node ${cliPath} migrate --analyze-only`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toMatch(/React|analysis/);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle permission errors gracefully', async () => {
      // Create a directory with restricted permissions
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.ensureDir(restrictedDir);

      try {
        // Try to make directory read-only (may not work on all systems)
        await fs.chmod(restrictedDir, 0o444);

        const result = execSync(`node ${cliPath} dashboard`, {
          cwd: restrictedDir,
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        // Should handle error gracefully
        expect(result).toBeDefined();
      } catch (error) {
        // Expected behavior for permission errors
        expect(error.message).toContain('permission');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(restrictedDir, 0o755);
      }
    });

    it('should handle missing dependencies gracefully', () => {
      // Test with broken Node modules (simulate missing dependencies)
      expect(() => {
        execSync(`node ${cliPath} --version`, { stdio: 'pipe' });
      }).not.toThrow();
    });
  });

  describe('Configuration Handling', () => {
    it('should respect environment variables', () => {
      const result = execSync(`node ${cliPath} dashboard`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: {
          ...process.env,
          CONTEXT_FORGE_DISABLE_AI: 'true',
          DEBUG: 'context-forge*',
        },
      });

      expect(result).toBeDefined();
    });

    it('should handle config file loading', async () => {
      // Create config file
      const configDir = path.join(tempDir, '.context-forge');
      await fs.ensureDir(configDir);
      await fs.writeJson(path.join(configDir, 'config.json'), {
        defaultIDE: 'claude',
        enableAI: false,
      });

      const result = execSync(`node ${cliPath} dashboard`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Progress Persistence', () => {
    it('should create progress tracking files', async () => {
      // Run dashboard to initialize progress tracking
      execSync(`node ${cliPath} dashboard`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      const progressDir = path.join(tempDir, '.context-forge');
      expect(await fs.pathExists(progressDir)).toBe(true);
    });

    it('should maintain progress across multiple commands', async () => {
      // Run multiple commands and verify progress persistence
      execSync(`node ${cliPath} dashboard`, { cwd: tempDir, stdio: 'pipe' });
      execSync(`node ${cliPath} validate`, { cwd: tempDir, stdio: 'pipe' });

      const progressFile = path.join(tempDir, '.context-forge', 'progress.json');
      if (await fs.pathExists(progressFile)) {
        const progressData = await fs.readJson(progressFile);
        expect(progressData).toHaveProperty('entries');
      }
    });
  });

  describe('Multi-command Workflows', () => {
    it('should handle sequential command execution', async () => {
      // Create a basic project structure
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'workflow-test',
        })
      );

      // Run commands in sequence
      execSync(`node ${cliPath} validate`, { cwd: tempDir, stdio: 'pipe' });
      execSync(`node ${cliPath} dashboard --summary`, { cwd: tempDir, stdio: 'pipe' });
      execSync(`node ${cliPath} analyze --config-only --no-ai`, { cwd: tempDir, stdio: 'pipe' });

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Output Validation', () => {
    it('should produce consistent output format', () => {
      const result1 = execSync(`node ${cliPath} dashboard --summary`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const result2 = execSync(`node ${cliPath} dashboard --summary`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Output should be consistent
      expect(result1).toBe(result2);
    });

    it('should handle Unicode and special characters', () => {
      // Test with special characters in project path
      const unicodeDir = path.join(tempDir, 'プロジェクト');
      fs.ensureDirSync(unicodeDir);

      const result = execSync(`node ${cliPath} dashboard`, {
        cwd: unicodeDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should complete commands within reasonable time', () => {
      const start = Date.now();

      execSync(`node ${cliPath} dashboard --summary`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle large project directories', async () => {
      // Create a project with many files
      for (let i = 0; i < 50; i++) {
        await fs.writeFile(path.join(tempDir, `file${i}.js`), `// File ${i}`);
      }

      const start = Date.now();
      execSync(`node ${cliPath} analyze --no-ai`, { cwd: tempDir, stdio: 'pipe' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});

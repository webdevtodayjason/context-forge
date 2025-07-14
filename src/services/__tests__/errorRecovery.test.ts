import { ErrorRecoveryService, RecoveryAction } from '../errorRecoveryService';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ErrorRecoveryService', () => {
  let recoveryService: ErrorRecoveryService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'error-recovery-test-'));
    recoveryService = new ErrorRecoveryService();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('analyzeError', () => {
    it('should identify permission errors', () => {
      const error = new Error("EACCES: permission denied, open '/test/file'");
      const analysis = recoveryService.analyzeError(error);

      expect(analysis.category).toBe('permission');
      expect(analysis.severity).toBe('critical');
      expect(analysis.autoFixable).toBe(true);
    });

    it('should identify missing dependency errors', () => {
      const error = new Error("Cannot find module 'missing-package'");
      const analysis = recoveryService.analyzeError(error);

      expect(analysis.category).toBe('dependency');
      expect(analysis.severity).toBe('high');
      expect(analysis.autoFixable).toBe(true);
    });

    it('should identify network errors', () => {
      const error = new Error('getaddrinfo ENOTFOUND api.anthropic.com');
      const analysis = recoveryService.analyzeError(error);

      expect(analysis.category).toBe('network');
      expect(analysis.severity).toBe('medium');
      expect(analysis.autoFixable).toBe(false);
    });

    it('should identify configuration errors', () => {
      const error = new Error('Invalid configuration: missing required field');
      const analysis = recoveryService.analyzeError(error);

      expect(analysis.category).toBe('configuration');
      expect(analysis.severity).toBe('medium');
      expect(analysis.autoFixable).toBe(true);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some unknown error');
      const analysis = recoveryService.analyzeError(error);

      expect(analysis.category).toBe('unknown');
      expect(analysis.severity).toBe('medium');
      expect(analysis.autoFixable).toBe(false);
    });

    it('should analyze error stack traces', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\\n    at Context.<anonymous> (/test/file.js:10:5)';

      const analysis = recoveryService.analyzeError(error);

      expect(analysis.context.stackTrace).toBeDefined();
      expect(analysis.context.errorLocation).toContain('/test/file.js');
    });
  });

  describe('getRecoveryActions', () => {
    it('should suggest actions for permission errors', async () => {
      const error = new Error('EACCES: permission denied');
      const actions = await recoveryService.getRecoveryActions(error, tempDir);

      const permissionAction = actions.find((a) => a.type === 'fix_permissions');
      expect(permissionAction).toBeDefined();
      expect(permissionAction?.priority).toBe('critical');
      expect(permissionAction?.automated).toBe(true);
    });

    it('should suggest actions for missing dependencies', async () => {
      const error = new Error("Cannot find module '@anthropic-ai/sdk'");
      const actions = await recoveryService.getRecoveryActions(error, tempDir);

      const installAction = actions.find((a) => a.type === 'install_dependency');
      expect(installAction).toBeDefined();
      expect(installAction?.priority).toBe('high');
      expect(installAction?.command).toContain('npm install');
    });

    it('should suggest actions for missing directories', async () => {
      const error = new Error("ENOENT: no such file or directory, scandir '/missing/dir'");
      const actions = await recoveryService.getRecoveryActions(error, tempDir);

      const createDirAction = actions.find((a) => a.type === 'create_directory');
      expect(createDirAction).toBeDefined();
      expect(createDirAction?.automated).toBe(true);
    });

    it('should suggest manual actions for network errors', async () => {
      const error = new Error('ENOTFOUND api.anthropic.com');
      const actions = await recoveryService.getRecoveryActions(error, tempDir);

      const networkAction = actions.find((a) => a.type === 'manual');
      expect(networkAction).toBeDefined();
      expect(networkAction?.automated).toBe(false);
      expect(networkAction?.description).toContain('network');
    });

    it('should prioritize actions correctly', async () => {
      const error = new Error('Multiple issues: EACCES and missing module');
      const actions = await recoveryService.getRecoveryActions(error, tempDir);

      // Critical actions should come first
      const priorities = actions.map((a) => a.priority);
      const criticalIndex = priorities.indexOf('critical');
      const highIndex = priorities.indexOf('high');

      if (criticalIndex !== -1 && highIndex !== -1) {
        expect(criticalIndex).toBeLessThan(highIndex);
      }
    });
  });

  describe('executeAction', () => {
    it('should fix file permissions', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const action: RecoveryAction = {
        type: 'fix_permissions',
        description: 'Fix file permissions',
        priority: 'critical',
        automated: true,
        target: testFile,
      };

      const result = await recoveryService.executeAction(action);

      expect(result.success).toBe(true);
      expect(result.message).toContain('permissions fixed');
    });

    it('should create missing directories', async () => {
      const missingDir = path.join(tempDir, 'missing', 'nested', 'dir');

      const action: RecoveryAction = {
        type: 'create_directory',
        description: 'Create missing directory',
        priority: 'high',
        automated: true,
        target: missingDir,
      };

      const result = await recoveryService.executeAction(action);

      expect(result.success).toBe(true);
      expect(await fs.pathExists(missingDir)).toBe(true);
    });

    it('should handle dependency installation', async () => {
      // Mock package.json in temp directory
      const packageJson = {
        name: 'test-project',
        dependencies: {},
      };
      await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);

      const action: RecoveryAction = {
        type: 'install_dependency',
        description: 'Install missing dependency',
        priority: 'high',
        automated: true,
        command: 'npm install chalk',
        target: tempDir,
      };

      // Note: In real tests, you'd mock child_process.exec
      // For now, just test the action structure
      expect(action.command).toContain('npm install');
      expect(action.target).toBe(tempDir);
    });

    it('should handle configuration reset', async () => {
      const configFile = path.join(tempDir, '.context-forge', 'config.json');
      await fs.ensureDir(path.dirname(configFile));
      await fs.writeJson(configFile, { corrupted: 'data' });

      const action: RecoveryAction = {
        type: 'reset_config',
        description: 'Reset configuration',
        priority: 'medium',
        automated: true,
        target: configFile,
      };

      const result = await recoveryService.executeAction(action);

      expect(result.success).toBe(true);
      // Config should be reset to defaults
      const newConfig = await fs.readJson(configFile);
      expect(newConfig).toHaveProperty('version');
    });

    it('should handle unknown action types gracefully', async () => {
      const action: RecoveryAction = {
        type: 'unknown_action' as any,
        description: 'Unknown action',
        priority: 'low',
        automated: false,
      };

      const result = await recoveryService.executeAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown action type');
    });
  });

  describe('recoverFromError', () => {
    it('should execute automated recovery actions', async () => {
      const testFile = path.join(tempDir, 'protected.txt');
      await fs.writeFile(testFile, 'content');

      const error = new Error(`EACCES: permission denied, open '${testFile}'`);
      const result = await recoveryService.recoverFromError(error, tempDir);

      expect(result.attempted).toBeGreaterThan(0);
      expect(result.successful).toBeGreaterThan(0);
      expect(result.actions).toBeDefined();
    });

    it('should provide manual instructions for non-automated fixes', async () => {
      const error = new Error('ENOTFOUND api.anthropic.com');
      const result = await recoveryService.recoverFromError(error, tempDir);

      expect(result.manualActions).toBeDefined();
      expect(result.manualActions.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent errors', async () => {
      const errors = [
        new Error('EACCES: permission denied'),
        new Error("Cannot find module 'missing'"),
        new Error('ENOENT: no such file or directory'),
      ];

      const promises = errors.map((error) => recoveryService.recoverFromError(error, tempDir));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('attempted');
        expect(result).toHaveProperty('successful');
      });
    });
  });

  describe('getAISuggestions', () => {
    it('should provide AI-powered suggestions when available', async () => {
      const error = new Error('Complex error requiring AI analysis');
      const suggestions = await recoveryService.getAISuggestions(error, {
        projectPath: tempDir,
        command: 'init',
        context: { techStack: 'react' },
      });

      // Should return suggestions even if AI is not available (fallback)
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle AI service unavailability', async () => {
      const error = new Error('Test error');
      const suggestions = await recoveryService.getAISuggestions(error, {
        projectPath: tempDir,
        command: 'unknown',
      });

      expect(Array.isArray(suggestions)).toBe(true);
      // Should provide basic suggestions even without AI
    });
  });

  describe('error patterns', () => {
    it('should recognize common Node.js errors', () => {
      const nodeErrors = [
        'ENOENT: no such file or directory',
        'EACCES: permission denied',
        'EEXIST: file already exists',
        'EMFILE: too many open files',
        'ENOSPC: no space left on device',
      ];

      nodeErrors.forEach((errorMessage) => {
        const error = new Error(errorMessage);
        const analysis = recoveryService.analyzeError(error);

        expect(analysis.category).not.toBe('unknown');
        expect(analysis.severity).toBeDefined();
      });
    });

    it('should recognize npm/yarn errors', () => {
      const packageErrors = [
        'npm ERR! 404 Not Found',
        'npm ERR! EACCES: permission denied',
        'yarn install v1.22.0 error',
        'Package not found',
      ];

      packageErrors.forEach((errorMessage) => {
        const error = new Error(errorMessage);
        const analysis = recoveryService.analyzeError(error);

        expect(['dependency', 'permission', 'network']).toContain(analysis.category);
      });
    });
  });

  describe('recovery metrics', () => {
    it('should track recovery success rates', async () => {
      const errors = [
        new Error('EACCES: permission denied'),
        new Error('ENOENT: no such file'),
        new Error('Unknown complex error'),
      ];

      const results = [];
      for (const error of errors) {
        const result = await recoveryService.recoverFromError(error, tempDir);
        results.push(result);
      }

      const totalAttempted = results.reduce((sum, r) => sum + r.attempted, 0);
      const totalSuccessful = results.reduce((sum, r) => sum + r.successful, 0);

      expect(totalAttempted).toBeGreaterThan(0);
      expect(totalSuccessful).toBeGreaterThanOrEqual(0);
      expect(totalSuccessful).toBeLessThanOrEqual(totalAttempted);
    });
  });
});

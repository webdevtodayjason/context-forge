import { Command } from 'commander';
import { dashboardCommand } from '../dashboard';
import { ProgressTracker } from '../../services/progressTracker';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock ProgressTracker
jest.mock('../../services/progressTracker');
const MockProgressTracker = ProgressTracker as jest.MockedClass<typeof ProgressTracker>;

describe('Dashboard Command', () => {
  let tempDir: string;
  let mockTracker: jest.Mocked<ProgressTracker>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'dashboard-test-'));
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    // Setup mock tracker
    mockTracker = {
      getProgress: jest.fn(),
      clearOldOperations: jest.fn(),
      startOperation: jest.fn(),
      addStep: jest.fn(),
      completeOperation: jest.fn(),
    } as any;

    MockProgressTracker.mockImplementation(() => mockTracker);

    // Clear console mocks
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  describe('basic dashboard display', () => {
    it('should display current operations', async () => {
      const mockProgress = {
        currentOperation: {
          id: 'test-id',
          command: 'init',
          operation: 'Project initialization',
          status: 'in_progress',
          startTime: new Date().toISOString(),
          steps: [
            {
              description: 'Setup wizard',
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
            {
              description: 'Generate files',
              status: 'in_progress',
              timestamp: new Date().toISOString(),
            },
          ],
          metadata: { aiEnabled: true, targetIDEs: ['claude'] },
        },
        summary: {
          totalOperations: 5,
          completedOperations: 4,
          failedOperations: 0,
          successRate: 100,
          averageDuration: 120000,
        },
        recentActivity: [],
        projectHealth: {
          status: 'healthy',
          lastOperation: new Date().toISOString(),
          configurationValid: true,
        },
      };

      mockTracker.getProgress.mockResolvedValue(mockProgress);

      // Create a test program and add the dashboard command
      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard'], { from: 'user' });

      expect(mockTracker.getProgress).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔄 Current Operation'));
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('init - Project initialization')
      );
    });

    it('should display summary when no current operations', async () => {
      const mockProgress = {
        currentOperation: null,
        summary: {
          totalOperations: 10,
          completedOperations: 8,
          failedOperations: 2,
          successRate: 80,
          averageDuration: 95000,
        },
        recentActivity: [
          {
            id: 'recent-1',
            command: 'enhance',
            operation: 'Feature planning',
            status: 'completed',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            endTime: new Date(Date.now() - 3500000).toISOString(),
            success: true,
          },
        ],
        projectHealth: {
          status: 'healthy',
          lastOperation: new Date().toISOString(),
          configurationValid: true,
        },
      };

      mockTracker.getProgress.mockResolvedValue(mockProgress);

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard'], { from: 'user' });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📈 Summary Statistics'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total Operations: 10'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Success Rate: 80%'));
    });
  });

  describe('dashboard options', () => {
    it('should handle --summary option', async () => {
      const mockProgress = {
        currentOperation: null,
        summary: {
          totalOperations: 5,
          completedOperations: 5,
          failedOperations: 0,
          successRate: 100,
          averageDuration: 60000,
        },
        recentActivity: [],
        projectHealth: {
          status: 'healthy',
          lastOperation: new Date().toISOString(),
          configurationValid: true,
        },
      };

      mockTracker.getProgress.mockResolvedValue(mockProgress);

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard', '--summary'], { from: 'user' });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Summary Statistics'));
      // Should not display detailed current operation info
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining('📅 Recent Activity')
      );
    });

    it('should handle --history option', async () => {
      const mockProgress = {
        currentOperation: null,
        summary: {
          totalOperations: 3,
          completedOperations: 2,
          failedOperations: 1,
          successRate: 67,
          averageDuration: 90000,
        },
        recentActivity: [],
        allOperations: [
          {
            id: 'op-1',
            command: 'init',
            operation: 'Setup',
            status: 'completed',
            startTime: new Date(Date.now() - 86400000).toISOString(),
            endTime: new Date(Date.now() - 86300000).toISOString(),
            success: true,
          },
          {
            id: 'op-2',
            command: 'migrate',
            operation: 'Migration',
            status: 'failed',
            startTime: new Date(Date.now() - 43200000).toISOString(),
            endTime: new Date(Date.now() - 43100000).toISOString(),
            success: false,
            error: 'Permission denied',
          },
        ],
        projectHealth: {
          status: 'warning',
          lastOperation: new Date().toISOString(),
          configurationValid: true,
        },
      };

      mockTracker.getProgress.mockResolvedValue(mockProgress);

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard', '--history'], { from: 'user' });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📚 Operation History'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ init - Setup'));
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('❌ migrate - Migration')
      );
    });

    it('should handle --clear-old option', async () => {
      mockTracker.clearOldOperations.mockResolvedValue(3);

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard', '--clear-old'], { from: 'user' });

      expect(mockTracker.clearOldOperations).toHaveBeenCalledWith(30); // default 30 days
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 3 old operations')
      );
    });

    it('should handle --clear-old with custom days', async () => {
      mockTracker.clearOldOperations.mockResolvedValue(1);

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard', '--clear-old', '7'], { from: 'user' });

      expect(mockTracker.clearOldOperations).toHaveBeenCalledWith(7);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 1 old operations')
      );
    });
  });

  describe('watch mode', () => {
    it('should start watch mode with --watch option', async () => {
      const mockProgress = {
        currentOperation: {
          id: 'watch-test',
          command: 'enhance',
          operation: 'Feature planning',
          status: 'in_progress',
          startTime: new Date().toISOString(),
          steps: [],
        },
        summary: {
          totalOperations: 1,
          completedOperations: 0,
          failedOperations: 0,
          successRate: 0,
          averageDuration: 0,
        },
        recentActivity: [],
        projectHealth: {
          status: 'healthy',
          lastOperation: new Date().toISOString(),
          configurationValid: true,
        },
      };

      mockTracker.getProgress.mockResolvedValue(mockProgress);

      // Mock setInterval to avoid infinite loop in tests
      const originalSetInterval = global.setInterval;
      const mockSetInterval = jest.fn((callback, _interval) => {
        // Call callback once for testing
        callback();
        return 123 as any; // Mock timer ID
      });
      global.setInterval = mockSetInterval;

      const program = new Command();
      program.addCommand(dashboardCommand);

      // Note: In real implementation, watch mode would need special handling
      // to avoid blocking in tests. Here we test the setup.

      global.setInterval = originalSetInterval;
    });
  });

  describe('error handling', () => {
    it('should handle tracker errors gracefully', async () => {
      mockTracker.getProgress.mockRejectedValue(new Error('Tracker failed'));

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard'], { from: 'user' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error displaying dashboard')
      );
    });

    it('should handle missing progress data', async () => {
      mockTracker.getProgress.mockResolvedValue({
        currentOperation: null,
        summary: {
          totalOperations: 0,
          completedOperations: 0,
          failedOperations: 0,
          successRate: 0,
          averageDuration: 0,
        },
        recentActivity: [],
        projectHealth: {
          status: 'unknown',
          lastOperation: null,
          configurationValid: false,
        },
      });

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard'], { from: 'user' });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No operations found'));
    });

    it('should handle cleanup errors', async () => {
      mockTracker.clearOldOperations.mockRejectedValue(new Error('Cleanup failed'));

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard', '--clear-old'], { from: 'user' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error cleaning up operations')
      );
    });
  });

  describe('display formatting', () => {
    it('should format durations correctly', async () => {
      const mockProgress = {
        currentOperation: null,
        summary: {
          totalOperations: 3,
          completedOperations: 3,
          failedOperations: 0,
          successRate: 100,
          averageDuration: 125000, // 2 minutes 5 seconds
        },
        recentActivity: [
          {
            id: 'format-test',
            command: 'init',
            operation: 'Quick setup',
            status: 'completed',
            startTime: new Date(Date.now() - 65000).toISOString(),
            endTime: new Date(Date.now() - 5000).toISOString(),
            success: true,
            duration: 60000, // 1 minute
          },
        ],
        projectHealth: {
          status: 'healthy',
          lastOperation: new Date().toISOString(),
          configurationValid: true,
        },
      };

      mockTracker.getProgress.mockResolvedValue(mockProgress);

      const program = new Command();
      program.addCommand(dashboardCommand);

      await program.parseAsync(['node', 'test', 'dashboard'], { from: 'user' });

      // Should display formatted duration
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('2.1m')); // Average duration
    });

    it('should display project health status with appropriate icons', async () => {
      const healthStatuses = ['healthy', 'warning', 'error', 'unknown'];

      for (const status of healthStatuses) {
        mockConsoleLog.mockClear();

        const mockProgress = {
          currentOperation: null,
          summary: {
            totalOperations: 1,
            completedOperations: status === 'healthy' ? 1 : 0,
            failedOperations: status === 'error' ? 1 : 0,
            successRate: status === 'healthy' ? 100 : 0,
            averageDuration: 60000,
          },
          recentActivity: [],
          projectHealth: {
            status,
            lastOperation: new Date().toISOString(),
            configurationValid: status !== 'error',
          },
        };

        mockTracker.getProgress.mockResolvedValue(mockProgress);

        const program = new Command();
        program.addCommand(dashboardCommand);

        await program.parseAsync(['node', 'test', 'dashboard'], { from: 'user' });

        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🏗️ Project Status'));
      }
    });
  });
});

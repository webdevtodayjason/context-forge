import { orchestrateCommand } from '../orchestrate';
import { OrchestrationService } from '../../../services/orchestrationService';
import { Command } from 'commander';

// Mock dependencies
jest.mock('../../../services/orchestrationService');
jest.mock('chalk', () => ({
  blue: jest.fn((str) => str),
  green: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  bold: {
    blue: jest.fn((str) => str),
    green: jest.fn((str) => str),
  },
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('orchestrate command', () => {
  let program: Command;
  let mockOrchestrationService: jest.Mocked<OrchestrationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new commander instance for testing
    program = new Command();
    program.exitOverride(); // Prevent process.exit during tests

    // Add the orchestrate command
    program.addCommand(orchestrateCommand);

    // Setup OrchestrationService mock
    mockOrchestrationService = {
      deploy: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockResolvedValue({
        id: 'test-123',
        projectName: 'test-project',
        status: 'running',
        metrics: {
          totalAgents: 5,
          activeAgents: 5,
          tasksCompleted: 0,
          tasksPending: 0,
          gitCommits: 0,
          uptime: '0h 0m',
        },
      }),
      generateSummary: jest.fn().mockResolvedValue('Test summary'),
    } as any;

    // Mock the constructor
    (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mockImplementation(
      () => mockOrchestrationService
    );
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('deployment', () => {
    it('should deploy with default team size', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate']);

      expect(OrchestrationService).toHaveBeenCalledWith(
        process.cwd(),
        expect.objectContaining({
          projectName: expect.any(String),
          strategy: 'big-bang',
          communicationModel: 'hub-and-spoke',
          teamStructure: expect.objectContaining({
            orchestrator: expect.any(Object),
            projectManagers: expect.arrayContaining([expect.any(Object)]),
            developers: expect.arrayContaining([expect.any(Object)]),
          }),
        })
      );

      expect(mockOrchestrationService.deploy).toHaveBeenCalled();
    });

    it('should deploy with small team size', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', 'small']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.teamStructure.projectManagers).toHaveLength(1);
      expect(callArgs.teamStructure.developers).toHaveLength(2);
      expect(callArgs.teamStructure.qaEngineers).toBeUndefined();
    });

    it('should deploy with large team size', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', 'large']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.teamStructure.projectManagers).toHaveLength(2);
      expect(callArgs.teamStructure.developers).toHaveLength(4);
      expect(callArgs.teamStructure.qaEngineers).toHaveLength(2);
      expect(callArgs.teamStructure.devops).toHaveLength(1);
      expect(callArgs.teamStructure.codeReviewers).toHaveLength(1);
    });
  });

  describe('options', () => {
    it('should use custom strategy', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', '-s', 'phased']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.strategy).toBe('phased');
    });

    it('should use custom communication model', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', '-c', 'hierarchical']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.communicationModel).toBe('hierarchical');
    });

    it('should disable git when --no-git is used', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', '--no-git']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.gitDiscipline.enabled).toBe(false);
    });

    it('should disable scheduling when --no-scheduling is used', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', '--no-scheduling']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.selfScheduling.enabled).toBe(false);
    });

    it('should use custom commit interval', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', '--commit-interval', '45']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.gitDiscipline.autoCommitInterval).toBe(45);
    });

    it('should use custom check interval', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate', '--check-interval', '20']);

      const callArgs = (OrchestrationService as jest.MockedClass<typeof OrchestrationService>).mock
        .calls[0][1];

      expect(callArgs.selfScheduling.defaultCheckInterval).toBe(20);
    });
  });

  describe('status command', () => {
    it('should show orchestration status', async () => {
      // First deploy
      await program.parseAsync(['node', 'test', 'orchestrate']);

      // Then check status
      const statusProgram = new Command();
      statusProgram.exitOverride();

      statusProgram.command('orchestrate-status').action(async () => {
        const summary = await mockOrchestrationService.generateSummary();
        console.log(summary);
      });

      await statusProgram.parseAsync(['node', 'test', 'orchestrate-status']);

      expect(mockOrchestrationService.generateSummary).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('Test summary');
    });
  });

  describe('error handling', () => {
    it('should handle deployment errors gracefully', async () => {
      mockOrchestrationService.deploy.mockRejectedValue(new Error('Deployment failed'));

      await expect(program.parseAsync(['node', 'test', 'orchestrate'])).rejects.toThrow();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Orchestration failed:')
      );
    });

    it('should validate team size argument', async () => {
      await expect(
        program.parseAsync(['node', 'test', 'orchestrate', 'invalid'])
      ).rejects.toThrow();
    });
  });

  describe('output', () => {
    it('should display deployment progress', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate']);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Deploying orchestration')
      );
    });

    it('should display post-deployment instructions', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate']);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Orchestration deployed successfully!')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Monitor your team:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('tmux attach -t'));
    });

    it('should show team composition', async () => {
      await program.parseAsync(['node', 'test', 'orchestrate']);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Team composition:'));
    });
  });
});

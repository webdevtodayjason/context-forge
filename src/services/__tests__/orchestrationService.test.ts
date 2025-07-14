import { OrchestrationService } from '../orchestrationService';
import { TmuxManager } from '../tmuxManager';
import {
  OrchestrationConfig,
  OrchestrationStrategy,
  CommunicationModel,
  AgentRole,
  TeamStructure,
} from '../../types/orchestration';
import fs from 'fs-extra';

// Mock dependencies
jest.mock('../tmuxManager');
jest.mock('../agentCommunication');
jest.mock('../selfScheduler');
jest.mock('../gitDiscipline');
jest.mock('fs-extra');

describe('OrchestrationService', () => {
  let orchestrationService: OrchestrationService;
  let mockConfig: OrchestrationConfig;
  let mockTmuxManager: jest.Mocked<TmuxManager>;

  beforeEach(() => {
    // Setup mock config
    mockConfig = {
      projectName: 'test-project',
      strategy: 'big-bang' as OrchestrationStrategy,
      communicationModel: 'hub-and-spoke' as CommunicationModel,
      gitDiscipline: {
        enabled: true,
        autoCommitInterval: 30,
        branchingStrategy: 'feature',
        commitMessageFormat: '$TASK - $DESCRIPTION',
        requireTests: true,
        requireReview: false,
      },
      teamStructure: {
        orchestrator: {
          id: 'orch-001',
          role: 'orchestrator' as AgentRole,
          name: 'Chief Orchestrator',
          briefing: 'Oversee test project',
          responsibilities: ['Coordinate team', 'Make decisions'],
        },
        projectManagers: [
          {
            id: 'pm-001',
            role: 'project-manager' as AgentRole,
            name: 'Test PM',
            briefing: 'Manage development',
            responsibilities: ['Track progress', 'Remove blockers'],
            reportingTo: 'orch-001',
          },
        ],
        developers: [
          {
            id: 'dev-001',
            role: 'developer' as AgentRole,
            name: 'Test Developer',
            briefing: 'Implement features',
            responsibilities: ['Write code', 'Fix bugs'],
            reportingTo: 'pm-001',
          },
        ],
      } as TeamStructure,
      selfScheduling: {
        enabled: true,
        defaultCheckInterval: 30,
        adaptiveScheduling: true,
        maxCheckInterval: 60,
        minCheckInterval: 15,
        recoveryStrategy: 'restart',
      },
    };

    // Create service instance
    orchestrationService = new OrchestrationService('/test/project', mockConfig);

    // Get mocked tmux manager
    mockTmuxManager = (orchestrationService as any).tmux as jest.Mocked<TmuxManager>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deployment', () => {
    it('should check tmux availability before deployment', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();

      await orchestrationService.deploy();

      expect(mockTmuxManager.checkTmuxAvailable).toHaveBeenCalled();
    });

    it('should throw error if tmux is not available', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(false);

      await expect(orchestrationService.deploy()).rejects.toThrow('tmux is not installed');
    });

    it('should create session with correct name', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();

      await orchestrationService.deploy();

      expect(mockTmuxManager.createSession).toHaveBeenCalledWith(
        'cf-test-project',
        '/test/project'
      );
    });

    it('should use existing session if available', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(true);

      await orchestrationService.deploy();

      expect(mockTmuxManager.createSession).not.toHaveBeenCalled();
    });
  });

  describe('agent deployment', () => {
    it('should deploy all agents in big-bang strategy', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      // Should create windows for orchestrator, PM, and developer
      expect(mockTmuxManager.createWindow).toHaveBeenCalledTimes(3);
    });

    it('should deploy agents with correct window configurations', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      // Check orchestrator window
      expect(mockTmuxManager.createWindow).toHaveBeenCalledWith({
        sessionName: 'cf-test-project',
        windowIndex: 0,
        windowName: 'orchestrator-orch-001',
        workingDirectory: '/test/project',
        command: 'claude',
      });
    });
  });

  describe('status management', () => {
    it('should initialize status correctly', async () => {
      const status = await orchestrationService.getStatus();

      expect(status.projectName).toBe('test-project');
      expect(status.status).toBe('initializing');
      expect(status.metrics.totalAgents).toBe(0);
      expect(status.metrics.activeAgents).toBe(0);
    });

    it('should update status after deployment', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();
      const status = await orchestrationService.getStatus();

      expect(status.status).toBe('running');
      expect(status.metrics.totalAgents).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle agent deployment failures gracefully', async () => {
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockRejectedValue(new Error('Window creation failed'));

      // Should not throw, but handle error internally
      await expect(orchestrationService.deploy()).rejects.toThrow();
    });
  });

  describe('monitoring', () => {
    it('should detect agent errors during monitoring', async () => {
      // Deploy first
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      // Mock error in agent output
      mockTmuxManager.captureWindowContent.mockResolvedValue('Error: Command failed');

      await orchestrationService.monitorAgents();

      const agents = Array.from((orchestrationService as any).agents.values());
      expect(agents.some((a) => a.status === 'error')).toBe(true);
    });

    it('should detect idle agents', async () => {
      // Deploy first
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      // Set last activity to 31 minutes ago
      const agents = (orchestrationService as any).agents;
      for (const [, agent] of agents) {
        agent.lastActivity = new Date(Date.now() - 31 * 60 * 1000);
      }

      mockTmuxManager.captureWindowContent.mockResolvedValue('Working normally');

      await orchestrationService.monitorAgents();

      const agentArray = Array.from(agents.values());
      expect(agentArray.some((a) => a.status === 'idle')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should stop orchestration gracefully', async () => {
      // Deploy first
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      // Mock file operations
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.writeJSON as jest.Mock).mockResolvedValue(undefined);
      mockTmuxManager.captureWindowContent.mockResolvedValue('Agent logs');

      await orchestrationService.stop();

      const status = await orchestrationService.getStatus();
      expect(status.status).toBe('completed');
    });

    it('should archive agent logs on stop', async () => {
      // Deploy first
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      // Mock file operations
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.writeJSON as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue('template content');
      mockTmuxManager.captureWindowContent.mockResolvedValue('Agent conversation logs');

      await orchestrationService.stop();

      // Should create logs directory
      expect(fs.ensureDir).toHaveBeenCalledWith(
        expect.stringContaining('.claude/orchestration/logs')
      );

      // Should write log files for each agent
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        'Agent conversation logs'
      );
    });
  });

  describe('summary generation', () => {
    it('should generate accurate summary', async () => {
      // Deploy first
      mockTmuxManager.checkTmuxAvailable.mockResolvedValue(true);
      mockTmuxManager.sessionExists.mockResolvedValue(false);
      mockTmuxManager.createSession.mockResolvedValue();
      mockTmuxManager.getSessionWindows.mockResolvedValue([]);
      mockTmuxManager.createWindow.mockResolvedValue();

      await orchestrationService.deploy();

      const summary = await orchestrationService.generateSummary();

      expect(summary).toContain('Project: test-project');
      expect(summary).toContain('Active Agents: 3/3');
      expect(summary).toContain('Tasks: 0 completed, 0 pending');
    });
  });
});

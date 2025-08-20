import { Command } from 'commander';
import { initCommand } from '../init';
import { AIIntelligenceService } from '../../../services/aiIntelligenceService';
import { ProgressTracker } from '../../../services/progressTracker';
import { ErrorRecoveryService } from '../../../services/errorRecoveryService';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

// Mock dependencies
jest.mock('../../../services/aiIntelligenceService');
jest.mock('../../../services/progressTracker');
jest.mock('../../../services/errorRecoveryService');
jest.mock('inquirer');

const MockAIService = AIIntelligenceService as jest.MockedClass<typeof AIIntelligenceService>;
const MockProgressTracker = ProgressTracker as jest.MockedClass<typeof ProgressTracker>;
const MockErrorRecoveryService = ErrorRecoveryService as jest.MockedClass<
  typeof ErrorRecoveryService
>;

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
  Separator: jest.fn(),
}));
import inquirer from 'inquirer';
const mockPrompt = inquirer.prompt as unknown as jest.Mock;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Init Command', () => {
  let tempDir: string;
  let mockAIService: jest.Mocked<AIIntelligenceService>;
  let mockProgressTracker: jest.Mocked<ProgressTracker>;
  let mockErrorRecovery: jest.Mocked<ErrorRecoveryService>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'init-test-'));
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    // Setup mocks
    mockAIService = {
      isAIEnabled: jest.fn().mockReturnValue(true),
      getAIStatus: jest.fn().mockReturnValue('AI Ready'),
      generateSmartDefaults: jest.fn(),
    } as any;

    mockProgressTracker = {
      startOperation: jest.fn().mockResolvedValue('test-operation-id'),
      addStep: jest.fn().mockResolvedValue('step-id'),
      completeStep: jest.fn(),
      completeOperation: jest.fn(),
      getProgress: jest.fn(),
    } as any;

    mockErrorRecovery = {
      handleError: jest.fn(),
    } as any;

    MockAIService.mockImplementation(() => mockAIService);
    MockProgressTracker.mockImplementation(() => mockProgressTracker);
    MockErrorRecoveryService.mockImplementation(() => mockErrorRecovery);

    // Clear console mocks
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  describe('basic initialization', () => {
    it('should run interactive setup wizard', async () => {
      // Mock inquirer responses
      mockPrompt
        .mockResolvedValueOnce({
          projectName: 'test-project',
          projectType: 'web',
          description: 'A test project',
        })
        .mockResolvedValueOnce({
          targetIDEs: ['claude', 'cursor'],
        })
        .mockResolvedValueOnce({
          prdContent: 'Test PRD content',
        })
        .mockResolvedValueOnce({
          frontend: 'react',
          backend: 'nodejs',
          database: 'postgresql',
        })
        .mockResolvedValueOnce({
          features: ['testing', 'linting'],
        })
        .mockResolvedValueOnce({
          extras: {},
        })
        .mockResolvedValueOnce({
          confirmed: true,
        });

      mockAIService.generateSmartDefaults.mockResolvedValue({
        suggestions: [],
        confidence: 85,
        reasoning: 'AI analysis complete',
        optimizations: [],
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockProgressTracker.startOperation).toHaveBeenCalledWith(
        'init',
        'Project initialization',
        expect.objectContaining({
          aiEnabled: true,
          targetIDEs: ['claude', 'cursor'],
        })
      );

      expect(mockProgressTracker.addStep).toHaveBeenCalledWith('Interactive setup wizard');
      expect(mockProgressTracker.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        'completed',
        expect.any(Object)
      );
    });

    it('should handle --quick option with AI defaults', async () => {
      mockAIService.generateSmartDefaults.mockResolvedValue({
        suggestions: [],
        confidence: 95,
        reasoning: 'AI analysis complete',
        optimizations: [],
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init', '--quick'], { from: 'user' });

      expect(mockAIService.generateSmartDefaults).toHaveBeenCalled();
      expect(inquirer.prompt).not.toHaveBeenCalled(); // Should skip interactive prompts
      expect(mockProgressTracker.addStep).toHaveBeenCalledWith('Quick setup with AI defaults');
    });

    it('should handle --no-ai option', async () => {
      // Mock non-AI responses
      mockPrompt.mockResolvedValue({
        projectName: 'no-ai-project',
        projectType: 'api',
        targetIDEs: ['cursor'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init', '--no-ai'], { from: 'user' });

      expect(mockAIService.generateSmartDefaults).not.toHaveBeenCalled();
      expect(mockAIService.generateSmartDefaults).not.toHaveBeenCalled();
      expect(mockProgressTracker.startOperation).toHaveBeenCalledWith(
        'init',
        'Project initialization',
        expect.objectContaining({
          aiEnabled: false,
        })
      );
    });
  });

  describe('command options', () => {
    it('should handle --output option', async () => {
      const outputDir = path.join(tempDir, 'custom-output');

      mockPrompt.mockResolvedValue({
        projectName: 'output-test',
        projectType: 'web',
        targetIDEs: ['claude'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init', '--output', outputDir], { from: 'user' });

      // Should create output directory
      expect(await fs.pathExists(outputDir)).toBe(true);
    });

    it('should handle --ide option', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'ide-test',
        projectType: 'web',
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init', '--ide', 'claude,cursor'], {
        from: 'user',
      });

      expect(mockProgressTracker.startOperation).toHaveBeenCalledWith(
        'init',
        'Project initialization',
        expect.objectContaining({
          targetIDEs: ['claude', 'cursor'],
        })
      );
    });

    it('should handle --preset option', async () => {
      // Create a preset file
      const presetDir = path.join(tempDir, '.context-forge', 'presets');
      await fs.ensureDir(presetDir);
      await fs.writeJson(path.join(presetDir, 'nextjs-fastapi.json'), {
        projectType: 'fullstack',
        techStack: { frontend: 'nextjs', backend: 'fastapi' },
        targetIDEs: ['claude'],
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init', '--preset', 'nextjs-fastapi'], {
        from: 'user',
      });

      expect(mockProgressTracker.addStep).toHaveBeenCalledWith('Loading preset configuration');
    });
  });

  describe('file generation', () => {
    it('should generate CLAUDE.md file', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'file-gen-test',
        projectType: 'web',
        description: 'Test project for file generation',
        targetIDEs: ['claude'],
        techStack: { frontend: 'react' },
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      const claudeFile = path.join(tempDir, 'CLAUDE.md');
      expect(await fs.pathExists(claudeFile)).toBe(true);

      const content = await fs.readFile(claudeFile, 'utf-8');
      expect(content).toContain('file-gen-test');
      expect(content).toContain('Test project for file generation');
    });

    it('should generate PRPs directory', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'prp-test',
        projectType: 'fullstack',
        targetIDEs: ['claude'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      const prpDir = path.join(tempDir, 'PRPs');
      expect(await fs.pathExists(prpDir)).toBe(true);
      expect(await fs.pathExists(path.join(prpDir, 'base'))).toBe(true);
      expect(await fs.pathExists(path.join(prpDir, 'planning'))).toBe(true);
    });

    it('should generate .claude directory for Claude IDE', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'claude-dir-test',
        projectType: 'web',
        targetIDEs: ['claude'],
        features: ['hooks', 'commands'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      const claudeDir = path.join(tempDir, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'commands'))).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'hooks'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle setup wizard errors with recovery', async () => {
      const error = new Error('Permission denied');
      mockPrompt.mockRejectedValue(error);

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockErrorRecovery.handleError).toHaveBeenCalled();
      expect(mockProgressTracker.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        'failed',
        expect.objectContaining({
          errors: expect.arrayContaining([expect.stringContaining('Permission denied')]),
        })
      );
    });

    it('should handle file generation errors', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'error-test',
        projectType: 'web',
        targetIDEs: ['claude'],
        confirmed: true,
      });

      // Mock file system error
      (fs.writeFile as any) = jest.fn().mockRejectedValue(new Error('Disk full'));

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error during initialization')
      );

      // Restore original function
      jest.restoreAllMocks();
    });

    it('should handle AI service errors gracefully', async () => {
      mockAIService.generateSmartDefaults.mockRejectedValue(new Error('AI service unavailable'));

      mockPrompt.mockResolvedValue({
        projectName: 'ai-error-test',
        projectType: 'web',
        targetIDEs: ['claude'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      // Should continue with fallback behavior
      expect(mockProgressTracker.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        'completed',
        expect.any(Object)
      );
    });
  });

  describe('progress tracking', () => {
    it('should track all major steps', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'progress-test',
        projectType: 'fullstack',
        targetIDEs: ['claude', 'cursor'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      const expectedSteps = [
        'Interactive setup wizard',
        'Generate documentation',
        'Create project structure',
        'Generate IDE configurations',
        'Validation and cleanup',
      ];

      expectedSteps.forEach((step) => {
        expect(mockProgressTracker.addStep).toHaveBeenCalledWith(step);
      });
    });

    it('should include metadata in progress tracking', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'metadata-test',
        projectType: 'api',
        targetIDEs: ['claude'],
        techStack: { backend: 'fastapi' },
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockProgressTracker.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        'completed',
        expect.objectContaining({
          filesGenerated: expect.any(Number),
          targetIDEs: expect.any(Array),
        })
      );
    });
  });

  describe('validation', () => {
    it('should validate project name input', async () => {
      mockPrompt
        .mockResolvedValueOnce({
          projectName: '', // Invalid empty name
          projectType: 'web',
        })
        .mockResolvedValueOnce({
          projectName: 'valid-project-name',
          projectType: 'web',
          targetIDEs: ['claude'],
          confirmed: true,
        });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      // Should eventually succeed with valid name
      expect(mockProgressTracker.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        'completed',
        expect.any(Object)
      );
    });

    it('should validate IDE selection', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'ide-validation-test',
        projectType: 'web',
        targetIDEs: ['claude', 'invalid-ide'], // Invalid IDE should be filtered
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockProgressTracker.startOperation).toHaveBeenCalledWith(
        'init',
        'Project initialization',
        expect.objectContaining({
          targetIDEs: ['claude'], // Invalid IDE should be removed
        })
      );
    });
  });

  describe('AI integration', () => {
    it('should use AI suggestions when available', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'ai-suggestions-test',
        projectType: 'web',
        targetIDEs: ['claude'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockAIService.generateSmartDefaults).toHaveBeenCalled();
    });

    it('should fall back gracefully when AI is disabled', async () => {
      mockAIService.isAIEnabled.mockReturnValue(false);

      mockPrompt.mockResolvedValue({
        projectName: 'no-ai-fallback-test',
        projectType: 'web',
        targetIDEs: ['claude'],
        confirmed: true,
      });

      const program = new Command();
      program.addCommand(initCommand);

      await program.parseAsync(['node', 'test', 'init'], { from: 'user' });

      expect(mockAIService.generateSmartDefaults).not.toHaveBeenCalled();
      expect(mockProgressTracker.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        'completed',
        expect.any(Object)
      );
    });
  });
});

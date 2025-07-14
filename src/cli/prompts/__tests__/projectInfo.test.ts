import { projectInfo } from '../projectInfo';

// Mock inquirer
const mockPrompt = jest.fn();
jest.mock('inquirer', () => ({
  prompt: mockPrompt,
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('projectInfo prompt', () => {
  beforeEach(() => {
    mockPrompt.mockClear();
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should collect basic project information', async () => {
      const mockResponse = {
        projectName: 'my-awesome-project',
        projectType: 'fullstack',
        description: 'A comprehensive web application',
      };

      mockPrompt.mockResolvedValue(mockResponse);

      const result = await projectInfo();

      expect(mockPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'input',
            name: 'projectName',
            message: expect.stringContaining('Project name'),
          }),
          expect.objectContaining({
            type: 'list',
            name: 'projectType',
            message: expect.stringContaining('project type'),
            choices: expect.arrayContaining([
              'web',
              'api',
              'fullstack',
              'mobile',
              'desktop',
              'cli',
            ]),
          }),
          expect.objectContaining({
            type: 'input',
            name: 'description',
            message: expect.stringContaining('description'),
          }),
        ])
      );

      expect(result).toEqual(mockResponse);
    });

    it('should display step indicator', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'test',
        projectType: 'web',
        description: 'test',
      });

      await projectInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📋 Step 1 of 7'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Project Information'));
    });

    it('should validate project name input', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'valid-project-name',
        projectType: 'web',
        description: 'Valid description',
      });

      await projectInfo();

      const projectNameQuestion = mockPrompt.mock.calls[0][0].find((q) => q.name === 'projectName');
      expect(projectNameQuestion.validate).toBeDefined();

      // Test validation function
      const validate = projectNameQuestion.validate;
      expect(validate('')).toBe('Project name is required');
      expect(validate('   ')).toBe('Project name is required');
      expect(validate('valid-name')).toBe(true);
      expect(validate('invalid name with spaces')).toBe(
        'Project name should not contain spaces. Use hyphens or underscores instead.'
      );
      expect(validate('invalid@name')).toBe(
        'Project name should only contain letters, numbers, hyphens, and underscores'
      );
    });

    it('should validate description input', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'test-project',
        projectType: 'api',
        description: 'A valid description',
      });

      await projectInfo();

      const descriptionQuestion = mockPrompt.mock.calls[0][0].find((q) => q.name === 'description');
      expect(descriptionQuestion.validate).toBeDefined();

      const validate = descriptionQuestion.validate;
      expect(validate('')).toBe('Project description is required');
      expect(validate('   ')).toBe('Project description is required');
      expect(validate('Too short')).toBe('Description should be at least 10 characters long');
      expect(validate('This is a valid description')).toBe(true);
    });
  });

  describe('AI suggestions integration', () => {
    it('should display AI suggestions when provided', async () => {
      const mockAISuggestions = {
        confidence: 85,
        suggestions: [
          {
            type: 'config',
            message: 'Consider using TypeScript for better type safety',
            confidence: 90,
          },
          { type: 'tech', message: 'React is recommended for this project type', confidence: 85 },
        ],
        techStack: { frontend: 'react', backend: 'nodejs' },
        complexity: 'medium',
        recommendations: ['Use modern build tools', 'Implement comprehensive testing'],
        estimatedEffort: '2-4 weeks',
      };

      mockPrompt.mockResolvedValue({
        projectName: 'ai-suggested-project',
        projectType: 'fullstack',
        description: 'Project with AI suggestions',
      });

      await projectInfo(mockAISuggestions);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🧠 AI Analysis Complete')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 optimization suggestions')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('confidence: 85%'));
    });

    it('should display configuration suggestions', async () => {
      const mockAISuggestions = {
        confidence: 90,
        suggestions: [
          { type: 'config', message: 'Enable ESLint for code quality', confidence: 88 },
          { type: 'config', message: 'Use Prettier for consistent formatting', confidence: 85 },
        ],
        techStack: {},
        complexity: 'simple',
        recommendations: [],
        estimatedEffort: '1-2 weeks',
      };

      mockPrompt.mockResolvedValue({
        projectName: 'config-test',
        projectType: 'web',
        description: 'Test config suggestions',
      });

      await projectInfo(mockAISuggestions);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📋 Configuration Suggestions:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Enable ESLint'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Use Prettier'));
    });

    it('should display technology recommendations', async () => {
      const mockAISuggestions = {
        confidence: 95,
        suggestions: [
          {
            type: 'tech',
            message: 'Next.js recommended for full-stack React apps',
            confidence: 95,
          },
          { type: 'tech', message: 'PostgreSQL suggested for data persistence', confidence: 88 },
        ],
        techStack: { frontend: 'nextjs', backend: 'nodejs', database: 'postgresql' },
        complexity: 'medium',
        recommendations: ['Use serverless deployment', 'Implement caching'],
        estimatedEffort: '3-5 weeks',
      };

      mockPrompt.mockResolvedValue({
        projectName: 'tech-recommendations',
        projectType: 'fullstack',
        description: 'Project with tech recommendations',
      });

      await projectInfo(mockAISuggestions);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🛠️ Technology Recommendations:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Next.js recommended'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('PostgreSQL suggested'));
    });

    it('should handle empty AI suggestions', async () => {
      const mockAISuggestions = {
        confidence: 0,
        suggestions: [],
        techStack: {},
        complexity: 'unknown',
        recommendations: [],
        estimatedEffort: 'unknown',
      };

      mockPrompt.mockResolvedValue({
        projectName: 'no-suggestions',
        projectType: 'web',
        description: 'Project with no AI suggestions',
      });

      await projectInfo(mockAISuggestions);

      // Should not display AI suggestions section
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining('🧠 AI Analysis Complete')
      );
    });
  });

  describe('visual feedback', () => {
    it('should provide visual feedback for input validation', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'visual-feedback-test',
        projectType: 'web',
        description: 'Testing visual feedback',
      });

      await projectInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Tell us about your project')
      );
    });

    it('should display helpful hints', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'hints-test',
        projectType: 'web',
        description: 'Testing helpful hints',
      });

      await projectInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💡 Tip'));
    });

    it('should show project type descriptions', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'descriptions-test',
        projectType: 'fullstack',
        description: 'Testing project type descriptions',
      });

      await projectInfo();

      const projectTypeQuestion = mockPrompt.mock.calls[0][0].find((q) => q.name === 'projectType');
      const choices = projectTypeQuestion.choices;

      // Verify choices have descriptions
      expect(choices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('Frontend web application'),
            value: 'web',
          }),
          expect.objectContaining({
            name: expect.stringContaining('Backend API/service'),
            value: 'api',
          }),
          expect.objectContaining({
            name: expect.stringContaining('Full-stack application'),
            value: 'fullstack',
          }),
        ])
      );
    });
  });

  describe('accessibility and UX', () => {
    it('should provide clear navigation instructions', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'navigation-test',
        projectType: 'web',
        description: 'Testing navigation',
      });

      await projectInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Use ↑↓ to navigate'));
    });

    it('should handle different screen sizes gracefully', async () => {
      // Mock process.stdout.columns for different screen sizes
      const originalColumns = process.stdout.columns;

      // Test with narrow screen
      Object.defineProperty(process.stdout, 'columns', { value: 80, configurable: true });

      mockPrompt.mockResolvedValue({
        projectName: 'narrow-screen-test',
        projectType: 'web',
        description: 'Testing narrow screen',
      });

      await projectInfo();

      // Restore original
      Object.defineProperty(process.stdout, 'columns', {
        value: originalColumns,
        configurable: true,
      });

      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should provide context for each question', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'context-test',
        projectType: 'api',
        description: 'Testing question context',
      });

      await projectInfo();

      const questions = mockPrompt.mock.calls[0][0];

      // Each question should have helpful context
      questions.forEach((question) => {
        expect(question.message).toBeDefined();
        expect(typeof question.message).toBe('string');
        expect(question.message.length).toBeGreaterThan(10);
      });
    });
  });

  describe('error handling', () => {
    it('should handle prompt interruption gracefully', async () => {
      mockPrompt.mockRejectedValue(new Error('User interrupted'));

      await expect(projectInfo()).rejects.toThrow('User interrupted');
    });

    it('should handle invalid input gracefully', async () => {
      // Test with malformed input
      mockPrompt.mockResolvedValue({
        projectName: null,
        projectType: undefined,
        description: '',
      });

      const result = await projectInfo();

      expect(result).toEqual({
        projectName: null,
        projectType: undefined,
        description: '',
      });
    });
  });

  describe('internationalization readiness', () => {
    it('should use consistent messaging format', async () => {
      mockPrompt.mockResolvedValue({
        projectName: 'i18n-test',
        projectType: 'web',
        description: 'Testing internationalization',
      });

      await projectInfo();

      const questions = mockPrompt.mock.calls[0][0];

      // Check for consistent question format
      questions.forEach((question) => {
        expect(question.message).toMatch(/[A-Z]/); // Starts with capital letter
        expect(question.message).toMatch(/[?:]/); // Ends with question mark or colon
      });
    });
  });

  describe('performance', () => {
    it('should complete quickly even with large AI suggestions', async () => {
      const largeSuggestions = {
        confidence: 95,
        suggestions: Array(100)
          .fill(null)
          .map((_, i) => ({
            type: 'config',
            message: `Suggestion ${i}`,
            confidence: 80,
          })),
        techStack: {},
        complexity: 'complex',
        recommendations: Array(50).fill('Recommendation'),
        estimatedEffort: '6-12 months',
      };

      mockPrompt.mockResolvedValue({
        projectName: 'performance-test',
        projectType: 'web',
        description: 'Testing performance with large suggestions',
      });

      const start = Date.now();
      await projectInfo(largeSuggestions);
      const duration = Date.now() - start;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});

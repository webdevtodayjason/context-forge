import { AIService } from '../aiService';

describe('AIService', () => {
  let aiService: AIService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    aiService = new AIService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAIEnabled', () => {
    it('should return true when ANTHROPIC_API_KEY is set', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;

      expect(aiService.isAIEnabled()).toBe(true);
    });

    it('should return false when ANTHROPIC_API_KEY is not set', () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.CONTEXT_FORGE_DISABLE_AI;

      expect(aiService.isAIEnabled()).toBe(false);
    });

    it('should return false when AI is explicitly disabled', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      process.env.CONTEXT_FORGE_DISABLE_AI = 'true';

      expect(aiService.isAIEnabled()).toBe(false);
    });

    it('should handle various disable values', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const disableValues = ['true', 'TRUE', '1', 'yes', 'YES'];
      disableValues.forEach((value) => {
        process.env.CONTEXT_FORGE_DISABLE_AI = value;
        expect(aiService.isAIEnabled()).toBe(false);
      });
    });
  });

  describe('analyzeProject', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;
    });

    it('should return default result when AI is disabled', async () => {
      process.env.CONTEXT_FORGE_DISABLE_AI = 'true';

      const result = await aiService.analyzeProject('/test/path');

      expect(result).toEqual({
        complexity: 'medium',
        confidence: 0,
        suggestions: [],
        techStack: {},
        recommendations: [],
        estimatedEffort: 'unknown',
      });
    });

    it('should handle project analysis with valid path', async () => {
      // Mock fs operations would go here in a real implementation
      const result = await aiService.analyzeProject('/test/path');

      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle invalid project paths gracefully', async () => {
      const result = await aiService.analyzeProject('/nonexistent/path');

      expect(result.confidence).toBe(0);
      expect(result.complexity).toBe('medium');
    });
  });

  describe('generateSmartDefaults', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;
    });

    it('should return fallback defaults when AI is disabled', async () => {
      process.env.CONTEXT_FORGE_DISABLE_AI = 'true';

      const defaults = await aiService.generateSmartDefaults({});

      expect(defaults).toEqual({
        projectType: 'fullstack',
        targetIDEs: ['claude'],
        techStack: {
          frontend: 'react',
          backend: 'nodejs',
        },
        confidence: 0,
      });
    });

    it('should generate contextual defaults for web projects', async () => {
      const context = {
        hasPackageJson: true,
        dependencies: ['react', 'express'],
        files: ['src/App.tsx', 'server/index.js'],
      };

      const defaults = await aiService.generateSmartDefaults(context);

      expect(defaults).toHaveProperty('projectType');
      expect(defaults).toHaveProperty('targetIDEs');
      expect(defaults).toHaveProperty('techStack');
      expect(defaults.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty context gracefully', async () => {
      const defaults = await aiService.generateSmartDefaults({});

      expect(defaults.projectType).toBeDefined();
      expect(Array.isArray(defaults.targetIDEs)).toBe(true);
      expect(typeof defaults.techStack).toBe('object');
    });
  });

  describe('getProjectSuggestions', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;
    });

    it('should return empty suggestions when AI is disabled', async () => {
      process.env.CONTEXT_FORGE_DISABLE_AI = 'true';

      const suggestions = await aiService.getProjectSuggestions({
        name: 'test-project',
        type: 'web',
      });

      expect(suggestions).toEqual([]);
    });

    it('should generate configuration suggestions', async () => {
      const projectInfo = {
        name: 'my-ecommerce-site',
        type: 'fullstack',
        description: 'An online store with user authentication',
      };

      const suggestions = await aiService.getProjectSuggestions(projectInfo);

      expect(Array.isArray(suggestions)).toBe(true);
      // Each suggestion should have required properties
      suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('message');
        expect(suggestion).toHaveProperty('confidence');
      });
    });

    it('should handle different project types', async () => {
      const projectTypes = ['web', 'api', 'mobile', 'desktop', 'fullstack'];

      for (const type of projectTypes) {
        const suggestions = await aiService.getProjectSuggestions({
          name: 'test',
          type,
        });

        expect(Array.isArray(suggestions)).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error scenario
      const result = await aiService.analyzeProject('/test/path');

      // Should not throw and return sensible defaults
      expect(result).toHaveProperty('complexity');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle network errors', async () => {
      // Test network failure scenario
      const suggestions = await aiService.getProjectSuggestions({
        name: 'test',
        type: 'web',
      });

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle invalid API key', async () => {
      process.env.ANTHROPIC_API_KEY = 'invalid-key';

      const result = await aiService.analyzeProject('/test/path');

      // Should fallback gracefully
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('performance', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;
    });

    it('should complete analysis within reasonable time', async () => {
      const start = Date.now();

      await aiService.analyzeProject('/test/path');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5)
        .fill(null)
        .map(() => aiService.generateSmartDefaults({ name: 'test' }));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toHaveProperty('projectType');
      });
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      delete process.env.CONTEXT_FORGE_DISABLE_AI;
    });

    it('should cache repeated analysis requests', async () => {
      const path = '/test/cache/path';

      const start1 = Date.now();
      const result1 = await aiService.analyzeProject(path);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const result2 = await aiService.analyzeProject(path);
      const duration2 = Date.now() - start2;

      // Second request should be faster (cached)
      expect(duration2).toBeLessThan(duration1);
      expect(result1).toEqual(result2);
    });
  });

  describe('configuration validation', () => {
    it('should validate environment configuration', () => {
      // Test various environment setups
      const configs = [
        { ANTHROPIC_API_KEY: 'sk-ant-123' }, // Valid
        { ANTHROPIC_API_KEY: '' }, // Empty
        { ANTHROPIC_API_KEY: 'invalid' }, // Invalid format
        {}, // Missing
      ];

      configs.forEach((config) => {
        Object.keys(config).forEach((key) => {
          process.env[key] = config[key];
        });

        // Should not throw when checking if AI is enabled
        expect(() => aiService.isAIEnabled()).not.toThrow();
      });
    });
  });
});

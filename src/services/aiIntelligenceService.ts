import { query, type SDKMessage } from '@anthropic-ai/claude-code';
import { ProjectConfig } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface AIAnalysisResult extends Record<string, unknown> {
  suggestions: SmartSuggestion[];
  confidence: number;
  reasoning: string;
  optimizations: ProjectOptimization[];
}

export interface SmartSuggestion {
  type: 'config' | 'feature' | 'migration' | 'optimization';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'trivial' | 'small' | 'medium' | 'large';
  reasoning: string;
  suggestedConfig?: Partial<ProjectConfig>;
}

export interface ProjectOptimization {
  category: 'performance' | 'security' | 'maintainability' | 'developer-experience';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string[];
}

export interface AIGenerationOptions {
  projectPath: string;
  context?: string;
  maxTurns?: number;
  includeFileContent?: boolean;
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

export class AIIntelligenceService {
  private apiKeySource: string;
  private aiEnabled: boolean;

  constructor() {
    this.apiKeySource = this.detectAPIKeySource();
    this.aiEnabled = this.shouldEnableAI();
  }

  private detectAPIKeySource(): string {
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.CLAUDE_CODE_USE_BEDROCK) return 'bedrock';
    if (process.env.CLAUDE_CODE_USE_VERTEX) return 'vertex';
    return 'none';
  }

  private shouldEnableAI(): boolean {
    // User can explicitly disable AI with environment variable
    if (process.env.CONTEXT_FORGE_DISABLE_AI === 'true') {
      return false;
    }

    // Only enable if we have valid API credentials
    return this.apiKeySource !== 'none';
  }

  async generateSmartDefaults(
    projectPath: string,
    basicAnalysis: Record<string, unknown>,
    options: AIGenerationOptions = { projectPath }
  ): Promise<AIAnalysisResult> {
    if (!this.aiEnabled) {
      return this.getFallbackSuggestions(basicAnalysis);
    }

    try {
      const projectContext = await this.buildProjectContext(projectPath, options);
      const prompt = this.buildSmartDefaultsPrompt(projectContext, basicAnalysis);

      const messages: SDKMessage[] = [];
      for await (const message of query({
        prompt,
        options: {
          maxTurns: options.maxTurns || 3,
        },
      })) {
        messages.push(message);
      }

      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'result' && lastMessage.subtype === 'success') {
        return this.parseAIResponse(lastMessage.result);
      }

      throw new Error('Failed to get AI response');
    } catch (error) {
      console.warn('AI analysis failed, using fallback:', error);
      return this.getFallbackSuggestions(basicAnalysis);
    }
  }

  async suggestEnhancements(
    projectPath: string,
    currentConfig: ProjectConfig,
    options: AIGenerationOptions = { projectPath }
  ): Promise<SmartSuggestion[]> {
    if (!this.aiEnabled) {
      return this.getFallbackEnhancementSuggestions(currentConfig);
    }

    try {
      const projectContext = await this.buildProjectContext(projectPath, options);
      const prompt = this.buildEnhancementPrompt(projectContext, currentConfig);

      const messages: SDKMessage[] = [];
      for await (const message of query({
        prompt,
        options: {
          maxTurns: options.maxTurns || 2,
        },
      })) {
        messages.push(message);
      }

      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'result' && lastMessage.subtype === 'success') {
        const response = this.parseAIResponse(lastMessage.result);
        return response.suggestions || [];
      }

      throw new Error('Failed to get enhancement suggestions');
    } catch (error) {
      console.warn('Enhancement suggestion failed, using fallback:', error);
      return this.getFallbackEnhancementSuggestions(currentConfig);
    }
  }

  async generateErrorRecoverySuggestions(
    error: Error,
    context: string,
    _projectPath: string
  ): Promise<SmartSuggestion[]> {
    if (!this.aiEnabled) {
      return this.getFallbackErrorSuggestions(error);
    }

    try {
      const prompt = this.buildErrorRecoveryPrompt(error, context);

      const messages: SDKMessage[] = [];
      for await (const message of query({
        prompt,
        options: {
          maxTurns: 2,
        },
      })) {
        messages.push(message);
      }

      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'result' && lastMessage.subtype === 'success') {
        const response = this.parseAIResponse(lastMessage.result);
        return response.suggestions || [];
      }

      return this.getFallbackErrorSuggestions(error);
    } catch (aiError) {
      console.warn('Error recovery AI failed:', aiError);
      return this.getFallbackErrorSuggestions(error);
    }
  }

  private async buildProjectContext(
    projectPath: string,
    options: AIGenerationOptions
  ): Promise<string> {
    const context = [`Project Analysis for: ${projectPath}`];

    // Add package.json if it exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        context.push(`Package.json: ${JSON.stringify(packageJson, null, 2)}`);
      } catch {
        context.push('Package.json: [Unable to read]');
      }
    }

    // Add basic file structure
    try {
      const files = await fs.readdir(projectPath);
      context.push(`Root files: ${files.join(', ')}`);
    } catch {
      context.push('Root files: [Unable to read]');
    }

    // Add additional context if provided
    if (options.context) {
      context.push(`Additional context: ${options.context}`);
    }

    return context.join('\n\n');
  }

  private buildSmartDefaultsPrompt(
    projectContext: string,
    basicAnalysis: Record<string, unknown>
  ): string {
    return `
You are an expert software development consultant analyzing a project to provide intelligent configuration suggestions.

Project Context:
${projectContext}

Basic Analysis:
${JSON.stringify(basicAnalysis, null, 2)}

Please analyze this project and provide smart configuration suggestions. Return a JSON response with this structure:

{
  "suggestions": [
    {
      "type": "config|feature|migration|optimization",
      "title": "Brief title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "effort": "trivial|small|medium|large",
      "reasoning": "Why this suggestion makes sense",
      "suggestedConfig": {} // Optional partial configuration
    }
  ],
  "confidence": 0-100,
  "reasoning": "Overall analysis reasoning",
  "optimizations": [
    {
      "category": "performance|security|maintainability|developer-experience",
      "title": "Optimization title",
      "description": "What this optimization does",
      "impact": "high|medium|low",
      "implementation": ["step1", "step2"]
    }
  ]
}

Focus on:
1. Identifying the most suitable IDE configurations
2. Recommending appropriate features for the project type
3. Suggesting performance and security improvements
4. Providing actionable next steps

Be specific and practical in your suggestions.`;
  }

  private buildEnhancementPrompt(projectContext: string, currentConfig: ProjectConfig): string {
    return `
You are an expert software development consultant reviewing an existing project configuration to suggest enhancements.

Project Context:
${projectContext}

Current Configuration:
${JSON.stringify(currentConfig, null, 2)}

Please suggest intelligent enhancements for this project. Return a JSON array of suggestions:

[
  {
    "type": "feature|optimization|migration|config",
    "title": "Enhancement title",
    "description": "Detailed description of the enhancement",
    "priority": "high|medium|low",
    "effort": "trivial|small|medium|large",
    "reasoning": "Why this enhancement would be valuable"
  }
]

Focus on:
1. Missing features that would benefit this project type
2. Performance optimizations
3. Developer experience improvements
4. Security enhancements
5. Maintainability improvements

Be practical and consider the current tech stack and project complexity.`;
  }

  private buildErrorRecoveryPrompt(error: Error, context: string): string {
    return `
You are an expert software troubleshooter helping a developer resolve an error.

Error Details:
- Message: ${error.message}
- Stack: ${error.stack || 'No stack trace available'}

Context:
${context}

Please provide recovery suggestions as a JSON array:

[
  {
    "type": "config",
    "title": "Solution title",
    "description": "Step-by-step solution",
    "priority": "high|medium|low",
    "effort": "trivial|small|medium|large",
    "reasoning": "Why this solution should work"
  }
]

Focus on:
1. Most likely causes and solutions
2. Configuration issues
3. Missing dependencies
4. Permission problems
5. Environment setup issues

Provide actionable, specific solutions.`;
  }

  private parseAIResponse(response: string): AIAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      return {
        suggestions: parsed.suggestions || parsed || [],
        confidence: parsed.confidence || 75,
        reasoning: parsed.reasoning || 'AI analysis completed',
        optimizations: parsed.optimizations || [],
      };
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
      return {
        suggestions: [],
        confidence: 0,
        reasoning: 'Failed to parse AI response',
        optimizations: [],
      };
    }
  }

  private getFallbackSuggestions(basicAnalysis: Record<string, unknown>): AIAnalysisResult {
    const suggestions: SmartSuggestion[] = [];

    // Analyze tech stack for basic suggestions
    if (Array.isArray(basicAnalysis.techStack) && basicAnalysis.techStack.includes('React')) {
      suggestions.push({
        type: 'config',
        title: 'React Development Setup',
        description: 'Configure optimized settings for React development',
        priority: 'high',
        effort: 'trivial',
        reasoning: 'React project detected - optimized configuration recommended',
        suggestedConfig: {
          extras: {
            testing: true,
            linting: true,
            examples: true,
          },
        },
      });
    }

    if (Array.isArray(basicAnalysis.techStack) && basicAnalysis.techStack.includes('TypeScript')) {
      suggestions.push({
        type: 'optimization',
        title: 'TypeScript Optimization',
        description: 'Enable strict TypeScript checking and advanced type features',
        priority: 'medium',
        effort: 'small',
        reasoning: 'TypeScript detected - strict mode will improve code quality',
      });
    }

    return {
      suggestions,
      confidence: 60,
      reasoning: 'Using fallback analysis based on detected tech stack',
      optimizations: [],
    };
  }

  private getFallbackEnhancementSuggestions(config: ProjectConfig): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (!config.extras.testing) {
      suggestions.push({
        type: 'feature',
        title: 'Add Testing Framework',
        description: 'Set up comprehensive testing with jest and testing utilities',
        priority: 'high',
        effort: 'medium',
        reasoning: 'Testing not enabled - critical for project quality',
      });
    }

    if (!config.extras.cicd) {
      suggestions.push({
        type: 'feature',
        title: 'CI/CD Pipeline',
        description: 'Add continuous integration and deployment pipeline',
        priority: 'medium',
        effort: 'large',
        reasoning: 'CI/CD improves deployment reliability and team productivity',
      });
    }

    return suggestions;
  }

  private getFallbackErrorSuggestions(error: Error): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (error.message.includes('permission')) {
      suggestions.push({
        type: 'config',
        title: 'Fix Permission Error',
        description: 'Check file permissions and user access rights',
        priority: 'high',
        effort: 'trivial',
        reasoning: 'Permission error detected in error message',
      });
    }

    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      suggestions.push({
        type: 'config',
        title: 'Missing File or Directory',
        description: 'Verify file paths and ensure required files exist',
        priority: 'high',
        effort: 'small',
        reasoning: 'File not found error detected',
      });
    }

    return suggestions;
  }

  isAIEnabled(): boolean {
    return this.aiEnabled;
  }

  getAIStatus(): string {
    if (!this.aiEnabled) {
      if (process.env.CONTEXT_FORGE_DISABLE_AI === 'true') {
        return 'AI features manually disabled (CONTEXT_FORGE_DISABLE_AI=true)';
      }
      return 'AI features disabled - no API key found';
    }

    switch (this.apiKeySource) {
      case 'anthropic':
        return 'AI enhanced - Connected to Anthropic API';
      case 'bedrock':
        return 'AI enhanced - Connected via Amazon Bedrock';
      case 'vertex':
        return 'AI enhanced - Connected via Google Vertex AI';
      default:
        return 'AI features disabled - no API key found';
    }
  }
}

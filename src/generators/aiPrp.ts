import { ProjectConfig, Feature } from '../types';
import { AIIntelligenceService, AIFeaturePRP, FeaturePRPRequest } from '../services/aiIntelligenceService';
import { generatePRP } from './prp';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

export interface AIEnhancedPRPOptions {
  useAI: boolean;
  fallbackToTemplate: boolean;
  includeAIMetadata: boolean;
}

export interface AIEnhancedPRPResult {
  content: string;
  wasAIGenerated: boolean;
  aiProvider?: string;
  generationTime?: number;
  fallbackReason?: string;
}

/**
 * AI-powered PRP generator that creates intelligent, feature-specific PRPs
 */
export class AIPRPGenerator {
  private aiService: AIIntelligenceService;

  constructor() {
    this.aiService = new AIIntelligenceService();
  }

  /**
   * Generate a PRP with optional AI enhancement
   */
  async generateEnhancedPRP(
    config: ProjectConfig,
    type: 'base' | 'base-enhanced' | 'planning' | 'spec' | 'task' = 'base',
    targetFeature?: Feature,
    options: AIEnhancedPRPOptions = {
      useAI: true,
      fallbackToTemplate: true,
      includeAIMetadata: true,
    }
  ): Promise<AIEnhancedPRPResult> {
    const startTime = Date.now();

    // If AI is requested and we have a specific feature, try AI generation
    if (options.useAI && targetFeature) {
      try {
        const aiResult = await this.generateAIPoweredPRP(config, targetFeature, type);
        if (aiResult) {
          return {
            content: aiResult.content,
            wasAIGenerated: true,
            aiProvider: aiResult.provider,
            generationTime: Date.now() - startTime,
          };
        }
      } catch (error) {
        console.warn(`AI PRP generation failed: ${error}`);
      }
    }

    // Fallback to template-based generation
    if (options.fallbackToTemplate) {
      const templateContent = await generatePRP(config, type, targetFeature);
      return {
        content: templateContent,
        wasAIGenerated: false,
        generationTime: Date.now() - startTime,
        fallbackReason: options.useAI 
          ? 'AI generation failed or unavailable'
          : 'AI generation not requested',
      };
    }

    throw new Error('PRP generation failed and fallback is disabled');
  }

  /**
   * Generate AI-powered PRP content for a specific feature
   */
  private async generateAIPoweredPRP(
    config: ProjectConfig,
    targetFeature: Feature,
    type: string
  ): Promise<{ content: string; provider: string } | null> {
    console.log(`🤖 Generating AI PRP for: ${targetFeature.name}...`);
    
    try {
      const request: FeaturePRPRequest = {
        feature: targetFeature,
        projectConfig: config,
        techStack: config.techStack,
        existingPatterns: await this.detectExistingPatterns(config),
        relatedDocumentation: await this.gatherRelatedDocumentation(config, targetFeature),
      };

      // Add timeout to AI generation
      const aiPRP = await Promise.race([
        this.aiService.generateFeaturePRP(request),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout')), 30000)
        )
      ]);

      if (!aiPRP) {
        console.log(`⚠️  AI generation failed for ${targetFeature.name}, using template fallback`);
        return null;
      }

      console.log(`✅ AI content generated for: ${targetFeature.name}`);

      // Load the appropriate template and merge with AI content
      const template = await this.loadPRPTemplate(type);
      const enhancedContent = await this.mergeAIWithTemplate(template, aiPRP, config, targetFeature);

      return {
        content: enhancedContent,
        provider: await this.detectProvider(),
      };
    } catch (error) {
      console.log(`⚠️  AI generation error for ${targetFeature.name}: ${error}, falling back to template`);
      return null;
    }
  }

  /**
   * Load PRP template for the specified type
   */
  private async loadPRPTemplate(type: string): Promise<string> {
    const templatePath = path.join(__dirname, '../../templates/prp', `${type}.md`);
    
    if (await fs.pathExists(templatePath)) {
      return await fs.readFile(templatePath, 'utf-8');
    }
    
    // Fallback to base template
    const basePath = path.join(__dirname, '../../templates/prp', 'base.md');
    return await fs.readFile(basePath, 'utf-8');
  }

  /**
   * Merge AI-generated content with PRP template
   */
  private async mergeAIWithTemplate(
    template: string,
    aiPRP: AIFeaturePRP,
    config: ProjectConfig,
    targetFeature: Feature
  ): Promise<string> {
    // Create enhanced context that includes AI insights
    const context = {
      projectName: config.projectName,
      featureName: targetFeature.name,
      goal: `Implement ${targetFeature.name} for ${config.projectName}`,
      
      // AI-enhanced content
      reasons: [
        aiPRP.implementationStrategy,
        `${targetFeature.name} provides value to end users`,
        'Foundation for future enhancements',
      ],
      
      description: `${config.description}\n\n**AI-Generated Implementation Strategy:**\n${aiPRP.implementationStrategy}`,
      
      // AI-specific sections
      aiImplementationStrategy: aiPRP.implementationStrategy,
      aiTechnicalApproach: aiPRP.technicalApproach,
      aiValidationApproach: aiPRP.validationApproach,
      aiGotchas: aiPRP.gotchas,
      aiBestPractices: aiPRP.bestPractices,
      aiPseudocode: aiPRP.pseudocode,
      aiTestingStrategy: aiPRP.testingStrategy,
      aiDependencies: aiPRP.dependencies,
      aiComplexity: aiPRP.estimatedComplexity,
      
      // Standard template fields
      successCriteria: [
        `${targetFeature.name} is fully functional`,
        'All AI-recommended validation gates pass',
        'Implementation follows AI-suggested best practices',
      ],
      
      // Merge with existing template data
      language: this.getLanguageFromTechStack(config.techStack),
      testLanguage: this.getTestLanguageFromTechStack(config.techStack),
      
      // AI metadata
      aiGenerated: true,
      aiProvider: await this.detectProvider(),
      generatedAt: new Date().toISOString(),
    };

    // Use enhanced template that includes AI sections
    const enhancedTemplate = this.createAIEnhancedTemplate(template);
    const compiledTemplate = Handlebars.compile(enhancedTemplate);
    
    return compiledTemplate(context);
  }

  /**
   * Create enhanced template with AI-specific sections
   */
  private createAIEnhancedTemplate(baseTemplate: string): string {
    // Add AI-enhanced sections to the template
    const aiSections = `
{{#if aiGenerated}}

## 🤖 AI-Enhanced Implementation Guide

*This PRP has been enhanced with AI-generated insights tailored to your specific feature and tech stack.*

### AI-Generated Implementation Strategy
{{aiImplementationStrategy}}

### Technical Approach
{{aiTechnicalApproach}}

### Validation Approach
{{aiValidationApproach}}

{{#if aiGotchas}}
### ⚠️ AI-Identified Gotchas
{{#each aiGotchas}}
- {{this}}
{{/each}}
{{/if}}

{{#if aiBestPractices}}
### ✅ AI-Recommended Best Practices
{{#each aiBestPractices}}
- {{this}}
{{/each}}
{{/if}}

{{#if aiPseudocode}}
### Pseudocode Implementation
\`\`\`{{language}}
{{aiPseudocode}}
\`\`\`
{{/if}}

### AI-Designed Testing Strategy
{{aiTestingStrategy}}

{{#if aiDependencies}}
### Implementation Dependencies
{{#each aiDependencies}}
- {{this}}
{{/each}}
{{/if}}

### Complexity Assessment
**AI Estimated Complexity:** {{aiComplexity}}

---
*Generated by: {{aiProvider}} on {{generatedAt}}*

{{/if}}
`;

    // Insert AI sections after the main content but before the checklist
    const checklistIndex = baseTemplate.indexOf('## Checklist');
    if (checklistIndex !== -1) {
      return baseTemplate.slice(0, checklistIndex) + aiSections + baseTemplate.slice(checklistIndex);
    }
    
    // If no checklist found, append at the end
    return baseTemplate + aiSections;
  }

  /**
   * Detect existing patterns in the codebase
   */
  private async detectExistingPatterns(config: ProjectConfig): Promise<string[]> {
    const patterns: string[] = [];
    
    // This would analyze the existing codebase to find patterns
    // For now, return patterns based on tech stack
    if (config.techStack.frontend === 'nextjs') {
      patterns.push('Next.js App Router patterns');
      patterns.push('Server Components');
    }
    
    if (config.techStack.backend === 'fastapi') {
      patterns.push('FastAPI async patterns');
      patterns.push('Pydantic models');
    }
    
    return patterns;
  }

  /**
   * Gather related documentation for the feature
   */
  private async gatherRelatedDocumentation(config: ProjectConfig, feature: Feature): Promise<string[]> {
    const docs: string[] = [];
    
    // Look for existing documentation based on feature type
    if (feature.category === 'auth') {
      docs.push('Authentication best practices');
      docs.push('JWT token management');
    }
    
    if (feature.category === 'ui') {
      docs.push('Component design patterns');
      docs.push('Accessibility guidelines');
    }
    
    return docs;
  }

  /**
   * Detect the AI provider being used
   */
  private async detectProvider(): Promise<string> {
    // This would check which provider is actually being used
    if (process.env.ANTHROPIC_API_KEY) return 'Anthropic Claude';
    if (process.env.OPENAI_API_KEY) return 'OpenAI GPT-4';
    
    // Check stored keys
    const aiService = new AIIntelligenceService();
    // Would need to expose the provider detection method
    return 'AI Provider';
  }

  private getLanguageFromTechStack(techStack: ProjectConfig['techStack']): string {
    if (
      techStack.backend === 'fastapi' ||
      techStack.backend === 'django' ||
      techStack.backend === 'flask'
    ) {
      return 'python';
    }
    if (techStack.backend === 'spring-boot') {
      return 'java';
    }
    if (techStack.backend === 'rails') {
      return 'ruby';
    }
    if (techStack.backend === 'aspnet') {
      return 'csharp';
    }
    if (techStack.backend === 'go') {
      return 'go';
    }
    return 'typescript';
  }

  private getTestLanguageFromTechStack(techStack: ProjectConfig['techStack']): string {
    const language = this.getLanguageFromTechStack(techStack);
    if (language === 'python') return 'python';
    if (language === 'java') return 'java';
    if (language === 'ruby') return 'ruby';
    if (language === 'csharp') return 'csharp';
    if (language === 'go') return 'go';
    return 'typescript';
  }
}

/**
 * Convenience function to generate AI-enhanced PRP
 */
export async function generateAIEnhancedPRP(
  config: ProjectConfig,
  type: 'base' | 'base-enhanced' | 'planning' | 'spec' | 'task' = 'base',
  targetFeature?: Feature,
  useAI: boolean = true
): Promise<string> {
  const generator = new AIPRPGenerator();
  const result = await generator.generateEnhancedPRP(config, type, targetFeature, {
    useAI,
    fallbackToTemplate: true,
    includeAIMetadata: true,
  });
  
  return result.content;
}
import { ProjectConfig } from '../types';

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export abstract class IDEAdapter {
  constructor(protected config: ProjectConfig) {}

  abstract get name(): string;
  abstract get description(): string;
  abstract get configFiles(): string[];
  abstract get supportsValidation(): boolean;
  abstract get supportsPRP(): boolean;

  abstract generateFiles(outputPath: string): Promise<GeneratedFile[]>;

  protected getProjectRoot(outputPath: string): string {
    return outputPath;
  }

  protected generateCommonContext(): string {
    const { projectName, description, techStack, features, timeline, teamSize } = this.config;

    return `# ${projectName}

## Project Overview
${description}

## Tech Stack
${Object.entries(techStack)
  .filter(([_, value]) => value)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Key Features
${features
  .filter((f) => f.priority === 'must-have')
  .map((f) => `- ${f.name}: ${f.description}`)
  .join('\n')}

## Development Info
- Timeline: ${timeline}
- Team Size: ${teamSize}
`;
  }

  protected generateTechStackRules(): string {
    const rules = [];
    const { techStack } = this.config;

    if (techStack.frontend === 'nextjs') {
      rules.push(
        '- Use Next.js 15 App Router patterns',
        '- Implement React Server Components where appropriate',
        '- Follow file-based routing conventions'
      );
    }

    if (techStack.frontend === 'react') {
      rules.push(
        '- Use functional components with hooks',
        '- Implement proper TypeScript types',
        '- Follow React best practices'
      );
    }

    if (techStack.backend === 'fastapi') {
      rules.push(
        '- Use async/await for all endpoints',
        '- Implement Pydantic v2 models',
        '- Follow Python type hints'
      );
    }

    if (techStack.backend === 'express') {
      rules.push(
        '- Use TypeScript for type safety',
        '- Implement proper error handling middleware',
        '- Follow RESTful conventions'
      );
    }

    return rules.length > 0 ? `## Tech Stack Rules\n${rules.join('\n')}` : '';
  }

  protected generateSecurityGuidelines(): string {
    return `## Security Guidelines
- Validate all user inputs
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Follow OWASP security best practices
- Never commit secrets to version control`;
  }

  protected generateTestingRequirements(): string {
    const coverage = this.config.techStack.frontend === 'nextjs' ? 85 : 80;
    return `## Testing Requirements
- Minimum ${coverage}% code coverage
- Write tests for all new features
- Test user behavior, not implementation details
- Include both unit and integration tests`;
  }
}

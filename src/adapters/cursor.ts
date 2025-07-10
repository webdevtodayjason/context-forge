import { IDEAdapter, GeneratedFile } from './base';
import path from 'path';

export class CursorAdapter extends IDEAdapter {
  get name(): string {
    return 'Cursor IDE';
  }

  get description(): string {
    return 'AI-powered IDE built on VS Code';
  }

  get configFiles(): string[] {
    return ['.cursorrules', '.cursor/rules/'];
  }

  get supportsValidation(): boolean {
    return true;
  }

  get supportsPRP(): boolean {
    return false; // Cursor doesn't have built-in PRP support
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate .cursorrules (main rules file)
    files.push({
      path: path.join(outputPath, '.cursorrules'),
      content: this.generateCursorRules(),
      description: 'Main Cursor IDE rules file',
    });

    // Generate .cursor/rules/global.md
    files.push({
      path: path.join(outputPath, '.cursor', 'rules', 'global.md'),
      content: this.generateGlobalRules(),
      description: 'Global rules for Cursor',
    });

    // Generate .cursor/rules/project.md
    files.push({
      path: path.join(outputPath, '.cursor', 'rules', 'project.md'),
      content: this.generateProjectRules(),
      description: 'Project-specific rules for Cursor',
    });

    return files;
  }

  private generateCursorRules(): string {
    const techStackRules = this.generateTechStackRules();
    const securityGuidelines = this.generateSecurityGuidelines();
    const testingRequirements = this.generateTestingRequirements();

    return `# Cursor Rules for ${this.config.projectName}

${this.generateCommonContext()}

## Development Philosophy
- Keep It Simple (KISS) - Choose straightforward solutions
- You Aren't Gonna Need It (YAGNI) - Avoid speculative features
- Don't Repeat Yourself (DRY) - Reuse code effectively

## Code Structure Rules
- Never create files longer than 500 lines
- Functions should be focused and single-purpose
- Components/Classes should have single responsibility
- Use descriptive variable and function names

${techStackRules}

## File Organization
\`\`\`
${this.generateProjectStructure()}
\`\`\`

${testingRequirements}

${securityGuidelines}

## Cursor-Specific Guidelines
- Use Cursor's AI features for code generation
- Follow the project's established patterns
- Always review AI-generated code before committing
- Use Cursor's chat for clarification on complex tasks

## Pre-commit Checklist
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] No debug statements left
- [ ] Security considerations addressed
`;
  }

  private generateGlobalRules(): string {
    return `# Global Cursor Rules

## General Coding Standards
- Write clean, readable, and maintainable code
- Follow language-specific best practices
- Use meaningful commit messages
- Document complex logic

## AI Assistance Guidelines
- Be specific in your prompts
- Review all generated code
- Test thoroughly before committing
- Don't rely solely on AI for critical logic

## Common Patterns
- Use dependency injection
- Implement proper error handling
- Follow SOLID principles
- Write testable code
`;
  }

  private generateProjectRules(): string {
    const { projectName, description, features } = this.config;

    return `# Project-Specific Rules: ${projectName}

## Project Context
${description}

## Key Features to Implement
${features
  .map(
    (f) => `### ${f.name} (${f.priority})
- ${f.description}
- Complexity: ${f.complexity}
${f.subtasks ? `- Subtasks:\n${f.subtasks.map((st) => `  - ${st}`).join('\n')}` : ''}`
  )
  .join('\n\n')}

## Implementation Stages
1. **Foundation** - Set up project structure and core dependencies
2. **Core Features** - Implement must-have functionality
3. **Enhancement** - Add should-have features
4. **Polish** - Optimize and refine

## Project-Specific Guidelines
${this.generateProjectSpecificGuidelines()}
`;
  }

  private generateProjectStructure(): string {
    const { techStack } = this.config;

    if (techStack.frontend === 'nextjs' && techStack.backend === 'fastapi') {
      return `frontend/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── package.json

backend/
├── app/
│   ├── api/
│   ├── core/
│   └── models/
└── requirements.txt`;
    }

    // Return appropriate structure based on tech stack
    return this.generateDefaultStructure();
  }

  private generateDefaultStructure(): string {
    return `src/
├── components/
├── services/
├── utils/
└── tests/`;
  }

  private generateProjectSpecificGuidelines(): string {
    const guidelines = [];
    const { techStack } = this.config;

    if (techStack.frontend === 'nextjs') {
      guidelines.push('- Use Server Components by default, Client Components only when needed');
      guidelines.push('- Implement proper loading and error states');
      guidelines.push('- Optimize images with next/image');
    }

    if (techStack.backend === 'fastapi') {
      guidelines.push('- Use Pydantic for request/response validation');
      guidelines.push('- Implement async endpoints for better performance');
      guidelines.push('- Use dependency injection for shared resources');
    }

    if (techStack.database === 'postgresql') {
      guidelines.push('- Use migrations for schema changes');
      guidelines.push('- Implement proper indexing for performance');
      guidelines.push('- Use connection pooling');
    }

    return guidelines.join('\n');
  }
}

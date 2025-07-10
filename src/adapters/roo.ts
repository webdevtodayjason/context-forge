import { IDEAdapter, GeneratedFile } from './base';
import path from 'path';

export class RooCodeAdapter extends IDEAdapter {
  get name(): string {
    return 'Roo Code';
  }

  get description(): string {
    return 'VS Code extension for AI-assisted development';
  }

  get configFiles(): string[] {
    return ['.roo/rules/', '.roorules'];
  }

  get supportsValidation(): boolean {
    return true;
  }

  get supportsPRP(): boolean {
    return false;
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate .roorules (root configuration)
    files.push({
      path: path.join(outputPath, '.roorules'),
      content: this.generateRooRules(),
      description: 'Root Roo Code configuration',
    });

    // Generate .roo/rules/global.md
    files.push({
      path: path.join(outputPath, '.roo', 'rules', 'global.md'),
      content: this.generateGlobalRules(),
      description: 'Global Roo Code rules',
    });

    // Generate .roo/rules/workspace.md
    files.push({
      path: path.join(outputPath, '.roo', 'rules', 'workspace.md'),
      content: this.generateWorkspaceRules(),
      description: 'Workspace-specific Roo Code rules',
    });

    return files;
  }

  private generateRooRules(): string {
    return `# Roo Code Configuration

version: 1.0
project: ${this.config.projectName}
description: ${this.config.description}

# Rule hierarchy
rules:
  - global.md     # Always loaded
  - workspace.md  # Project-specific rules

# Settings
settings:
  autoSuggest: true
  validateOnSave: true
  formatOnSave: true
  
# Tech stack
stack:
${Object.entries(this.config.techStack)
  .filter(([_, value]) => value)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}
`;
  }

  private generateGlobalRules(): string {
    const techStackRules = this.generateTechStackRules();
    const securityGuidelines = this.generateSecurityGuidelines();

    return `# Global Roo Code Rules

## Core Principles
1. **Code Quality** - Write clean, maintainable code
2. **Consistency** - Follow established patterns
3. **Documentation** - Document complex logic
4. **Testing** - Test all new features

## Development Standards
- Use version control effectively
- Write descriptive commit messages
- Review code before committing
- Keep dependencies up to date

${techStackRules}

## Code Organization
- Separate concerns properly
- Use meaningful file and folder names
- Group related functionality
- Avoid circular dependencies

${securityGuidelines}

## Error Handling
- Catch and handle errors appropriately
- Log errors with context
- Provide user-friendly error messages
- Never expose sensitive information in errors
`;
  }

  private generateWorkspaceRules(): string {
    const { projectName, features, timeline, teamSize } = this.config;
    const testingRequirements = this.generateTestingRequirements();

    return `# Workspace Rules: ${projectName}

${this.generateCommonContext()}

## Project Structure
\`\`\`
${this.generateProjectStructure()}
\`\`\`

## Implementation Guidelines

### Phase 1: Foundation (Week 1)
- Set up development environment
- Initialize project structure
- Configure build tools
- Set up version control

### Phase 2: Core Features (Weeks 2-3)
${features
  .filter((f) => f.priority === 'must-have')
  .map((f) => `- Implement ${f.name}`)
  .join('\n')}

### Phase 3: Enhancement (Week 4)
${features
  .filter((f) => f.priority === 'should-have')
  .map((f) => `- Add ${f.name}`)
  .join('\n')}

### Phase 4: Polish (Week 5)
- Performance optimization
- UI/UX improvements
- Documentation updates
- Deployment preparation

${testingRequirements}

## Roo Code Specific Features
- Use Roo's AI suggestions for boilerplate code
- Leverage context understanding for better completions
- Use workspace rules for project consistency
- Keep rules updated as project evolves

## Team Collaboration (${teamSize} team)
${this.generateTeamGuidelines()}

## Timeline: ${timeline}
${this.generateTimelineSpecificGuidelines()}
`;
  }

  private generateProjectStructure(): string {
    const { techStack } = this.config;

    if (techStack.frontend === 'react' && techStack.backend === 'express') {
      return `client/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── App.tsx
└── package.json

server/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── app.ts
└── package.json`;
    }

    if (techStack.frontend === 'vue' && techStack.backend === 'django') {
      return `frontend/
├── src/
│   ├── components/
│   ├── views/
│   ├── store/
│   └── main.js
└── package.json

backend/
├── apps/
├── config/
├── static/
├── templates/
└── manage.py`;
    }

    return this.generateDefaultStructure();
  }

  private generateDefaultStructure(): string {
    return `src/
├── components/
├── services/
├── utils/
├── tests/
└── config/`;
  }

  private generateTeamGuidelines(): string {
    const { teamSize } = this.config;

    switch (teamSize) {
      case 'solo':
        return `- Focus on personal productivity
- Document for future reference
- Use TODO comments for task tracking`;

      case 'small':
        return `- Daily standups recommended
- Code reviews for all PRs
- Shared documentation in team wiki
- Clear task assignment`;

      case 'medium':
        return `- Formal code review process
- Feature branches workflow
- Regular team syncs
- Designated code owners`;

      case 'large':
        return `- Structured development process
- Multiple review approvals
- Detailed documentation requirements
- Architecture decision records`;

      default:
        return '- Follow team collaboration best practices';
    }
  }

  private generateTimelineSpecificGuidelines(): string {
    const { timeline } = this.config;

    switch (timeline) {
      case 'mvp':
        return `- Focus on core functionality only
- Rapid iteration and feedback
- Technical debt acceptable for speed
- Document shortcuts taken`;

      case 'standard':
        return `- Balanced approach to features
- Regular refactoring cycles
- Comprehensive testing
- Sustainable development pace`;

      case 'enterprise':
        return `- Extensive planning phase
- Rigorous quality standards
- Complete documentation
- Security and compliance focus`;

      default:
        return '- Follow project timeline requirements';
    }
  }
}

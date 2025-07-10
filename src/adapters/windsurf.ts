import { IDEAdapter, GeneratedFile } from './base';
import { Feature } from '../types';
import path from 'path';

export class WindsurfAdapter extends IDEAdapter {
  get name(): string {
    return 'Windsurf IDE';
  }

  get description(): string {
    return 'AI-powered IDE with Cascade AI integration';
  }

  get configFiles(): string[] {
    return ['.windsurfrules.md', '.codeiumignore', 'global_rules.md'];
  }

  get supportsValidation(): boolean {
    return true;
  }

  get supportsPRP(): boolean {
    return false;
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate .windsurfrules.md (project-specific rules)
    files.push({
      path: path.join(outputPath, '.windsurfrules.md'),
      content: this.generateWindsurfRules(),
      description: 'Project-specific rules for Windsurf',
    });

    // Generate global_rules.md
    files.push({
      path: path.join(outputPath, 'global_rules.md'),
      content: this.generateGlobalRules(),
      description: 'Global rules for Windsurf',
    });

    // Generate .codeiumignore
    files.push({
      path: path.join(outputPath, '.codeiumignore'),
      content: this.generateCodeiumIgnore(),
      description: 'Files to ignore in Cascade AI',
    });

    // Generate windsurf_workflows/test_and_lint.yaml
    files.push({
      path: path.join(outputPath, 'windsurf_workflows', 'test_and_lint.yaml'),
      content: this.generateWorkflowExample(),
      description: 'Example workflow for testing and linting',
    });

    return files;
  }

  private generateWindsurfRules(): string {
    const techStackRules = this.generateTechStackRules();
    const securityGuidelines = this.generateSecurityGuidelines();
    const testingRequirements = this.generateTestingRequirements();

    return `# Cascade AI Rules for ${this.config.projectName}

## Project Configuration
${this.generateCommonContext()}

## Cascade AI Settings
\`\`\`yaml
cascade:
  mode: collaborative
  context_awareness: high
  suggestion_level: balanced
  auto_complete: true
  error_prevention: true
\`\`\`

## Development Philosophy
- **Predictive Assistance**: Let Cascade AI anticipate your needs
- **Collaborative Coding**: Work with AI as a pair programmer
- **Quality First**: Use AI to prevent bugs before they happen
- **Continuous Learning**: Cascade adapts to your coding style

## Code Standards
- Maximum file size: 500 lines
- Clear function names and documentation
- Consistent code style across the project
- Follow language-specific best practices

${techStackRules}

## Project Structure
\`\`\`
${this.generateProjectStructure()}
\`\`\`

## Cascade AI Workflows

### Code Generation
- Use natural language prompts
- Reference existing patterns
- Let Cascade suggest implementations
- Review and refine AI suggestions

### Error Prevention
- Real-time error detection
- Suggested fixes before runtime
- Type safety enforcement
- Security vulnerability scanning

### Refactoring Assistance
- Identify code smells
- Suggest improvements
- Maintain backward compatibility
- Update related files automatically

${testingRequirements}

${securityGuidelines}

## Windsurf-Specific Features

### Cascade AI Commands
- \`cascade:generate\` - Generate code from description
- \`cascade:refactor\` - Improve existing code
- \`cascade:explain\` - Get code explanations
- \`cascade:test\` - Generate test cases
- \`cascade:review\` - AI code review

### Integration Points
- Git integration for version control
- Terminal integration for commands
- Debugger integration for troubleshooting
- Package manager integration

## Best Practices
- Let Cascade AI learn from your codebase
- Use descriptive prompts for better results
- Review AI suggestions before accepting
- Provide feedback to improve AI responses
`;
  }

  private generateContextFile(): string {
    const { projectName, description, features } = this.config;

    return `# Windsurf Project Context

## ${projectName}
${description}

## Key Features
${features
  .map(
    (f) => `### ${f.name}
**Priority**: ${f.priority}
**Complexity**: ${f.complexity}
**Description**: ${f.description}

**Implementation Notes**:
${this.generateFeatureNotes(f)}
`
  )
  .join('\n')}

## Development Workflow with Cascade AI

### 1. Feature Planning
- Describe the feature in natural language
- Let Cascade AI suggest implementation approach
- Review and refine the plan

### 2. Implementation
- Use Cascade AI for boilerplate generation
- Get real-time suggestions while coding
- Let AI handle repetitive tasks

### 3. Testing
- Generate test cases with AI
- Ensure comprehensive coverage
- Use AI to identify edge cases

### 4. Review
- Cascade AI performs initial code review
- Identifies potential issues
- Suggests optimizations

## Project Structure
${this.generateProjectStructure()}

## Technology Decisions
${this.generateTechDecisions()}

## Cascade AI Configuration
\`\`\`yaml
project_type: ${this.config.projectType}
primary_language: ${this.getPrimaryLanguage()}
framework: ${this.getPrimaryFramework()}
testing_framework: ${this.getTestingFramework()}
code_style: ${this.getCodeStyle()}
\`\`\`
`;
  }

  private generateWorkflowsFile(): string {
    return `# Cascade AI Workflows

## Quick Start Workflows

### New Feature Development
\`\`\`
1. Open Cascade AI panel
2. Describe feature: "Add user authentication with JWT"
3. Review generated plan
4. Accept implementation steps
5. Let Cascade AI generate code
6. Review and test
\`\`\`

### Bug Fixing Workflow
\`\`\`
1. Describe the bug in Cascade AI
2. AI analyzes codebase for causes
3. Review suggested fixes
4. Apply fix with AI assistance
5. Generate regression tests
\`\`\`

### Code Refactoring
\`\`\`
1. Select code to refactor
2. Use Cascade command: "Refactor for better performance"
3. Review AI suggestions
4. Apply refactoring incrementally
5. Ensure tests still pass
\`\`\`

## Advanced Workflows

### Architecture Design
- Describe system requirements
- Let Cascade AI suggest architecture
- Generate component diagrams
- Create implementation plan

### Performance Optimization
- Profile application with AI
- Identify bottlenecks
- Get optimization suggestions
- Implement improvements

### Security Audit
- Run Cascade security scan
- Review vulnerability report
- Apply security patches
- Generate security tests

## Custom Workflows

### Define Your Own
\`\`\`yaml
workflow: custom_workflow_name
trigger: manual | file_save | git_commit
steps:
  - analyze_code
  - suggest_improvements
  - generate_tests
  - update_documentation
\`\`\`

## Cascade AI Tips

### Effective Prompts
- Be specific about requirements
- Include context about constraints
- Reference existing code patterns
- Specify expected output format

### Learning from Feedback
- Correct AI mistakes immediately
- Provide positive reinforcement
- Share good examples
- Report persistent issues

### Collaboration Settings
\`\`\`yaml
cascade_collaboration:
  suggestion_frequency: balanced
  auto_complete_delay: 300ms
  context_window: large
  learn_from_edits: true
\`\`\`
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

    if (techStack.frontend === 'react' && techStack.backend === 'express') {
      return `client/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── package.json

server/
├── src/
│   ├── routes/
│   ├── controllers/
│   └── models/
└── package.json`;
    }

    return `src/
├── components/
├── services/
├── utils/
└── tests/`;
  }

  private generateCodeiumIgnore(): string {
    return `# Windsurf/Cascade AI ignore file
# Prevents Cascade from viewing, editing or creating files in these paths

# Dependencies
node_modules/
*.pyc
__pycache__/
venv/
.env

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Test coverage
coverage/
.coverage
htmlcov/

# Temporary files
*.tmp
*.temp
.cache/
`;
  }

  private generateGlobalRules(): string {
    return `# Global Rules for Windsurf

## Development Standards
- Write clean, maintainable code
- Follow language-specific best practices
- Document complex logic
- Write tests for new features

## Communication Style
- Be clear and concise in comments
- Use descriptive variable names
- Explain "why" not just "what"

## Code Quality
- No code duplication
- Keep functions small and focused
- Handle errors gracefully
- Follow SOLID principles

## Security
- Never commit secrets
- Validate all inputs
- Use environment variables
- Follow OWASP guidelines

## Performance
- Optimize for readability first
- Profile before optimizing
- Consider scalability
- Cache when appropriate
`;
  }

  private generateWorkflowExample(): string {
    return `name: Test and Lint Workflow
description: Run tests and linting before committing

trigger:
  - pre_commit
  - manual

steps:
  - name: Run Linter
    command: |
      if [ -f "package.json" ]; then
        npm run lint
      elif [ -f "requirements.txt" ]; then
        python -m pylint src/
      fi
    
  - name: Run Tests
    command: |
      if [ -f "package.json" ]; then
        npm test
      elif [ -f "requirements.txt" ]; then
        python -m pytest
      fi
    
  - name: Check Coverage
    command: |
      if [ -f "package.json" ]; then
        npm run test:coverage
      elif [ -f "requirements.txt" ]; then
        python -m pytest --cov
      fi
    minimum_coverage: 80

success_message: "All checks passed! Ready to commit."
failure_message: "Checks failed. Please fix issues before committing."
`;
  }

  private generateFeatureNotes(feature: Feature): string {
    const notes = [];

    if (feature.complexity === 'complex') {
      notes.push('- Use Cascade AI to break down into subtasks');
      notes.push('- Generate architecture diagram first');
    }

    if (feature.priority === 'must-have') {
      notes.push('- Critical for MVP');
      notes.push('- Implement with comprehensive tests');
    }

    if (feature.dependencies && feature.dependencies.length > 0) {
      notes.push(`- Dependencies: ${feature.dependencies.join(', ')}`);
    }

    notes.push('- Let Cascade AI suggest implementation approach');

    return notes.join('\n');
  }

  private generateTechDecisions(): string {
    const { techStack } = this.config;
    const decisions = [];

    if (techStack.frontend) {
      decisions.push(`- **Frontend**: ${techStack.frontend} for modern UI development`);
    }
    if (techStack.backend) {
      decisions.push(`- **Backend**: ${techStack.backend} for scalable API`);
    }
    if (techStack.database) {
      decisions.push(`- **Database**: ${techStack.database} for data persistence`);
    }
    if (techStack.auth) {
      decisions.push(`- **Authentication**: ${techStack.auth} for secure access`);
    }

    return decisions.join('\n');
  }

  private getPrimaryLanguage(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'fastapi' || techStack.backend === 'django') return 'python';
    if (techStack.frontend || techStack.backend === 'express') return 'typescript';
    return 'javascript';
  }

  private getPrimaryFramework(): string {
    const { techStack } = this.config;
    return techStack.frontend || techStack.backend || 'none';
  }

  private getTestingFramework(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'fastapi' || techStack.backend === 'django') return 'pytest';
    if (techStack.frontend === 'react' || techStack.frontend === 'nextjs') return 'jest';
    return 'mocha';
  }

  private getCodeStyle(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'fastapi' || techStack.backend === 'django') return 'pep8';
    return 'prettier';
  }
}

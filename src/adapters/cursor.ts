import { IDEAdapter, GeneratedFile } from './base';
import { Feature, ProjectConfig } from '../types';
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
    return true; // Cursor now supports PRP through .cursor/rules/
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

    // Generate PRP files if features are defined
    if (this.config.features && this.config.features.length > 0) {
      // PRP Overview
      files.push({
        path: path.join(outputPath, '.cursor', 'rules', 'prp-overview.mdc'),
        content: this.generatePRPOverview(),
        description: 'PRP implementation overview',
      });

      // Stage-specific PRP files
      files.push({
        path: path.join(outputPath, '.cursor', 'rules', 'prp-stage-1.mdc'),
        content: this.generatePRPStage1(),
        description: 'PRP Stage 1: Foundation',
      });

      files.push({
        path: path.join(outputPath, '.cursor', 'rules', 'prp-stage-2.mdc'),
        content: this.generatePRPStage2(),
        description: 'PRP Stage 2: Core Features',
      });

      files.push({
        path: path.join(outputPath, '.cursor', 'rules', 'prp-stage-3.mdc'),
        content: this.generatePRPStage3(),
        description: 'PRP Stage 3: Advanced Features',
      });

      // Validation gates
      files.push({
        path: path.join(outputPath, '.cursor', 'rules', 'prp-validation.mdc'),
        content: this.generatePRPValidation(),
        description: 'PRP validation gates and commands',
      });
    }

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

  private generatePRPOverview(): string {
    const { projectName, features } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Implementation Overview: ${projectName}

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages.

## Implementation Stages

### 📋 Stage 1: Foundation (see prp-stage-1.mdc)
- Project setup and configuration
- Core infrastructure
- Basic models and schemas
- Database setup

### 🚀 Stage 2: Core Features (see prp-stage-2.mdc)
${mustHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}

### ✨ Stage 3: Advanced Features (see prp-stage-3.mdc)
${shouldHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}
${niceToHaveFeatures.length > 0 ? '\n**Nice-to-have features:**\n' + niceToHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n') : ''}

### ✅ Validation Gates (see prp-validation.mdc)
- Each stage has validation requirements
- Must pass before proceeding to next stage
- Automated testing and quality checks

## How to Use This PRP

1. Start with **prp-stage-1.mdc**
2. Complete all tasks in the checklist
3. Run validation commands from **prp-validation.mdc**
4. Only proceed to next stage when validation passes
5. Use Cursor's AI features to help implement each task

## Success Criteria

- All must-have features implemented and tested
- Code coverage meets requirements (>80%)
- All validation gates passed
- Documentation complete
- Security best practices followed
`;
  }

  private generatePRPStage1(): string {
    const { techStack } = this.config;

    return `---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Stage 1: Foundation

## Objective
Set up the project foundation with proper structure, configuration, and core infrastructure.

## Tasks Checklist

### Project Setup
- [ ] Initialize project structure
- [ ] Set up version control (.gitignore)
- [ ] Configure development environment
- [ ] Install core dependencies
- [ ] Set up linting and formatting

### Infrastructure
${
  techStack.frontend
    ? `- [ ] Set up ${techStack.frontend} with TypeScript
- [ ] Configure build tools
- [ ] Set up development server`
    : ''
}
${
  techStack.backend
    ? `- [ ] Initialize ${techStack.backend} project
- [ ] Set up API structure
- [ ] Configure middleware`
    : ''
}
${
  techStack.database
    ? `- [ ] Set up ${techStack.database} connection
- [ ] Create database schema
- [ ] Set up migrations`
    : ''
}

### Core Configuration
- [ ] Environment variables setup
- [ ] Configuration management
- [ ] Logging setup
- [ ] Error handling structure

### Testing Foundation
- [ ] Set up testing framework
- [ ] Create test structure
- [ ] Write first unit test
- [ ] Configure test coverage

## Validation Requirements

Before proceeding to Stage 2, ensure:

1. **Project runs locally**
   \`\`\`bash
   npm run dev  # or equivalent
   \`\`\`

2. **Tests pass**
   \`\`\`bash
   npm test
   \`\`\`

3. **Linting passes**
   \`\`\`bash
   npm run lint
   \`\`\`

4. **Type checking passes** (if TypeScript)
   \`\`\`bash
   npm run type-check
   \`\`\`

## Success Criteria

- [ ] Development environment is fully functional
- [ ] All developers can run the project locally
- [ ] Basic CI/CD pipeline is configured
- [ ] Project structure follows best practices
- [ ] Documentation is started (README.md)

## Common Gotchas

${this.generateStage1Gotchas()}

## Next Steps

Once all validation passes, proceed to **prp-stage-2.mdc** for core feature implementation.
`;
  }

  private generatePRPStage2(): string {
    const { features, techStack } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');

    return `---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Stage 2: Core Features

## Objective
Implement all must-have features with proper testing and documentation.

## Features to Implement

${mustHaveFeatures
  .map(
    (feature) => `### ${feature.name}
**Description**: ${feature.description}
**Complexity**: ${feature.complexity}

#### Tasks:
${this.generateFeatureTasks(feature, techStack)}

#### Acceptance Criteria:
${this.generateAcceptanceCriteria(feature)}
`
  )
  .join('\n')}

## Integration Requirements

### API Integration
- [ ] All endpoints documented
- [ ] Error responses standardized
- [ ] Authentication implemented (if required)
- [ ] Rate limiting configured

### Frontend Integration
- [ ] All UI components functional
- [ ] Forms validated
- [ ] Error states handled
- [ ] Loading states implemented

### Testing Requirements
- [ ] Unit tests for all features
- [ ] Integration tests for critical paths
- [ ] E2E tests for user journeys
- [ ] Performance tests for key operations

## Validation Requirements

Run these commands before proceeding:

1. **All tests pass with coverage**
   \`\`\`bash
   npm run test:coverage
   \`\`\`

2. **Build succeeds**
   \`\`\`bash
   npm run build
   \`\`\`

3. **No security vulnerabilities**
   \`\`\`bash
   npm audit
   \`\`\`

## Success Criteria

- [ ] All must-have features are working
- [ ] Test coverage > 80%
- [ ] All features are documented
- [ ] Code review completed
- [ ] Performance benchmarks met

## Next Steps

Once validation passes, proceed to **prp-stage-3.mdc** for advanced features.
`;
  }

  private generatePRPStage3(): string {
    const { features } = this.config;
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Stage 3: Advanced Features & Polish

## Objective
Implement should-have features and optimize the application for production.

## Features to Implement

${
  shouldHaveFeatures.length > 0
    ? `### Should-Have Features
${shouldHaveFeatures
  .map(
    (feature) => `
#### ${feature.name}
**Description**: ${feature.description}
**Complexity**: ${feature.complexity}

Tasks:
${this.generateFeatureTasks(feature, this.config.techStack)}
`
  )
  .join('\n')}`
    : ''
}

${
  niceToHaveFeatures.length > 0
    ? `### Nice-to-Have Features (if time permits)
${niceToHaveFeatures
  .map(
    (feature) => `
#### ${feature.name}
**Description**: ${feature.description}
**Complexity**: ${feature.complexity}
`
  )
  .join('\n')}`
    : ''
}

## Optimization Tasks

### Performance
- [ ] Implement caching strategy
- [ ] Optimize database queries
- [ ] Add lazy loading
- [ ] Minimize bundle size
- [ ] Implement CDN strategy

### Security
- [ ] Security audit
- [ ] Penetration testing
- [ ] OWASP compliance check
- [ ] SSL/TLS configuration
- [ ] Rate limiting optimization

### User Experience
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Mobile responsiveness
- [ ] Progressive enhancement
- [ ] Error recovery flows
- [ ] User feedback mechanisms

### Monitoring & Analytics
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Implement analytics
- [ ] Set up error tracking
- [ ] Performance monitoring

## Production Readiness

### Deployment
- [ ] Production build optimization
- [ ] Environment configuration
- [ ] CI/CD pipeline complete
- [ ] Rollback procedures
- [ ] Blue-green deployment

### Documentation
- [ ] API documentation complete
- [ ] User documentation
- [ ] Developer onboarding guide
- [ ] Troubleshooting guide
- [ ] Architecture decisions recorded

## Validation Requirements

1. **Performance benchmarks**
   \`\`\`bash
   npm run benchmark
   \`\`\`

2. **Security scan**
   \`\`\`bash
   npm run security:scan
   \`\`\`

3. **Lighthouse audit** (if web app)
   - Performance > 90
   - Accessibility > 95
   - Best Practices > 95
   - SEO > 90

## Success Criteria

- [ ] All should-have features implemented
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Ready for production deployment

## Congratulations! 🎉

Your project is now ready for production. Remember to:
- Monitor performance metrics
- Gather user feedback
- Plan for iterative improvements
- Keep dependencies updated
`;
  }

  private generatePRPValidation(): string {
    const { techStack } = this.config;

    return `---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Validation Gates

## Overview

Each stage must pass validation before proceeding. This ensures quality and prevents technical debt accumulation.

## Stage 1 Validation

### Commands to Run
${this.generateValidationCommands(techStack, 1)}

### Checklist
- [ ] Project runs without errors
- [ ] Basic tests pass
- [ ] Linting configured and passing
- [ ] Git repository initialized
- [ ] README.md created

### Common Issues
- Missing environment variables
- Incorrect Node/Python version
- Database connection failures
- Missing dependencies

## Stage 2 Validation

### Commands to Run
${this.generateValidationCommands(techStack, 2)}

### Checklist
- [ ] All must-have features working
- [ ] Test coverage > 80%
- [ ] No critical security issues
- [ ] API documentation complete
- [ ] Integration tests passing

### Performance Targets
- API response time < 200ms
- Frontend load time < 3s
- Database queries optimized
- Memory usage stable

## Stage 3 Validation

### Commands to Run
${this.generateValidationCommands(techStack, 3)}

### Checklist
- [ ] Production build successful
- [ ] All tests passing
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Production Readiness
- Load testing completed
- Monitoring configured
- Backup procedures tested
- Rollback plan documented

## Automated Validation Script

Create a \`validate.sh\` script:

\`\`\`bash
#!/bin/bash
set -e

echo "🔍 Running validation..."

# Stage-specific validation
case "$1" in
  "stage1")
    ${this.generateStageValidationScript(1)}
    ;;
  "stage2")
    ${this.generateStageValidationScript(2)}
    ;;
  "stage3")
    ${this.generateStageValidationScript(3)}
    ;;
  *)
    echo "Usage: ./validate.sh [stage1|stage2|stage3]"
    exit 1
    ;;
esac

echo "✅ Validation passed!"
\`\`\`

## Continuous Validation

### Git Hooks
Set up pre-commit hooks for continuous validation:

\`\`\`bash
npm install --save-dev husky
npx husky init
echo "npm run lint" > .husky/pre-commit
\`\`\`

### CI/CD Integration
Add validation to your CI pipeline:

\`\`\`yaml
# .github/workflows/validate.yml
name: Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run validate:all
\`\`\`

## Troubleshooting

### Validation Failures
1. Check error messages carefully
2. Run individual commands to isolate issues
3. Check environment variables
4. Verify dependencies are installed
5. Review recent changes

### Getting Help
- Check project documentation
- Review error logs
- Ask Cursor AI for assistance
- Check Stack Overflow
- Open an issue if blocked
`;
  }

  private generateStage1Gotchas(): string {
    const { techStack } = this.config;
    const gotchas = [];

    if (techStack.frontend === 'nextjs') {
      gotchas.push('- Next.js 15 requires Node.js 18.17 or later');
      gotchas.push('- App Router is the default (not Pages Router)');
    }
    if (techStack.backend === 'fastapi') {
      gotchas.push('- Python 3.8+ required for FastAPI');
      gotchas.push('- Use virtual environment for dependencies');
    }
    if (techStack.database === 'postgresql') {
      gotchas.push('- PostgreSQL must be running locally or via Docker');
      gotchas.push('- Create database before running migrations');
    }

    return gotchas.join('\n');
  }

  private generateFeatureTasks(feature: Feature, techStack: ProjectConfig['techStack']): string {
    const tasks = [];

    // Backend tasks
    if (techStack.backend) {
      tasks.push('- [ ] Create data models/schemas');
      tasks.push('- [ ] Implement business logic');
      tasks.push('- [ ] Create API endpoints');
      tasks.push('- [ ] Add validation');
      tasks.push('- [ ] Write unit tests');
    }

    // Frontend tasks
    if (techStack.frontend) {
      tasks.push('- [ ] Create UI components');
      tasks.push('- [ ] Implement state management');
      tasks.push('- [ ] Connect to API');
      tasks.push('- [ ] Add error handling');
      tasks.push('- [ ] Write component tests');
    }

    // Feature-specific tasks
    if (feature.subtasks) {
      feature.subtasks.forEach((task) => {
        tasks.push(`- [ ] ${task}`);
      });
    }

    return tasks.join('\n');
  }

  private generateAcceptanceCriteria(feature: Feature): string {
    const criteria = [];

    if (feature.id === 'auth') {
      criteria.push('- [ ] Users can register with email/password');
      criteria.push('- [ ] Users can login and receive JWT token');
      criteria.push('- [ ] Protected routes require authentication');
      criteria.push('- [ ] Password reset functionality works');
    } else if (feature.id === 'crud') {
      criteria.push('- [ ] Create operation works with validation');
      criteria.push('- [ ] Read operations support filtering/pagination');
      criteria.push('- [ ] Update operation handles partial updates');
      criteria.push('- [ ] Delete operation has confirmation');
    } else {
      criteria.push(`- [ ] ${feature.name} is fully functional`);
      criteria.push('- [ ] All edge cases handled');
      criteria.push('- [ ] Performance meets requirements');
      criteria.push('- [ ] Accessible to all users');
    }

    return criteria.join('\n');
  }

  private generateValidationCommands(techStack: ProjectConfig['techStack'], stage: number): string {
    const commands = [];

    // Base commands for all stages
    commands.push('```bash');

    if (stage >= 1) {
      commands.push('# Run the application');
      commands.push('npm run dev');
      commands.push('');
      commands.push('# Run tests');
      commands.push('npm test');
      commands.push('');
      commands.push('# Check linting');
      commands.push('npm run lint');
    }

    if (stage >= 2) {
      commands.push('');
      commands.push('# Test coverage');
      commands.push('npm run test:coverage');
      commands.push('');
      commands.push('# Build check');
      commands.push('npm run build');
      commands.push('');
      commands.push('# Security audit');
      commands.push('npm audit');
    }

    if (stage >= 3) {
      commands.push('');
      commands.push('# Performance test');
      commands.push('npm run test:performance');
      commands.push('');
      commands.push('# E2E tests');
      commands.push('npm run test:e2e');
      commands.push('');
      commands.push('# Production build');
      commands.push('npm run build:prod');
    }

    commands.push('```');

    return commands.join('\n');
  }

  private generateStageValidationScript(stage: number): string {
    const commands = [];

    if (stage >= 1) {
      commands.push('npm run lint');
      commands.push('npm test');
    }

    if (stage >= 2) {
      commands.push('npm run test:coverage');
      commands.push('npm run build');
      commands.push('npm audit --audit-level=high');
    }

    if (stage >= 3) {
      commands.push('npm run test:e2e');
      commands.push('npm run build:prod');
      commands.push('npm run lighthouse');
    }

    return commands.join('\n    ');
  }
}

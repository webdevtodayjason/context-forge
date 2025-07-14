import { IDEAdapter, GeneratedFile } from './base';
import { Feature, ProjectConfig } from '../types';
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
    return true; // Windsurf now supports PRP through .windsurf/rules/
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

    // Generate PRP files if features are defined
    if (this.config.features && this.config.features.length > 0) {
      // PRP Overview
      files.push({
        path: path.join(outputPath, '.windsurf', 'rules', 'prp-overview.md'),
        content: this.generatePRPOverview(),
        description: 'PRP implementation overview',
      });

      // Stage-specific PRP files
      files.push({
        path: path.join(outputPath, '.windsurf', 'rules', 'prp-stage-1.md'),
        content: this.generatePRPStage1(),
        description: 'PRP Stage 1: Foundation',
      });

      files.push({
        path: path.join(outputPath, '.windsurf', 'rules', 'prp-stage-2.md'),
        content: this.generatePRPStage2(),
        description: 'PRP Stage 2: Core Features',
      });

      files.push({
        path: path.join(outputPath, '.windsurf', 'rules', 'prp-stage-3.md'),
        content: this.generatePRPStage3(),
        description: 'PRP Stage 3: Advanced Features',
      });

      // Validation gates
      files.push({
        path: path.join(outputPath, '.windsurf', 'rules', 'prp-validation.md'),
        content: this.generatePRPValidation(),
        description: 'PRP validation gates and commands',
      });
    }

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

  private generatePRPOverview(): string {
    const { projectName, features } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `# PRP Implementation Overview: ${projectName}

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages. This methodology helps Cascade AI understand your project's implementation phases and success criteria.

## Implementation Stages

### 📋 Stage 1: Foundation (see prp-stage-1.md)
- Project setup and configuration
- Core infrastructure
- Basic models and schemas
- Database setup

### 🚀 Stage 2: Core Features (see prp-stage-2.md)
${mustHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}

### ✨ Stage 3: Advanced Features (see prp-stage-3.md)
${shouldHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}
${
  niceToHaveFeatures.length > 0
    ? '\n**Nice-to-have features:**\n' +
      niceToHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')
    : ''
}

### ✅ Validation Gates (see prp-validation.md)
- Each stage has validation requirements
- Must pass before proceeding to next stage
- Automated testing and quality checks

## How to Use This PRP with Cascade AI

1. Start with **prp-stage-1.md**
2. Complete all tasks in the checklist
3. Run validation commands from **prp-validation.md**
4. Only proceed to next stage when validation passes
5. Use Cascade AI to help implement each task

### Cascade AI Commands for PRP

- \`cascade:generate "implement task from stage 1"\` - Generate implementation
- \`cascade:test "validate stage 1 completion"\` - Test implementation
- \`cascade:review "check stage 1 requirements"\` - Review progress

## Success Criteria

- All must-have features implemented and tested
- Code coverage meets requirements (>80%)
- All validation gates passed
- Documentation complete
- Security best practices followed

## Working with Cascade AI

Cascade AI will recognize these PRP files and use them to:
- Understand project phases
- Track implementation progress
- Suggest next steps
- Generate appropriate code for each stage
- Ensure quality gates are met
`;
  }

  private generatePRPStage1(): string {
    const { techStack } = this.config;

    return `# PRP Stage 1: Foundation

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

## Cascade AI Integration

### Use Cascade for:
1. **Project Initialization**
   \`\`\`
   cascade:generate "create project structure for ${techStack.frontend || techStack.backend}"
   \`\`\`

2. **Configuration Setup**
   \`\`\`
   cascade:generate "create development configuration"
   \`\`\`

3. **Testing Setup**
   \`\`\`
   cascade:generate "set up testing framework"
   \`\`\`

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

Once all validation passes, proceed to **prp-stage-2.md** for core feature implementation.
`;
  }

  private generatePRPStage2(): string {
    const { features, techStack } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');

    return `# PRP Stage 2: Core Features

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

#### Cascade AI Commands:
\`\`\`
cascade:generate "implement ${feature.name} feature"
cascade:test "create tests for ${feature.name}"
cascade:review "validate ${feature.name} implementation"
\`\`\`
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

## Cascade AI Workflows

### Feature Implementation Flow
1. **Describe the feature**
   \`\`\`
   cascade:generate "create ${mustHaveFeatures[0]?.name || 'feature'} with full functionality"
   \`\`\`

2. **Generate tests**
   \`\`\`
   cascade:test "comprehensive test suite for ${mustHaveFeatures[0]?.name || 'feature'}"
   \`\`\`

3. **Review and optimize**
   \`\`\`
   cascade:refactor "optimize ${mustHaveFeatures[0]?.name || 'feature'} for performance"
   \`\`\`

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

Once validation passes, proceed to **prp-stage-3.md** for advanced features.
`;
  }

  private generatePRPStage3(): string {
    const { features } = this.config;
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `# PRP Stage 3: Advanced Features & Polish

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

Cascade AI Commands:
\`\`\`
cascade:generate "implement ${feature.name}"
cascade:optimize "enhance ${feature.name} performance"
\`\`\`
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

## Cascade AI Optimization Workflows

### Performance Optimization
\`\`\`
cascade:analyze "identify performance bottlenecks"
cascade:optimize "implement caching and lazy loading"
cascade:test "benchmark performance improvements"
\`\`\`

### Security Hardening
\`\`\`
cascade:security "scan for vulnerabilities"
cascade:fix "apply security patches"
cascade:review "validate security measures"
\`\`\`

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

## Cascade AI Maintenance

Use Cascade AI for ongoing maintenance:
\`\`\`
cascade:monitor "track application health"
cascade:update "check for dependency updates"
cascade:improve "suggest feature enhancements"
\`\`\`
`;
  }

  private generatePRPValidation(): string {
    const { techStack } = this.config;

    return `# PRP Validation Gates

## Overview

Each stage must pass validation before proceeding. This ensures quality and prevents technical debt accumulation. Cascade AI can help run and validate these checks.

## Stage 1 Validation

### Commands to Run
${this.generateValidationCommands(techStack, 1)}

### Checklist
- [ ] Project runs without errors
- [ ] Basic tests pass
- [ ] Linting configured and passing
- [ ] Git repository initialized
- [ ] README.md created

### Cascade AI Validation
\`\`\`
cascade:validate "check stage 1 completion"
cascade:test "run all foundation tests"
cascade:review "verify project setup"
\`\`\`

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

### Cascade AI Validation
\`\`\`
cascade:test "comprehensive feature testing"
cascade:benchmark "performance validation"
cascade:security "vulnerability scan"
\`\`\`

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

### Cascade AI Final Check
\`\`\`
cascade:audit "production readiness check"
cascade:optimize "final performance tuning"
cascade:deploy "validate deployment configuration"
\`\`\`

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

## Windsurf Workflow Integration

Create a Windsurf workflow for validation:

\`\`\`yaml
name: PRP Validation
trigger: [pre_commit, manual]

steps:
  - name: Stage Validation
    command: ./validate.sh $CURRENT_STAGE
    
  - name: Cascade Review
    cascade: review "validate stage completion"
\`\`\`

## Troubleshooting

### Validation Failures
1. Check error messages carefully
2. Run individual commands to isolate issues
3. Check environment variables
4. Verify dependencies are installed
5. Review recent changes

### Getting Help
- Use Cascade AI: \`cascade:debug "validation failure"\`
- Check project documentation
- Review error logs
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

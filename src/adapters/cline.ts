import { IDEAdapter, GeneratedFile } from './base';
import { Feature } from '../types';
import path from 'path';

export class ClineAdapter extends IDEAdapter {
  get name(): string {
    return 'Cline';
  }

  get description(): string {
    return 'VS Code extension for AI pair programming (formerly Claude Dev)';
  }

  get configFiles(): string[] {
    return ['.clinerules', '.clinerules/'];
  }

  get supportsValidation(): boolean {
    return true;
  }

  get supportsPRP(): boolean {
    return true; // Cline now supports PRP through .clinerules/ directory
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate .clinerules/README.md (main rules file)
    files.push({
      path: path.join(outputPath, '.clinerules', 'README.md'),
      content: this.generateClineRules(),
      description: 'Main Cline configuration',
    });

    // Generate .clinerules/context.md
    files.push({
      path: path.join(outputPath, '.clinerules', 'context.md'),
      content: this.generateContextFile(),
      description: 'Project context for Cline',
    });

    // Generate .clinerules/rules.md
    files.push({
      path: path.join(outputPath, '.clinerules', 'rules.md'),
      content: this.generateRulesFile(),
      description: 'Development rules for Cline',
    });

    // Generate .clinerules/patterns.md
    files.push({
      path: path.join(outputPath, '.clinerules', 'patterns.md'),
      content: this.generatePatternsFile(),
      description: 'Code patterns and examples',
    });

    // Generate PRP files if features are defined
    if (this.config.features && this.config.features.length > 0) {
      // PRP Overview
      files.push({
        path: path.join(outputPath, '.clinerules', 'prp-overview.md'),
        content: this.generatePRPOverview(),
        description: 'PRP implementation overview',
      });

      // Stage-specific PRP files
      files.push({
        path: path.join(outputPath, '.clinerules', 'prp-stage-1.md'),
        content: this.generatePRPStage1(),
        description: 'PRP Stage 1: Foundation',
      });

      files.push({
        path: path.join(outputPath, '.clinerules', 'prp-stage-2.md'),
        content: this.generatePRPStage2(),
        description: 'PRP Stage 2: Core Features',
      });

      files.push({
        path: path.join(outputPath, '.clinerules', 'prp-stage-3.md'),
        content: this.generatePRPStage3(),
        description: 'PRP Stage 3: Advanced Features',
      });

      // Validation gates
      files.push({
        path: path.join(outputPath, '.clinerules', 'prp-validation.md'),
        content: this.generatePRPValidation(),
        description: 'PRP validation gates and commands',
      });
    }

    return files;
  }

  private generateClineRules(): string {
    return `# Cline Configuration

## Project: ${this.config.projectName}
${this.config.description}

## Context Files
- context.md: Project overview and architecture
- rules.md: Development guidelines and standards
- patterns.md: Code patterns and examples

## Cline Settings
\`\`\`json
{
  "autoApprove": false,
  "contextWindow": "full",
  "includeTests": true,
  "verboseMode": false,
  "preserveContext": true
}
\`\`\`

## Quick Reference
- Always check context.md for project understanding
- Follow rules.md for code standards
- Use patterns.md for implementation examples
- Review all AI suggestions before accepting
`;
  }

  private generateContextFile(): string {
    const { features } = this.config;

    return `# Context Management

${this.generateCommonContext()}

## Architecture Overview
${this.generateArchitectureOverview()}

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

## Development Workflow
1. Read task requirements carefully
2. Check existing code patterns
3. Implement following project conventions
4. Test thoroughly before marking complete
5. Update documentation as needed

## Important Files
- Configuration: ${this.getConfigFiles()}
- Entry Points: ${this.getEntryPoints()}
- Core Logic: ${this.getCoreFiles()}

## External Dependencies
${this.generateDependencyList()}
`;
  }

  private generateRulesFile(): string {
    const techStackRules = this.generateTechStackRules();
    const testingRequirements = this.generateTestingRequirements();
    const securityGuidelines = this.generateSecurityGuidelines();

    return `# Development Rules

## Code Standards

### General Rules
1. **File Size**: Max 500 lines per file
2. **Function Size**: Max 50 lines per function
3. **Complexity**: Keep cyclomatic complexity < 10
4. **Naming**: Use descriptive, self-documenting names

### Style Guide
${this.generateStyleGuide()}

${techStackRules}

## Project Structure
\`\`\`
${this.generateProjectStructure()}
\`\`\`

${testingRequirements}

${securityGuidelines}

## Git Workflow
- Use feature branches
- Write descriptive commit messages
- Squash commits before merging
- Keep PR size manageable

## Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
`;
  }

  private generatePatternsFile(): string {
    const { techStack } = this.config;
    const patterns = [];

    if (techStack.frontend === 'react' || techStack.frontend === 'nextjs') {
      patterns.push(this.generateReactPatterns());
    }

    if (techStack.backend === 'express') {
      patterns.push(this.generateExpressPatterns());
    }

    if (techStack.backend === 'fastapi') {
      patterns.push(this.generateFastAPIPatterns());
    }

    return `# Code Patterns

${patterns.join('\n\n')}

## Common Utilities

### Error Handling
\`\`\`${this.getLanguageForStack()}
${this.generateErrorHandlingPattern()}
\`\`\`

### Validation
\`\`\`${this.getLanguageForStack()}
${this.generateValidationPattern()}
\`\`\`

### Logging
\`\`\`${this.getLanguageForStack()}
${this.generateLoggingPattern()}
\`\`\`
`;
  }

  private generateArchitectureOverview(): string {
    const { techStack, projectType } = this.config;

    if (projectType === 'fullstack') {
      return `### Full-Stack Architecture
- **Frontend**: ${techStack.frontend || 'Not specified'}
- **Backend**: ${techStack.backend || 'Not specified'}
- **Database**: ${techStack.database || 'Not specified'}
- **Authentication**: ${techStack.auth || 'Not specified'}

### Communication
- REST API for client-server communication
- JSON for data exchange
- JWT for authentication tokens`;
    }

    if (projectType === 'api') {
      return `### API Architecture
- **Framework**: ${techStack.backend}
- **Database**: ${techStack.database}
- **API Style**: RESTful
- **Documentation**: OpenAPI/Swagger`;
    }

    return '### Architecture\nModular architecture with clear separation of concerns';
  }

  private generateFeatureNotes(feature: Feature): string {
    const notes = [];

    if (feature.complexity === 'complex') {
      notes.push('- Break down into smaller subtasks');
      notes.push('- Consider creating a design document first');
    }

    if (feature.priority === 'must-have') {
      notes.push('- Critical for MVP');
      notes.push('- Implement core functionality first');
    }

    if (feature.dependencies && feature.dependencies.length > 0) {
      notes.push(`- Dependencies: ${feature.dependencies.join(', ')}`);
    }

    return notes.length > 0 ? notes.join('\n') : '- Standard implementation approach';
  }

  private getConfigFiles(): string {
    const { techStack } = this.config;
    const files = [];

    if (techStack.frontend === 'nextjs') files.push('next.config.js');
    if (techStack.frontend === 'react') files.push('vite.config.js');
    if (techStack.backend === 'express') files.push('src/config/');
    if (techStack.backend === 'fastapi') files.push('app/core/config.py');

    return files.join(', ') || 'See project root';
  }

  private getEntryPoints(): string {
    const { techStack } = this.config;
    const files = [];

    if (techStack.frontend === 'nextjs') files.push('src/app/layout.tsx');
    if (techStack.frontend === 'react') files.push('src/main.tsx');
    if (techStack.backend === 'express') files.push('src/server.ts');
    if (techStack.backend === 'fastapi') files.push('app/main.py');

    return files.join(', ') || 'See main files';
  }

  private getCoreFiles(): string {
    const { techStack } = this.config;
    const files = [];

    if (techStack.frontend) files.push('components/', 'hooks/');
    if (techStack.backend) files.push('services/', 'models/');

    return files.join(', ') || 'src/';
  }

  private generateDependencyList(): string {
    const { techStack } = this.config;
    const deps = [];

    if (techStack.frontend === 'nextjs') {
      deps.push('- next: ^15.0.0');
      deps.push('- react: ^19.0.0');
      deps.push('- typescript: ^5.0.0');
    }

    if (techStack.backend === 'fastapi') {
      deps.push('- fastapi: ^0.100.0');
      deps.push('- pydantic: ^2.0.0');
      deps.push('- uvicorn: ^0.23.0');
    }

    return deps.length > 0 ? deps.join('\n') : '- See package.json or requirements.txt';
  }

  private generateStyleGuide(): string {
    const { techStack } = this.config;

    if (techStack.frontend === 'react' || techStack.frontend === 'nextjs') {
      return `- Use functional components
- Props interface for TypeScript
- Hooks for state management
- CSS Modules or Tailwind for styling`;
    }

    if (techStack.backend === 'express') {
      return `- Use TypeScript interfaces
- Async/await over callbacks
- Middleware for cross-cutting concerns
- Proper error handling`;
    }

    return '- Follow language-specific conventions';
  }

  private generateProjectStructure(): string {
    const { techStack, projectType } = this.config;

    if (projectType === 'fullstack' && techStack.frontend === 'nextjs') {
      return `app/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── public/
└── package.json

api/
├── src/
│   ├── routes/
│   ├── services/
│   └── models/
└── package.json`;
    }

    return `src/
├── components/
├── services/
├── utils/
└── tests/`;
  }

  private generateReactPatterns(): string {
    return `## React Patterns

### Custom Hook Pattern
\`\`\`typescript
export function useCustomHook() {
  const [state, setState] = useState(initialState);
  
  const updateState = useCallback((newValue) => {
    setState(newValue);
  }, []);
  
  return { state, updateState };
}
\`\`\`

### Component Pattern
\`\`\`typescript
interface Props {
  title: string;
  onAction: () => void;
}

export function Component({ title, onAction }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
\`\`\``;
  }

  private generateExpressPatterns(): string {
    return `## Express Patterns

### Route Handler Pattern
\`\`\`typescript
export const getResource = async (req: Request, res: Response) => {
  try {
    const result = await service.getResource(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
\`\`\`

### Middleware Pattern
\`\`\`typescript
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Verify token and attach user to request
  next();
};
\`\`\``;
  }

  private generateFastAPIPatterns(): string {
    return `## FastAPI Patterns

### Endpoint Pattern
\`\`\`python
@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
\`\`\`

### Dependency Pattern
\`\`\`python
async def get_db():
    async with SessionLocal() as session:
        yield session
\`\`\``;
  }

  private getLanguageForStack(): string {
    const { techStack } = this.config;

    if (techStack.backend === 'fastapi' || techStack.backend === 'django') {
      return 'python';
    }

    if (
      techStack.frontend === 'react' ||
      techStack.frontend === 'nextjs' ||
      techStack.backend === 'express'
    ) {
      return 'typescript';
    }

    return 'javascript';
  }

  private generateErrorHandlingPattern(): string {
    const lang = this.getLanguageForStack();

    if (lang === 'python') {
      return `class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)`;
    }

    return `export class APIError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'APIError';
  }
}`;
  }

  private generateValidationPattern(): string {
    const lang = this.getLanguageForStack();

    if (lang === 'python') {
      return `from pydantic import BaseModel, validator

class UserInput(BaseModel):
    email: str
    age: int
    
    @validator('email')
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v`;
    }

    return `export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};`;
  }

  private generateLoggingPattern(): string {
    const lang = this.getLanguageForStack();

    if (lang === 'python') {
      return `import logging

logger = logging.getLogger(__name__)

def log_operation(operation: str, details: dict):
    logger.info(f"{operation}: {details}")`;
    }

    return `export const logger = {
  info: (message: string, meta?: unknown) => console.log('[INFO]', message, meta),
  error: (message: string, error?: unknown) => console.error('[ERROR]', message, error),
  warn: (message: string, meta?: unknown) => console.warn('[WARN]', message, meta),
};`;
  }

  private generatePRPOverview(): string {
    const { projectName, features } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `# PRP Implementation Overview: ${projectName}

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages. This methodology helps Cline understand your project's implementation phases and success criteria.

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

## How to Use This PRP with Cline

1. Start with **prp-stage-1.md**
2. Complete all tasks in the checklist
3. Run validation commands from **prp-validation.md**
4. Only proceed to next stage when validation passes
5. Use Cline to help implement each task

### Working with Cline

When implementing PRP tasks:
- Reference the specific stage file for current work
- Use task checklists to track progress
- Ask Cline to validate completion of each task
- Review generated code before accepting

## Success Criteria

- All must-have features implemented and tested
- Code coverage meets requirements (>80%)
- All validation gates passed
- Documentation complete
- Security best practices followed

## Cline Configuration

These PRP files are automatically loaded by Cline from the \`.clinerules/\` directory. They provide:
- Clear implementation phases
- Specific task breakdowns
- Validation requirements
- Success criteria for each stage
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

## Cline Instructions

When working on Stage 1 tasks:
1. Always check existing project structure before creating new files
2. Follow the tech stack conventions specified in rules.md
3. Create comprehensive error handling from the start
4. Set up proper TypeScript configurations if applicable

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

#### Cline Implementation Notes:
- Reference patterns.md for code examples
- Follow the project structure from Stage 1
- Ensure all edge cases are handled
- Write tests alongside implementation
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

## Cline Workflow

For each feature:
1. Review the feature requirements and acceptance criteria
2. Check patterns.md for relevant code patterns
3. Implement following project conventions
4. Write tests to verify functionality
5. Update documentation as needed

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

Cline Notes:
- Consider performance implications
- Ensure backward compatibility
- Add feature flags if needed
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

## Cline Optimization Guidelines

When working on optimizations:
1. Profile before optimizing
2. Focus on measurable improvements
3. Document performance gains
4. Ensure no regressions in functionality
5. Update tests for new optimizations

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

    return `# PRP Validation Gates

## Overview

Each stage must pass validation before proceeding. This ensures quality and prevents technical debt accumulation. Cline will help verify these requirements.

## Stage 1 Validation

### Commands to Run
${this.generateValidationCommands(techStack, 1)}

### Checklist
- [ ] Project runs without errors
- [ ] Basic tests pass
- [ ] Linting configured and passing
- [ ] Git repository initialized
- [ ] README.md created

### Cline Verification
Ask Cline to:
1. Run all validation commands
2. Check for any console errors
3. Verify project structure matches requirements
4. Ensure all dependencies are properly installed

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

### Cline Testing Workflow
1. Run full test suite
2. Check coverage reports
3. Verify all features work end-to-end
4. Test error scenarios
5. Validate API responses

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

## Working with Cline

### Validation Assistance
Ask Cline to:
- Run validation scripts
- Interpret error messages
- Suggest fixes for failures
- Verify all requirements are met

### Troubleshooting
1. Check error messages carefully
2. Run individual commands to isolate issues
3. Check environment variables
4. Verify dependencies are installed
5. Review recent changes

### Getting Help
- Ask Cline for debugging assistance
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

  private generateFeatureTasks(feature: Feature, techStack: any): string {
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

  private generateValidationCommands(techStack: any, stage: number): string {
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

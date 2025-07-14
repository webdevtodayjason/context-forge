import { IDEAdapter, GeneratedFile } from './base';
import { Feature, ProjectConfig } from '../types';
import path from 'path';

export class CopilotAdapter extends IDEAdapter {
  get name(): string {
    return 'GitHub Copilot';
  }

  get description(): string {
    return 'AI pair programmer from GitHub';
  }

  get configFiles(): string[] {
    return ['.github/copilot-instructions.md', '.vscode/settings.json'];
  }

  get supportsValidation(): boolean {
    return false;
  }

  get supportsPRP(): boolean {
    return true; // Copilot now supports PRP through .github/prompts/ directory
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate .github/copilot-instructions.md
    files.push({
      path: path.join(outputPath, '.github', 'copilot-instructions.md'),
      content: this.generateCopilotInstructions(),
      description: 'Custom instructions for GitHub Copilot',
    });

    // Generate .vscode/settings.json with Copilot settings
    files.push({
      path: path.join(outputPath, '.vscode', 'settings.json'),
      content: this.generateVSCodeSettings(),
      description: 'VS Code settings for Copilot',
    });

    // Generate additional instruction files for different contexts
    files.push({
      path: path.join(outputPath, '.github', 'api.instructions.md'),
      content: this.generateAPIInstructions(),
      description: 'API-specific instructions',
    });

    files.push({
      path: path.join(outputPath, '.github', 'frontend.instructions.md'),
      content: this.generateFrontendInstructions(),
      description: 'Frontend-specific instructions',
    });

    // Generate PRP prompt files if features are defined
    if (this.config.features && this.config.features.length > 0) {
      // PRP Overview prompt
      files.push({
        path: path.join(outputPath, '.github', 'prompts', 'prp-overview.prompt.md'),
        content: this.generatePRPOverview(),
        description: 'PRP implementation overview prompt',
      });

      // Stage-specific PRP prompts
      files.push({
        path: path.join(outputPath, '.github', 'prompts', 'prp-stage-1.prompt.md'),
        content: this.generatePRPStage1(),
        description: 'PRP Stage 1: Foundation prompt',
      });

      files.push({
        path: path.join(outputPath, '.github', 'prompts', 'prp-stage-2.prompt.md'),
        content: this.generatePRPStage2(),
        description: 'PRP Stage 2: Core Features prompt',
      });

      files.push({
        path: path.join(outputPath, '.github', 'prompts', 'prp-stage-3.prompt.md'),
        content: this.generatePRPStage3(),
        description: 'PRP Stage 3: Advanced Features prompt',
      });

      // Validation prompt
      files.push({
        path: path.join(outputPath, '.github', 'prompts', 'prp-validation.prompt.md'),
        content: this.generatePRPValidation(),
        description: 'PRP validation gates prompt',
      });
    }

    return files;
  }

  private generateCopilotInstructions(): string {
    const { projectName, description, techStack, features } = this.config;
    const featureList = features || [];

    return `# GitHub Copilot Instructions for ${projectName}

${description}

## Project Overview

This is a ${this.config.projectType} project built with the following technologies:
${Object.entries(techStack)
  .filter(([_, value]) => value)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Code Standards

### Required Before Each Commit
- Run linting before committing any changes
- Ensure all tests pass
- Update documentation for new features
- No console.log statements in production code

### Code Structure
- Keep files under 500 lines
- Functions should be focused and single-purpose
- Use descriptive variable and function names
- Follow ${this.getLanguageConventions()} conventions

### Testing Requirements
- Write tests for all new features
- Maintain minimum ${this.getTestCoverage()}% code coverage
- Test edge cases and error scenarios
- Use ${this.getTestingFramework()} for testing

## Development Guidelines

${this.generateTechStackGuidelines()}

## Security Guidelines
- Never hardcode secrets or API keys
- Validate all user inputs
- Use environment variables for configuration
- Follow OWASP security best practices
- Implement proper error handling without exposing sensitive data

## Key Features to Implement

${featureList
  .map(
    (f) => `### ${f.name}
- Priority: ${f.priority}
- Complexity: ${f.complexity}
- ${f.description}
${f.subtasks ? `- Key tasks: ${f.subtasks.join(', ')}` : ''}`
  )
  .join('\n\n')}

## API Conventions
${this.generateAPIConventions()}

## Git Workflow
- Use feature branches for new development
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Squash commits before merging to main

## Performance Considerations
- Optimize database queries
- Implement caching where appropriate
- Use lazy loading for large datasets
- Monitor and optimize bundle sizes

## Documentation
- Update README.md for setup changes
- Document all API endpoints
- Include JSDoc/docstrings for public methods
- Keep architecture decisions documented

## Common Patterns
${this.generateCommonPatterns()}
`;
  }

  private generateVSCodeSettings(): string {
    return `{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true
  },
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "github.copilot.chat.localeOverride": "en",
  "github.copilot.editor.enableCodeActions": true,
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.inlineSuggest.enable": true,
  "github.copilot.voice.mode": "auto",
  
  // Language-specific settings
  ${this.generateLanguageSettings()}
  
  // Project-specific settings
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  
  // Test runner configuration
  ${this.generateTestRunnerSettings()}
}`;
  }

  private generateAPIInstructions(): string {
    const { techStack } = this.config;

    if (!techStack.backend) {
      return '# No backend API in this project';
    }

    return `# API Development Instructions

## Framework: ${techStack.backend}

### API Design Principles
- Follow RESTful conventions
- Use consistent naming patterns
- Implement proper error handling
- Version APIs appropriately

### Endpoint Patterns
${this.generateEndpointPatterns()}

### Authentication
${techStack.auth ? `- Use ${techStack.auth} for authentication` : '- Implement secure authentication'}
- Protect all sensitive endpoints
- Use middleware for auth checks
- Handle token expiration gracefully

### Request/Response Format
- Use JSON for all requests and responses
- Follow consistent schema patterns
- Include appropriate status codes
- Provide meaningful error messages

### Database Operations
${techStack.database ? `- Using ${techStack.database} for data persistence` : '- Implement efficient database queries'}
- Use parameterized queries
- Implement connection pooling
- Handle transactions properly
- Add appropriate indexes

### Error Handling
\`\`\`${this.getBackendLanguage()}
${this.generateErrorHandlingPattern()}
\`\`\`

### Testing
- Test all endpoints
- Include integration tests
- Mock external dependencies
- Test error scenarios
`;
  }

  private generateFrontendInstructions(): string {
    const { techStack } = this.config;

    if (!techStack.frontend) {
      return '# No frontend in this project';
    }

    return `# Frontend Development Instructions

## Framework: ${techStack.frontend}

### Component Guidelines
- Create reusable components
- Use TypeScript for type safety
- Follow ${techStack.frontend} best practices
- Implement proper prop validation

### State Management
${this.generateStateManagementGuidelines()}

### Styling
${techStack.styling ? `- Using ${techStack.styling} for styling` : '- Use CSS modules or styled-components'}
- Follow mobile-first approach
- Ensure accessibility (WCAG 2.1)
- Use semantic HTML

### Performance
- Implement code splitting
- Optimize images and assets
- Use lazy loading where appropriate
- Monitor bundle size

### Component Pattern
\`\`\`${this.getFrontendLanguage()}
${this.generateComponentPattern()}
\`\`\`

### API Integration
- Use async/await for API calls
- Implement proper error handling
- Show loading states
- Cache responses when appropriate

### Testing
- Write unit tests for components
- Test user interactions
- Include accessibility tests
- Use ${this.getFrontendTestingFramework()}
`;
  }

  private getLanguageConventions(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'fastapi' || techStack.backend === 'django') return 'PEP 8';
    if (techStack.backend === 'express' || techStack.frontend) return 'ESLint/Prettier';
    if (techStack.backend === 'spring') return 'Java';
    if (techStack.backend === 'rails') return 'Ruby';
    return 'language-specific';
  }

  private getTestCoverage(): number {
    return this.config.techStack.frontend === 'nextjs' ? 85 : 80;
  }

  private getTestingFramework(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'fastapi' || techStack.backend === 'django') return 'pytest';
    if (techStack.frontend === 'react' || techStack.frontend === 'nextjs') return 'Jest';
    if (techStack.backend === 'express') return 'Jest/Mocha';
    return 'appropriate testing framework';
  }

  private generateTechStackGuidelines(): string {
    const guidelines = [];
    const { techStack } = this.config;

    if (techStack.frontend === 'nextjs') {
      guidelines.push('### Next.js Guidelines');
      guidelines.push('- Use App Router for new features');
      guidelines.push('- Implement Server Components where possible');
      guidelines.push('- Follow file-based routing conventions');
      guidelines.push('- Optimize with next/image and next/font');
    }

    if (techStack.frontend === 'react') {
      guidelines.push('### React Guidelines');
      guidelines.push('- Use functional components with hooks');
      guidelines.push('- Implement proper error boundaries');
      guidelines.push('- Follow React best practices');
      guidelines.push('- Use React.memo for optimization');
    }

    if (techStack.backend === 'fastapi') {
      guidelines.push('### FastAPI Guidelines');
      guidelines.push('- Use async/await for all endpoints');
      guidelines.push('- Implement Pydantic models for validation');
      guidelines.push('- Follow Python type hints');
      guidelines.push('- Use dependency injection');
    }

    if (techStack.backend === 'express') {
      guidelines.push('### Express Guidelines');
      guidelines.push('- Use TypeScript for type safety');
      guidelines.push('- Implement proper middleware');
      guidelines.push('- Follow RESTful conventions');
      guidelines.push('- Use async error handling');
    }

    return guidelines.join('\n');
  }

  private generateAPIConventions(): string {
    const { techStack } = this.config;

    if (techStack.backend === 'fastapi') {
      return `- Use path parameters for resource IDs: \`/users/{user_id}\`
- Use query parameters for filtering: \`/users?status=active\`
- Return Pydantic models for consistency
- Use HTTP status codes correctly`;
    }

    if (techStack.backend === 'express') {
      return `- Use path parameters for resource IDs: \`/users/:userId\`
- Use query parameters for filtering: \`/users?status=active\`
- Return consistent JSON responses
- Use appropriate HTTP status codes`;
    }

    return `- Follow RESTful conventions
- Use consistent URL patterns
- Return structured responses
- Handle errors gracefully`;
  }

  private generateCommonPatterns(): string {
    const patterns = [];

    patterns.push('### Error Response Format');
    patterns.push('```json');
    patterns.push('{');
    patterns.push('  "error": {');
    patterns.push('    "code": "ERROR_CODE",');
    patterns.push('    "message": "Human-readable error message",');
    patterns.push('    "details": {}');
    patterns.push('  }');
    patterns.push('}');
    patterns.push('```');

    patterns.push('\n### Success Response Format');
    patterns.push('```json');
    patterns.push('{');
    patterns.push('  "data": {},');
    patterns.push('  "meta": {');
    patterns.push('    "page": 1,');
    patterns.push('    "total": 100');
    patterns.push('  }');
    patterns.push('}');
    patterns.push('```');

    return patterns.join('\n');
  }

  private generateLanguageSettings(): string {
    const { techStack } = this.config;
    const settings = [];

    if (techStack.backend === 'fastapi' || techStack.backend === 'django') {
      settings.push('"python.linting.enabled": true,');
      settings.push('"python.linting.pylintEnabled": true,');
      settings.push('"python.formatting.provider": "black",');
    }

    if (techStack.frontend || techStack.backend === 'express') {
      settings.push('"typescript.preferences.importModuleSpecifier": "relative",');
      settings.push('"javascript.preferences.quoteStyle": "single",');
      settings.push('"typescript.preferences.quoteStyle": "single",');
    }

    return settings.join('\n  ');
  }

  private generateTestRunnerSettings(): string {
    const { techStack } = this.config;

    if (
      techStack.frontend === 'react' ||
      techStack.frontend === 'nextjs' ||
      techStack.backend === 'express'
    ) {
      return `"jest.autoRun": {
    "watch": false,
    "onSave": "test-only"
  },
  "jest.showCoverageOnLoad": true`;
    }

    if (techStack.backend === 'fastapi' || techStack.backend === 'django') {
      return `"python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "python.testing.autoTestDiscoverOnSaveEnabled": true`;
    }

    return '"testing.automaticallyOpenPeekView": "never"';
  }

  private generateEndpointPatterns(): string {
    const { techStack } = this.config;

    if (techStack.backend === 'fastapi') {
      return `
\`\`\`python
# GET /api/v1/resources
@router.get("/resources", response_model=List[ResourceSchema])
async def get_resources(
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    db: Session = Depends(get_db)
):
    return await crud.get_resources(db, skip=skip, limit=limit)

# POST /api/v1/resources
@router.post("/resources", response_model=ResourceSchema)
async def create_resource(
    resource: ResourceCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.create_resource(db, resource, current_user.id)
\`\`\``;
    }

    if (techStack.backend === 'express') {
      return `
\`\`\`typescript
// GET /api/v1/resources
router.get('/resources', async (req: Request, res: Response) => {
  try {
    const { skip = 0, limit = 100 } = req.query;
    const resources = await resourceService.getResources({ skip, limit });
    res.json({ data: resources });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/resources
router.post('/resources', authenticate, async (req: Request, res: Response) => {
  try {
    const resource = await resourceService.createResource(req.body, req.user.id);
    res.status(201).json({ data: resource });
  } catch (error) {
    next(error);
  }
});
\`\`\``;
    }

    return '// Follow framework-specific patterns';
  }

  private getBackendLanguage(): string {
    const { techStack } = this.config;
    if (techStack.backend === 'fastapi' || techStack.backend === 'django') return 'python';
    if (techStack.backend === 'express') return 'typescript';
    if (techStack.backend === 'spring') return 'java';
    if (techStack.backend === 'rails') return 'ruby';
    return 'javascript';
  }

  private getFrontendLanguage(): string {
    const { techStack } = this.config;
    if (techStack.frontend) return 'typescript';
    return 'javascript';
  }

  private generateErrorHandlingPattern(): string {
    const lang = this.getBackendLanguage();

    if (lang === 'python') {
      return `class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)

# Usage
raise APIError("Resource not found", 404, "RESOURCE_NOT_FOUND")`;
    }

    return `export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Usage
throw new APIError('Resource not found', 404, 'RESOURCE_NOT_FOUND');`;
  }

  private generateStateManagementGuidelines(): string {
    const { techStack } = this.config;

    if (techStack.frontend === 'nextjs') {
      return `- Use React Context for global state
- Leverage Server Components for data fetching
- Use URL state for shareable UI state
- Consider Zustand for complex client state`;
    }

    if (techStack.frontend === 'react') {
      return `- Use React Context for simple global state
- Consider Redux Toolkit for complex state
- Use React Query for server state
- Keep component state local when possible`;
    }

    if (techStack.frontend === 'vue') {
      return `- Use Pinia for state management
- Keep state modular
- Use composables for shared logic
- Leverage Vue reactivity`;
    }

    return '- Use appropriate state management solution';
  }

  private generateComponentPattern(): string {
    const { techStack } = this.config;

    if (techStack.frontend === 'react' || techStack.frontend === 'nextjs') {
      return `interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductCard({ product, onAddToCart, isLoading = false }: ProductCardProps) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="price">\${product.price}</p>
      <button 
        onClick={() => onAddToCart(product)}
        disabled={isLoading}
      >
        {isLoading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}`;
    }

    if (techStack.frontend === 'vue') {
      return `<template>
  <div class="product-card">
    <img :src="product.image" :alt="product.name" />
    <h3>{{ product.name }}</h3>
    <p>{{ product.description }}</p>
    <p class="price">\${{ product.price }}</p>
    <button @click="$emit('add-to-cart', product)" :disabled="isLoading">
      {{ isLoading ? 'Adding...' : 'Add to Cart' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  product: Product;
  isLoading?: boolean;
}

defineProps<Props>();
defineEmits<{
  'add-to-cart': [product: Product];
}>();
</script>`;
    }

    return '// Component implementation';
  }

  private getFrontendTestingFramework(): string {
    const { techStack } = this.config;
    if (techStack.frontend === 'react' || techStack.frontend === 'nextjs') {
      return 'React Testing Library';
    }
    if (techStack.frontend === 'vue') {
      return 'Vue Test Utils';
    }
    if (techStack.frontend === 'angular') {
      return 'Jasmine/Karma';
    }
    return 'appropriate testing framework';
  }

  private generatePRPOverview(): string {
    const { projectName, features } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `# PRP Implementation Overview: ${projectName}

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages. This methodology helps GitHub Copilot understand your project's implementation phases and success criteria.

## How to Use PRP Prompts with Copilot

These prompt files are designed to be used as slash commands in VS Code:
- Type \`/prp-overview\` to get this overview
- Type \`/prp-stage-1\` to start foundation setup
- Type \`/prp-stage-2\` for core features implementation
- Type \`/prp-stage-3\` for advanced features
- Type \`/prp-validation\` to check validation gates

## Implementation Stages

### 📋 Stage 1: Foundation (/prp-stage-1)
- Project setup and configuration
- Core infrastructure
- Basic models and schemas
- Database setup

### 🚀 Stage 2: Core Features (/prp-stage-2)
${mustHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}

### ✨ Stage 3: Advanced Features (/prp-stage-3)
${shouldHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}
${
  niceToHaveFeatures.length > 0
    ? '\n**Nice-to-have features:**\n' +
      niceToHaveFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')
    : ''
}

### ✅ Validation Gates (/prp-validation)
- Each stage has validation requirements
- Must pass before proceeding to next stage
- Automated testing and quality checks

## Working with Copilot

When implementing PRP tasks:
1. Use the slash commands to access specific stages
2. Ask Copilot to help implement tasks from the checklist
3. Use inline chat for code generation and refinement
4. Review all generated code before accepting

## Success Criteria

- All must-have features implemented and tested
- Code coverage meets requirements (>80%)
- All validation gates passed
- Documentation complete
- Security best practices followed

## Tips for Using PRP with Copilot

- Reference the current stage in your prompts
- Ask Copilot to validate your implementation
- Use the validation prompt to check progress
- Keep custom instructions updated as you progress
`;
  }

  private generatePRPStage1(): string {
    const { techStack } = this.config;

    return `# PRP Stage 1: Foundation

## Objective
Set up the project foundation with proper structure, configuration, and core infrastructure.

## How to Use This Prompt
Use \`/prp-stage-1\` to access this stage's tasks and implementation guidance.

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

## Copilot Assistance

Ask Copilot to help with:
- "Set up ${techStack.frontend || techStack.backend} project structure"
- "Create database connection for ${techStack.database}"
- "Configure testing framework"
- "Set up environment variables"

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

## Success Criteria

- [ ] Development environment is fully functional
- [ ] All developers can run the project locally
- [ ] Basic CI/CD pipeline is configured
- [ ] Project structure follows best practices
- [ ] Documentation is started (README.md)

## Common Gotchas

${this.generateStage1Gotchas()}

## Next Steps

Once all validation passes, use \`/prp-stage-2\` for core feature implementation.
`;
  }

  private generatePRPStage2(): string {
    const { features, techStack } = this.config;
    const mustHaveFeatures = features.filter((f) => f.priority === 'must-have');

    return `# PRP Stage 2: Core Features

## Objective
Implement all must-have features with proper testing and documentation.

## How to Use This Prompt
Use \`/prp-stage-2\` to implement core features with Copilot's assistance.

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

#### Copilot Implementation:
Ask Copilot to:
- "Create ${feature.name} with ${feature.description}"
- "Add tests for ${feature.name}"
- "Implement validation for ${feature.name}"
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

## Copilot Workflow

For each feature:
1. Ask Copilot to generate the initial implementation
2. Review and refine the generated code
3. Ask for test generation
4. Use inline chat for improvements
5. Request documentation updates

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

Once validation passes, use \`/prp-stage-3\` for advanced features.
`;
  }

  private generatePRPStage3(): string {
    const { features } = this.config;
    const shouldHaveFeatures = features.filter((f) => f.priority === 'should-have');
    const niceToHaveFeatures = features.filter((f) => f.priority === 'nice-to-have');

    return `# PRP Stage 3: Advanced Features & Polish

## Objective
Implement should-have features and optimize the application for production.

## How to Use This Prompt
Use \`/prp-stage-3\` to implement advanced features and optimizations.

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

Copilot Assistance:
- Ask: "Implement ${feature.name} feature"
- Ask: "Add performance optimizations for ${feature.name}"
- Ask: "Create tests for ${feature.name}"
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

## Copilot Optimization Assistance

Ask Copilot to help with:
- "Optimize database queries for performance"
- "Add caching layer to API endpoints"
- "Implement accessibility improvements"
- "Add performance monitoring"
- "Create production deployment configuration"

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

Your project is now ready for production. Use Copilot to:
- Monitor performance metrics
- Implement user feedback
- Plan iterative improvements
- Keep dependencies updated
`;
  }

  private generatePRPValidation(): string {
    const { techStack } = this.config;

    return `# PRP Validation Gates

## Overview

Each stage must pass validation before proceeding. This prompt helps you verify requirements with Copilot's assistance.

## How to Use This Prompt
Use \`/prp-validation\` to check your progress and validate each stage.

## Stage 1 Validation

### Commands to Run
${this.generateValidationCommands(techStack, 1)}

### Checklist
- [ ] Project runs without errors
- [ ] Basic tests pass
- [ ] Linting configured and passing
- [ ] Git repository initialized
- [ ] README.md created

### Copilot Verification
Ask Copilot to:
- "Check if all Stage 1 requirements are met"
- "Verify project structure is correct"
- "Validate environment setup"
- "Review configuration files"

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

### Copilot Testing Assistance
Ask Copilot to:
- "Generate comprehensive tests for all features"
- "Check test coverage and suggest improvements"
- "Validate API endpoints"
- "Review security implementation"

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

Ask Copilot to create a validation script:

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
Ask Copilot to set up pre-commit hooks:
- "Create pre-commit hook for linting"
- "Add test runner to pre-push hook"
- "Set up commit message validation"

### CI/CD Integration
Ask Copilot to create CI workflows:
- "Create GitHub Actions workflow for validation"
- "Add automated testing to CI pipeline"
- "Set up deployment automation"

## Troubleshooting with Copilot

When validation fails:
1. Copy the error message
2. Ask Copilot: "How to fix [error message]"
3. Use inline chat for quick fixes
4. Request step-by-step debugging help

## Getting Help

Use Copilot to:
- Debug validation failures
- Interpret error messages
- Suggest fixes for common issues
- Review configuration problems
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

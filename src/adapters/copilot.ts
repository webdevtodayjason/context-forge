import { IDEAdapter, GeneratedFile } from './base';
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
    return false;
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
}

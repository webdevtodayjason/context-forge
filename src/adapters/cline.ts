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
    return false;
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate .clinerules (main rules file)
    files.push({
      path: path.join(outputPath, '.clinerules'),
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
}

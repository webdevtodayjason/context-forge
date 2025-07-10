# GitHub Copilot Configuration

GitHub Copilot is an AI pair programmer that helps you write code faster and with less work. Context Forge generates custom instructions and settings to optimize Copilot for your specific project.

## Generated File Structure

```
project-root/
├── .github/
│   ├── copilot-instructions.md    # Custom instructions for Copilot
│   ├── api.instructions.md         # API-specific instructions
│   └── frontend.instructions.md    # Frontend-specific instructions
└── .vscode/
    └── settings.json              # VS Code settings with Copilot config
```

## Example: .github/copilot-instructions.md

```markdown
# GitHub Copilot Instructions for E-Commerce Platform

A modern e-commerce platform with AI-powered product recommendations

## Project Overview

This is a fullstack project built with the following technologies:
- **frontend**: nextjs (App Router, Server Components)
- **backend**: fastapi (Async API with type hints)
- **database**: postgresql (Relational database)
- **auth**: jwt (JSON Web Tokens)

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
- Follow ESLint/Prettier conventions

### Testing Requirements
- Write tests for all new features
- Maintain minimum 85% code coverage
- Test edge cases and error scenarios
- Use Jest for testing

## Development Guidelines

### Next.js Guidelines
- Use App Router for new features
- Implement Server Components where possible
- Follow file-based routing conventions
- Optimize with next/image and next/font

### FastAPI Guidelines
- Use async/await for all endpoints
- Implement Pydantic models for validation
- Follow Python type hints
- Use dependency injection

## Security Guidelines
- Never hardcode secrets or API keys
- Validate all user inputs
- Use environment variables for configuration
- Follow OWASP security best practices
- Implement proper error handling without exposing sensitive data

## Key Features to Implement

### User Authentication
- Priority: must-have
- Complexity: medium
- Secure JWT-based authentication with social login integration
- Key tasks: registration, login, password reset, social auth

### Product Catalog
- Priority: must-have
- Complexity: complex
- Dynamic product listings with advanced search and filtering
- Key tasks: CRUD operations, search, filtering, pagination

### Shopping Cart
- Priority: must-have
- Complexity: medium
- Persistent cart storage with real-time updates
- Key tasks: add/remove items, quantity updates, price calculations

### AI Product Recommendations
- Priority: should-have
- Complexity: complex
- ML-powered personalized product suggestions
- Key tasks: user behavior tracking, ML model integration, recommendation API

## API Conventions
- Use path parameters for resource IDs: `/users/{user_id}`
- Use query parameters for filtering: `/users?status=active`
- Return Pydantic models for consistency
- Use HTTP status codes correctly

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

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Success Response Format
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "total": 100
  }
}
```
```

## Example: .vscode/settings.json

```json
{
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
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.quoteStyle": "single",
  "typescript.preferences.quoteStyle": "single",
  
  // Project-specific settings
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  
  // Test runner configuration
  "jest.autoRun": {
    "watch": false,
    "onSave": "test-only"
  },
  "jest.showCoverageOnLoad": true
}
```

## Example: .github/api.instructions.md

```markdown
# API Development Instructions

## Framework: fastapi

### API Design Principles
- Follow RESTful conventions
- Use consistent naming patterns
- Implement proper error handling
- Version APIs appropriately

### Endpoint Patterns

```python
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
```

### Authentication
- Use jwt for authentication
- Protect all sensitive endpoints
- Use middleware for auth checks
- Handle token expiration gracefully

### Request/Response Format
- Use JSON for all requests and responses
- Follow consistent schema patterns
- Include appropriate status codes
- Provide meaningful error messages

### Database Operations
- Using postgresql for data persistence
- Use parameterized queries
- Implement connection pooling
- Handle transactions properly
- Add appropriate indexes

### Error Handling
```python
class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)

# Usage
raise APIError("Resource not found", 404, "RESOURCE_NOT_FOUND")
```

### Testing
- Test all endpoints
- Include integration tests
- Mock external dependencies
- Test error scenarios
```

## Example: .github/frontend.instructions.md

```markdown
# Frontend Development Instructions

## Framework: nextjs

### Component Guidelines
- Create reusable components
- Use TypeScript for type safety
- Follow nextjs best practices
- Implement proper prop validation

### State Management
- Use React Context for global state
- Leverage Server Components for data fetching
- Use URL state for shareable UI state
- Consider Zustand for complex client state

### Styling
- Use CSS modules or styled-components
- Follow mobile-first approach
- Ensure accessibility (WCAG 2.1)
- Use semantic HTML

### Performance
- Implement code splitting
- Optimize images and assets
- Use lazy loading where appropriate
- Monitor bundle size

### Component Pattern
```typescript
interface ProductCardProps {
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
      <p className="price">${product.price}</p>
      <button 
        onClick={() => onAddToCart(product)}
        disabled={isLoading}
      >
        {isLoading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

### API Integration
- Use async/await for API calls
- Implement proper error handling
- Show loading states
- Cache responses when appropriate

### Testing
- Write unit tests for components
- Test user interactions
- Include accessibility tests
- Use React Testing Library
```

## Usage with GitHub Copilot

1. Generate the configuration:
   ```bash
   context-forge init --ide copilot
   ```

2. Open project in VS Code with Copilot enabled

3. Copilot will automatically:
   - Read instruction files from `.github/`
   - Apply VS Code settings
   - Use project context for suggestions

4. Using custom instructions:
   - Copilot Chat will reference instruction files
   - Inline suggestions follow project patterns
   - Code generation matches your standards

## Best Practices

1. **Instruction Files**: Keep them updated as project evolves
2. **Specific Context**: Add domain-specific instructions
3. **Code Patterns**: Document common patterns for consistency
4. **Review Suggestions**: Always review Copilot's code

## Copilot-Specific Features

### Inline Suggestions
- Tab to accept suggestions
- Alt+] for next suggestion
- Alt+[ for previous suggestion
- Esc to dismiss

### Copilot Chat
```
# Use custom instructions
/doc - Generate documentation
/explain - Explain selected code
/fix - Fix problems in code
/tests - Generate unit tests
```

### Voice Commands
- Enable voice mode in settings
- Use natural language commands
- "Write a function to..."
- "Explain this code"

### Context Awareness
Copilot uses:
- Open files in editor
- Recent edits
- Instruction files
- Project structure

## Advanced Configuration

### Per-Language Instructions
Create language-specific files:
- `.github/typescript.instructions.md`
- `.github/python.instructions.md`
- `.github/css.instructions.md`

### Team Standards
Share instruction files via:
- Git repository
- Team settings sync
- Organization templates

### CI/CD Integration
```yaml
# Validate code follows instructions
- name: Check Code Standards
  run: |
    # Custom script to validate against instructions
    npx copilot-validator .github/copilot-instructions.md
```
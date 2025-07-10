# Cline Configuration

Cline (formerly Claude Dev) is a VS Code extension for AI pair programming with advanced context management capabilities.

## Generated File Structure

```
project-root/
├── .clinerules               # Main configuration file
└── .clinerules/
    ├── context.md           # Project context and architecture
    ├── rules.md             # Development rules and standards
    └── patterns.md          # Code patterns and examples
```

## Example: .clinerules

```markdown
# Cline Configuration

## Project: E-Commerce Platform
A modern e-commerce platform with AI-powered recommendations

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
```

## Example: .clinerules/context.md

```markdown
# Context Management

## Project: E-Commerce Platform

A modern e-commerce platform with real-time inventory management and AI-powered product recommendations.

## Tech Stack
- **frontend**: nextjs
- **backend**: fastapi
- **database**: postgresql
- **auth**: jwt

## Key Features
- User Authentication: JWT-based auth with social login
- Product Catalog: Dynamic listings with advanced search
- Shopping Cart: Persistent storage with real-time updates
- AI Recommendations: Personalized product suggestions

## Development Info
- Timeline: standard
- Team Size: small

## Architecture Overview
### Full-Stack Architecture
- **Frontend**: Next.js 15 with App Router
- **Backend**: FastAPI with async endpoints
- **Database**: PostgreSQL with Redis cache
- **Authentication**: JWT tokens

### Communication
- REST API for client-server communication
- JSON for data exchange
- JWT for authentication tokens

## Key Features

### User Authentication
**Priority**: must-have  
**Complexity**: medium  
**Description**: Secure authentication with JWT tokens and social login

**Implementation Notes**:
- Use NextAuth.js for frontend
- FastAPI JWT backend
- Social providers: Google, GitHub

### Product Catalog
**Priority**: must-have  
**Complexity**: complex  
**Description**: Dynamic product listings with search and filtering

**Implementation Notes**:
- Break down into smaller subtasks
- Consider creating a design document first
- Implement search with Elasticsearch

### Shopping Cart
**Priority**: must-have  
**Complexity**: medium  
**Description**: Persistent cart with real-time updates

**Implementation Notes**:
- Use Redis for cart storage
- WebSocket for real-time updates
- Handle race conditions

## Development Workflow
1. Read task requirements carefully
2. Check existing code patterns
3. Implement following project conventions
4. Test thoroughly before marking complete
5. Update documentation as needed

## Important Files
- Configuration: next.config.js, app/core/config.py
- Entry Points: src/app/layout.tsx, app/main.py
- Core Logic: components/, services/

## External Dependencies
- next: ^15.0.0
- react: ^19.0.0
- typescript: ^5.0.0
- fastapi: ^0.100.0
- pydantic: ^2.0.0
- uvicorn: ^0.23.0
```

## Example: .clinerules/rules.md

```markdown
# Development Rules

## Code Standards

### General Rules
1. **File Size**: Max 500 lines per file
2. **Function Size**: Max 50 lines per function
3. **Complexity**: Keep cyclomatic complexity < 10
4. **Naming**: Use descriptive, self-documenting names

### Style Guide
- Use functional components
- Props interface for TypeScript
- Hooks for state management
- CSS Modules or Tailwind for styling

## Tech Stack Rules
- Use Next.js 15 App Router patterns
- Implement React Server Components where appropriate
- Follow file-based routing conventions
- Use async/await for all endpoints
- Implement Pydantic v2 models

## Project Structure
\`\`\`
app/
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
└── package.json
\`\`\`

## Testing Requirements
- Minimum 80% code coverage
- Write tests for all new features
- Test user behavior, not implementation details
- Include both unit and integration tests

## Security Guidelines
- Validate all user inputs
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Follow OWASP security best practices
- Never commit secrets to version control

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
```

## Example: .clinerules/patterns.md

```markdown
# Code Patterns

## React Patterns

### Custom Hook Pattern
\`\`\`typescript
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const addItem = useCallback((product: Product) => {
    setItems(prev => [...prev, { ...product, quantity: 1 }]);
  }, []);
  
  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  }, []);
  
  return { items, addItem, removeItem };
}
\`\`\`

### Component Pattern
\`\`\`typescript
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>\${product.price}</p>
      <button onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}
\`\`\`

## FastAPI Patterns

### Endpoint Pattern
\`\`\`python
@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = await crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
\`\`\`

### Dependency Pattern
\`\`\`python
async def get_db():
    async with SessionLocal() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )
    # Token validation logic
    return user
\`\`\`

## Common Utilities

### Error Handling
\`\`\`typescript
export class APIError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'APIError';
  }
}
\`\`\`

### Validation
\`\`\`python
from pydantic import BaseModel, validator

class ProductInput(BaseModel):
    name: str
    price: float
    category: str
    
    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v
\`\`\`

### Logging
\`\`\`typescript
export const logger = {
  info: (message: string, meta?: unknown) => console.log('[INFO]', message, meta),
  error: (message: string, error?: unknown) => console.error('[ERROR]', message, error),
  warn: (message: string, meta?: unknown) => console.warn('[WARN]', message, meta),
};
\`\`\`
```

## Usage with Cline

1. Generate the configuration:
   ```bash
   context-forge init --ide cline
   ```

2. Install Cline extension in VS Code

3. Open your project - Cline will use:
   - `.clinerules` for main configuration
   - `context.md` for project understanding
   - `rules.md` for coding standards
   - `patterns.md` for examples

4. Use Cline commands:
   - Open Cline chat panel
   - Reference context files
   - Get AI assistance with full context

## Best Practices

1. **Context First**: Keep context.md comprehensive and updated
2. **Clear Rules**: Make rules.md specific and actionable
3. **Real Patterns**: Include actual code patterns from your project
4. **Regular Updates**: Update files as project evolves

## Cline-Specific Features

### Context Management
- Maintains conversation history
- References project files automatically
- Understands file relationships

### Advanced Commands
- `/explain` - Explain code with context
- `/refactor` - Suggest improvements
- `/test` - Generate tests
- `/fix` - Debug issues

### Settings
```json
{
  "cline.autoApprove": false,      // Require approval for changes
  "cline.contextWindow": "full",   // Use maximum context
  "cline.includeTests": true,      // Consider test files
  "cline.preserveContext": true    // Remember conversation context
}
```
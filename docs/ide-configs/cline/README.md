# Cline Configuration

Cline (formerly Claude Dev) is a VS Code extension for AI pair programming with advanced context management capabilities. Context Forge now generates PRP (Product Requirement Prompt) support for Cline, providing structured implementation guidance.

## Generated File Structure

```
project-root/
└── .clinerules/              # Configuration directory
    ├── README.md            # Main configuration overview
    ├── context.md           # Project context and architecture
    ├── rules.md             # Development rules and standards
    ├── patterns.md          # Code patterns and examples
    └── PRP files (if features defined):
        ├── prp-overview.md  # PRP implementation overview
        ├── prp-stage-1.md   # Foundation setup
        ├── prp-stage-2.md   # Core features
        ├── prp-stage-3.md   # Advanced features
        └── prp-validation.md # Validation gates
```

## Example: .clinerules/README.md

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

## Example: PRP Files

### prp-overview.md
```markdown
# PRP Implementation Overview: E-Commerce Platform

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages. This methodology helps Cline understand your project's implementation phases and success criteria.

## Implementation Stages

### 📋 Stage 1: Foundation (see prp-stage-1.md)
- Project setup and configuration
- Core infrastructure
- Basic models and schemas
- Database setup

### 🚀 Stage 2: Core Features (see prp-stage-2.md)
- User Authentication: JWT-based auth with social login
- Product Catalog: Dynamic listings with advanced search
- Shopping Cart: Persistent storage with real-time updates

### ✨ Stage 3: Advanced Features (see prp-stage-3.md)
- AI Recommendations: Personalized product suggestions
- Order Management: Complete order lifecycle
- Analytics Dashboard: Business intelligence features

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

These PRP files are automatically loaded by Cline from the `.clinerules/` directory. They provide:
- Clear implementation phases
- Specific task breakdowns
- Validation requirements
- Success criteria for each stage
```

### prp-stage-2.md
```markdown
# PRP Stage 2: Core Features

## Objective
Implement all must-have features with proper testing and documentation.

## Features to Implement

### User Authentication
**Description**: JWT-based authentication with social login
**Complexity**: medium

#### Tasks:
- [ ] Create data models/schemas
- [ ] Implement business logic
- [ ] Create API endpoints
- [ ] Add validation
- [ ] Write unit tests
- [ ] Create UI components
- [ ] Implement state management
- [ ] Connect to API
- [ ] Add error handling
- [ ] Write component tests

#### Acceptance Criteria:
- [ ] Users can register with email/password
- [ ] Users can login and receive JWT token
- [ ] Protected routes require authentication
- [ ] Password reset functionality works

#### Cline Implementation Notes:
- Reference patterns.md for code examples
- Follow the project structure from Stage 1
- Ensure all edge cases are handled
- Write tests alongside implementation

### Product Catalog
**Description**: Dynamic product listings with search and filtering
**Complexity**: complex

#### Tasks:
- [ ] Create product models
- [ ] Implement search functionality
- [ ] Add filtering and sorting
- [ ] Create product list components
- [ ] Implement pagination
- [ ] Add product detail views
- [ ] Optimize database queries
- [ ] Add caching layer

#### Cline Commands:
- Ask: "Implement the Product model based on patterns.md"
- Ask: "Create search functionality using Elasticsearch"
- Ask: "Add tests for product catalog features"

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
```

## Usage with Cline

1. Generate the configuration:
   ```bash
   context-forge init --ide cline
   ```

2. Install Cline extension in VS Code

3. Open your project - Cline will automatically load all files from:
   - `.clinerules/README.md` for main configuration
   - `.clinerules/context.md` for project understanding
   - `.clinerules/rules.md` for coding standards
   - `.clinerules/patterns.md` for code examples
   - `.clinerules/prp-*.md` for structured implementation (if features defined)

4. Use Cline for implementation:
   - Open Cline chat panel (Ctrl+Shift+P → "Cline: Open Chat")
   - Reference PRP stages for guided development
   - Ask Cline to help with specific tasks from checklists
   - Use validation commands to verify progress

5. PRP Workflow with Cline:
   ```
   # Start with Stage 1
   "Help me implement Stage 1 tasks from prp-stage-1.md"
   
   # Validate progress
   "Run the validation commands from prp-validation.md"
   
   # Move to next stage
   "Let's start Stage 2 from prp-stage-2.md"
   ```

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

### PRP Integration

Cline's unique approach to PRP:
- **Automatic Loading**: All markdown files in `.clinerules/` are combined
- **Context Awareness**: PRP stages reference your specific project setup
- **Task Tracking**: Use markdown checkboxes to track progress
- **Validation Support**: Run commands directly from chat
- **Incremental Development**: Work through stages methodically

Example PRP conversation:
```
You: "I need to implement user authentication from Stage 2"
Cline: "I'll help you implement user authentication. Looking at prp-stage-2.md, 
       I can see we need to create JWT-based auth with social login. 
       Let me start with the data models..."

You: "Can you validate our Stage 1 implementation?"
Cline: "I'll run the validation commands from prp-validation.md to check 
       if we're ready for Stage 2..."
```

### Settings
```json
{
  "cline.autoApprove": false,      // Require approval for changes
  "cline.contextWindow": "full",   // Use maximum context
  "cline.includeTests": true,      // Consider test files
  "cline.preserveContext": true    // Remember conversation context
}
```
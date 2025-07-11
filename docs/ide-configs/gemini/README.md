# Gemini Configuration

Gemini represents Google's AI tools including Gemini CLI and Gemini Code Assist. Context Forge generates hierarchical configuration optimized for Gemini's context understanding, now with PRP (Product Requirement Prompt) support for structured feature implementation.

## Generated File Structure

```
project-root/
├── GEMINI.md                 # Main configuration file
└── .gemini/
    ├── context/
    │   ├── project.md       # Project-specific context
    │   ├── architecture.md  # Architecture documentation
    │   └── guidelines.md    # Development guidelines
    ├── prp/                 # PRP files (if features defined)
    │   ├── overview.md      # PRP implementation overview
    │   ├── stage-1-foundation.md  # Foundation setup
    │   ├── stage-2-core.md        # Core features
    │   ├── stage-3-advanced.md    # Advanced features
    │   └── validation.md          # Validation gates
    └── config.yaml          # Gemini configuration with PRP settings
```

## Example: GEMINI.md

```markdown
# Gemini CLI Configuration

## Project: E-Commerce Platform

### Overview

A modern e-commerce platform with AI-powered product recommendations and real-time inventory management.

### Quick Start

\`\`\`bash

# Use Gemini CLI for code generation

gemini generate component ProductCard

# Get AI assistance

gemini assist "How do I implement cart persistence?"

# Analyze code

gemini analyze src/
\`\`\`

### Context Files

- **Project Context**: .gemini/context/project.md
- **Architecture**: .gemini/context/architecture.md
- **Guidelines**: .gemini/context/guidelines.md

### Development Mode

\`\`\`yaml
mode: development
context_depth: full
include_tests: true
follow_conventions: strict
\`\`\`

## Tech Stack Rules

- Use Next.js 15 App Router patterns
- Implement React Server Components where appropriate
- Follow file-based routing conventions

### Key Commands

1. **gemini init** - Initialize Gemini in project
2. **gemini context** - View current context
3. **gemini generate** - Generate code from templates
4. **gemini review** - AI code review
5. **gemini test** - Generate tests

### Integration Points

- VS Code: Gemini Code Assist extension
- CLI: Direct terminal access
- CI/CD: Automated code review

### Best Practices

- Keep context files updated
- Use specific prompts
- Review all generated code
- Maintain consistent patterns
```

## Example: .gemini/context/project.md

```markdown
# Project Context: E-Commerce Platform

## Project: E-Commerce Platform

A modern e-commerce platform with real-time inventory management and AI-powered product recommendations.

## Tech Stack

- **frontend**: nextjs
- **backend**: fastapi
- **database**: postgresql
- **auth**: jwt

## Key Features

- User Authentication: Secure JWT-based authentication with social login integration
- Product Catalog: Dynamic product listings with advanced search and filtering
- Shopping Cart: Persistent cart storage with real-time updates
- AI Recommendations: Personalized product suggestions using ML

## Development Info

- Timeline: standard
- Team Size: small

## Project Hierarchy

### Level 1: Core Infrastructure

- Development environment setup
- Base project structure
- Core dependencies
- Configuration management

### Level 2: Foundation Features

- **User Authentication**: JWT auth with social providers
- **Product Catalog**: CRUD operations and search
- **Shopping Cart**: Basic cart functionality

### Level 3: Enhanced Features

- **AI Recommendations**: ML-based suggestions
- **Advanced Search**: Elasticsearch integration
- **Real-time Updates**: WebSocket implementation

### Level 4: Nice-to-Have Features

- **Analytics Dashboard**: Business insights
- **A/B Testing**: Feature experiments
- **Mobile App**: React Native companion

## Implementation Strategy

### Timeline: standard

### Standard Strategy (8-12 weeks)

- Week 1-2: Planning and setup
- Week 3-6: Core feature development
- Week 7-9: Enhanced features
- Week 10-11: Testing and optimization
- Week 12: Deployment and documentation

### Team Structure: small

- 2-5 developers
- Shared code ownership
- Regular sync meetings

## Key Files and Directories

\`\`\`
src/
├── app/ # Next.js app directory
├── components/ # Reusable components
├── lib/ # Utility functions
├── hooks/ # Custom React hooks
└── types/ # TypeScript definitions

app/
├── api/ # API endpoints
├── core/ # Core configuration
├── models/ # Data models
├── schemas/ # Pydantic schemas
└── services/ # Business logic
\`\`\`

## External Resources

- Documentation: [Next.js Docs](https://nextjs.org/docs), [FastAPI Docs](https://fastapi.tiangolo.com)
- APIs: Internal APIs only
- Libraries: JWT libraries, PostgreSQL drivers
```

## Example: .gemini/context/architecture.md

```markdown
# Architecture Documentation

## System Architecture

### Project Type: fullstack

### Technology Stack

#### Frontend: nextjs

- Component library: Custom components
- State management: React Context + Server State
- Styling: CSS Modules

#### Backend: fastapi

- API style: RESTful
- Authentication: JWT
- ORM/ODM: SQLAlchemy

#### Database: postgresql

- Type: Relational
- Caching: Redis (optional)

### Architecture Pattern

### Microservices Architecture

- Frontend: SPA/SSR application
- Backend: RESTful API service
- Database: Persistent data store
- Cache: Performance optimization

### Component Hierarchy

#### Frontend Architecture

- **Framework**: nextjs
- **Routing**: File-based (App Router)
- **State Management**: React Context + Server State
- **Component Structure**: Atomic design
- **Data Fetching**: Server Components + Client fetching

#### Backend Architecture

- **Framework**: fastapi
- **API Design**: RESTful with OpenAPI spec
- **Middleware Stack**: CORS, Auth, Validation
- **Service Layer**: Business logic separation
- **Data Access**: Repository Pattern

#### Database Architecture

- **Database**: postgresql
- **Schema Design**: Normalized relational
- **Indexing Strategy**: Performance-optimized
- **Migration Tool**: Alembic
- **Backup Strategy**: Regular automated backups

### Data Flow

\`\`\`mermaid
graph LR
A[Client] -->|HTTP Request| B[API Gateway]
B --> C[Backend Service]
C --> D[Database]
D -->|Data| C
C -->|Response| B
B -->|JSON| A
\`\`\`

### API Design

### RESTful API Design

- Version prefix: /api/v1
- Resource-based URLs
- Standard HTTP methods
- JSON request/response
- Pagination support
- Error handling standards

### Security Architecture

### Security Layers

1. **Authentication**: JWT
2. **Authorization**: Role-based access control
3. **Data Validation**: Input sanitization
4. **Encryption**: HTTPS, encrypted storage
5. **Rate Limiting**: API throttling
6. **Security Headers**: CORS, CSP, etc.

### Deployment Architecture

### Deployment Strategy

- **Platform**: Cloud-based
- **Containerization**: Docker
- **Orchestration**: Kubernetes/Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Logs and metrics
- **Scaling**: Horizontal scaling ready

### Performance Considerations

### Performance Optimization

- Code splitting and lazy loading
- Caching strategy (Redis/Memory)
- Database query optimization
- CDN for static assets
- Compression (gzip/brotli)
- Image optimization

### Scalability Plan

### Scalability Roadmap

1. **Phase 1**: Single server deployment
2. **Phase 2**: Load balancing
3. **Phase 3**: Database replication
4. **Phase 4**: Microservices migration
5. **Phase 5**: Multi-region deployment
```

## Example: .gemini/context/guidelines.md

```markdown
# Development Guidelines

## Code Standards

### General Principles

1. **DRY** - Don't Repeat Yourself
2. **KISS** - Keep It Simple, Stupid
3. **YAGNI** - You Aren't Gonna Need It
4. **SOLID** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion

### Code Organization

- Maximum file length: 500 lines
- Maximum function length: 50 lines
- Maximum cyclomatic complexity: 10
- Descriptive naming conventions

### Gemini-Specific Guidelines

#### Prompt Engineering

- Be specific and contextual
- Reference existing patterns
- Include expected output format
- Specify constraints clearly

#### Code Generation

\`\`\`yaml
generate:
follow_patterns: true
include_tests: true
documentation: inline
style: project_conventions
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

## Development Workflow

### Feature Development

1. **Plan**: Review requirements and create design
2. **Implement**: Follow existing patterns
3. **Test**: Write comprehensive tests
4. **Document**: Update relevant documentation
5. **Review**: AI and peer code review

### Gemini Workflow

1. **Context Setup**: Ensure .gemini/ files are current
2. **Generate**: Use Gemini for boilerplate
3. **Customize**: Adapt to specific needs
4. **Validate**: Run tests and linting
5. **Iterate**: Refine with Gemini assistance

## Quality Checklist

- [ ] Code follows project conventions
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Gemini context files updated
```

## Usage with Gemini

1. Generate the configuration:

   ```bash
   context-forge init --ide gemini
   ```

2. Use Gemini CLI:

   ```bash
   # Initialize Gemini
   gemini init

   # View context
   gemini context

   # Generate code
   gemini generate component ShoppingCart

   # Get assistance
   gemini assist "implement payment processing"
   ```

3. Or use Gemini Code Assist in VS Code:
   - Install extension
   - Open command palette
   - Use Gemini commands

4. Context hierarchy:
   - `GEMINI.md` - Quick reference
   - `project.md` - Detailed context
   - `architecture.md` - Technical details
   - `guidelines.md` - Standards

## Best Practices

1. **Hierarchical Context**: Organize information by importance
2. **Detailed Architecture**: Include diagrams and flows
3. **Specific Guidelines**: Make rules actionable
4. **Regular Updates**: Keep context current

## Gemini-Specific Features

### Context Depth Levels

```yaml
context_depth:
  minimal: Basic project info only
  standard: Include architecture
  full: All context files
  deep: Include code analysis
```

### Command Examples

```bash
# Generate with context
gemini generate service PaymentService --context full

# Review with guidelines
gemini review src/ --guidelines strict

# Test generation
gemini test src/components/Cart --coverage 90
```

### Integration with CI/CD

```yaml
# .github/workflows/gemini.yml
- name: Gemini Code Review
  run: gemini review --changed-files --strict

- name: Generate Missing Tests
  run: gemini test --missing --min-coverage 80
```

## PRP (Product Requirement Prompt) Support

When features are defined in your configuration, Context Forge generates PRP files to guide structured implementation:

### Example: .gemini/prp/overview.md

````markdown
# PRP Implementation Overview: E-Commerce Platform

## What is PRP?

Product Requirement Prompts (PRP) provide a structured approach to implementing features with clear validation gates between stages. This methodology helps Gemini understand your project's implementation phases and success criteria.

## How to Use PRP with Gemini

### CLI Commands

```bash
# View current PRP stage
gemini prp status

# Generate code for specific stage
gemini generate --prp-stage 1

# Validate current stage completion
gemini prp validate
```
````

### Context Integration

Gemini automatically loads PRP files from `.gemini/prp/` when generating code. Reference these stages in your prompts:

- "Following PRP stage 1 guidelines..."
- "Implement the User Authentication feature from stage 2"
- "Validate stage 2 completion criteria"

## Implementation Stages

### 📋 Stage 1: Foundation

- Project setup and configuration
- Core infrastructure
- Basic models and schemas
- Database setup

### 🚀 Stage 2: Core Features

- User Authentication: JWT-based authentication
- Product Catalog: Dynamic product listings
- Shopping Cart: Persistent cart storage

### ✨ Stage 3: Advanced Features

- AI Recommendations: ML-powered suggestions
- Real-time Updates: WebSocket implementation

### ✅ Validation Gates

- Each stage has validation requirements
- Must pass before proceeding to next stage
- Automated testing and quality checks

````

### Example: .gemini/config.yaml
```yaml
# Gemini Code Assist Configuration

# PRP Settings
prp:
  enabled: true
  current_stage: 1
  stages:
    - name: "Foundation"
      status: "pending"
      path: ".gemini/prp/stage-1-foundation.md"
    - name: "Core Features"
      status: "pending"
      path: ".gemini/prp/stage-2-core.md"
    - name: "Advanced Features"
      status: "pending"
      path: ".gemini/prp/stage-3-advanced.md"

# Feature Tracking
features:
  - id: "auth"
    name: "User Authentication"
    priority: "must-have"
    complexity: "medium"
    status: "pending"
  - id: "catalog"
    name: "Product Catalog"
    priority: "must-have"
    complexity: "complex"
    status: "pending"

# Code Generation Settings
generation:
  follow_patterns: true
  include_tests: true
  documentation: inline
  style: project_conventions

# Context Settings
context:
  include_prp: true
  max_depth: 3
  exclude_patterns:
    - "node_modules/**"
    - ".git/**"
    - "dist/**"
    - "build/**"

# Validation Settings
validation:
  test_coverage_threshold: 80
  performance_budget:
    page_load: 3000  # ms
    bundle_size: 512000  # bytes
  security:
    scan_dependencies: true
    check_secrets: true

# Development Mode
mode: development
debug: false
telemetry: false
````

### PRP Workflow with Gemini

1. **Start with Stage 1**:

   ```bash
   # Review foundation tasks
   cat .gemini/prp/stage-1-foundation.md

   # Generate foundation code
   gemini generate --prp-stage 1
   ```

2. **Validate before proceeding**:

   ```bash
   # Run validation
   gemini prp validate --stage 1

   # Check status
   gemini prp status
   ```

3. **Progress through stages**:

   ```bash
   # Move to next stage after validation
   gemini prp next

   # Generate stage 2 features
   gemini generate --prp-stage 2
   ```

4. **Track feature completion**:

   ```bash
   # View feature status
   gemini prp features

   # Mark feature complete
   gemini prp complete auth
   ```

### Benefits of PRP with Gemini

1. **Structured Implementation**: Clear phases with validation gates
2. **Context Awareness**: Gemini understands project progression
3. **Quality Assurance**: Built-in validation requirements
4. **Feature Tracking**: Monitor implementation status
5. **Team Alignment**: Shared understanding of priorities

### Best Practices for PRP

1. Complete each stage fully before moving on
2. Run validation checks regularly
3. Update config.yaml as features complete
4. Use PRP references in your prompts
5. Commit after each stage completion

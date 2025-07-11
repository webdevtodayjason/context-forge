# Roo Code Configuration

Roo Code is a VS Code extension for AI-assisted development with a focus on workspace-specific rules and hierarchical configuration.

## Generated File Structure

```
project-root/
├── .roorules                  # Root configuration file
└── .roo/
    └── rules/
        ├── global.md         # Global rules (always loaded)
        └── workspace.md      # Workspace-specific rules
```

## Example: .roorules

```yaml
# Roo Code Configuration

version: 1.0
project: E-Commerce Platform
description: Modern e-commerce with AI recommendations

# Rule hierarchy
rules:
  - global.md # Always loaded
  - workspace.md # Project-specific rules

# Settings
settings:
  autoSuggest: true
  validateOnSave: true
  formatOnSave: true

# Tech stack
stack:
  frontend: nextjs
  backend: fastapi
  database: postgresql
  auth: jwt
```

## Example: .roo/rules/global.md

```markdown
# Global Roo Code Rules

## Core Principles

1. **Code Quality** - Write clean, maintainable code
2. **Consistency** - Follow established patterns
3. **Documentation** - Document complex logic
4. **Testing** - Test all new features

## Development Standards

- Use version control effectively
- Write descriptive commit messages
- Review code before committing
- Keep dependencies up to date

## Tech Stack Rules

- Use Next.js 15 App Router patterns
- Implement React Server Components where appropriate
- Follow file-based routing conventions
- Use async/await for all endpoints
- Implement Pydantic v2 models
- Follow Python type hints

## Code Organization

- Separate concerns properly
- Use meaningful file and folder names
- Group related functionality
- Avoid circular dependencies

## Security Guidelines

- Validate all user inputs
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Follow OWASP security best practices
- Never commit secrets to version control

## Error Handling

- Catch and handle errors appropriately
- Log errors with context
- Provide user-friendly error messages
- Never expose sensitive information in errors
```

## Example: .roo/rules/workspace.md

```markdown
# Workspace Rules: E-Commerce Platform

## Project: E-Commerce Platform

A modern e-commerce platform with real-time inventory and AI recommendations

## Tech Stack

- **frontend**: nextjs
- **backend**: fastapi
- **database**: postgresql
- **auth**: jwt

## Key Features

- User Authentication: JWT-based auth with social login
- Product Catalog: Dynamic listings with search
- Shopping Cart: Persistent storage with real-time updates

## Development Info

- Timeline: standard
- Team Size: small

## Project Structure

\`\`\`
client/
├── src/
│ ├── components/
│ ├── hooks/
│ ├── services/
│ └── App.tsx
└── package.json

server/
├── src/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ └── app.ts
└── package.json
\`\`\`

## Implementation Guidelines

### Phase 1: Foundation (Week 1)

- Set up development environment
- Initialize project structure
- Configure build tools
- Set up version control

### Phase 2: Core Features (Weeks 2-3)

- Implement User Authentication
- Implement Product Catalog
- Implement Shopping Cart

### Phase 3: Enhancement (Week 4)

- Add AI Recommendations
- Add Advanced Search

### Phase 4: Polish (Week 5)

- Performance optimization
- UI/UX improvements
- Documentation updates
- Deployment preparation

## Testing Requirements

- Minimum 80% code coverage
- Write tests for all new features
- Test user behavior, not implementation details
- Include both unit and integration tests

## Roo Code Specific Features

- Use Roo's AI suggestions for boilerplate code
- Leverage context understanding for better completions
- Use workspace rules for project consistency
- Keep rules updated as project evolves

## Team Collaboration (small team)

- Daily standups recommended
- Code reviews for all PRs
- Shared documentation in team wiki
- Clear task assignment

## Timeline: standard

- Balanced approach to features
- Regular refactoring cycles
- Comprehensive testing
- Sustainable development pace
```

## Usage with Roo Code

1. Generate the configuration:

   ```bash
   context-forge init --ide roo
   ```

2. Install Roo Code extension in VS Code

3. Open your project - Roo Code will read:
   - `.roorules` for configuration
   - `.roo/rules/global.md` for team standards
   - `.roo/rules/workspace.md` for project specifics

4. Use Roo Code features:
   - AI-powered completions
   - Context-aware suggestions
   - Rule-based code generation

## Best Practices

1. **Rule Hierarchy**: Global rules apply everywhere, workspace rules for project
2. **YAML Configuration**: Keep `.roorules` clean and organized
3. **Markdown Rules**: Use clear formatting in rule files
4. **Regular Updates**: Keep rules current with project changes

## Roo Code Features

### Hierarchical Rules

- Global rules: Team/company standards
- Workspace rules: Project-specific guidance
- Rules cascade from global to specific

### Configuration Options

```yaml
settings:
  autoSuggest: true # Enable AI suggestions
  validateOnSave: true # Run validation on save
  formatOnSave: true # Auto-format code
  contextDepth: 3 # How many files to analyze
```

### Integration Tips

- Reference rules in comments for team
- Use consistent patterns across codebase
- Let Roo learn from your coding style

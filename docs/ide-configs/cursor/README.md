# Cursor IDE Configuration

Cursor is an AI-powered IDE built on VS Code that provides intelligent code completion and AI assistance. Context Forge generates Cursor-specific rule files following their MDC (Markdown Configuration) format, including comprehensive PRP (Product Requirement Prompt) support.

## Generated File Structure

```
project-root/
├── .cursorrules               # Main rules file
└── .cursor/
    └── rules/
        ├── global.md         # Global development rules
        ├── project.md        # Project-specific rules
        ├── prp-overview.mdc  # PRP implementation overview
        ├── prp-stage-1.mdc   # Foundation setup tasks
        ├── prp-stage-2.mdc   # Core feature implementation
        ├── prp-stage-3.mdc   # Advanced features & polish
        └── prp-validation.mdc # Validation gates & checks
```

## PRP (Product Requirement Prompt) Support

Cursor now supports PRP methodology through MDC format files in the `.cursor/rules/` directory. This provides:

- **Staged Implementation**: Clear development phases with specific tasks
- **Validation Gates**: Quality checks between stages
- **Task Checklists**: Detailed implementation steps
- **Acceptance Criteria**: Clear success metrics for features
- **MDC Format**: Native Cursor format with metadata headers

## Example: .cursorrules

```markdown
# Cursor Rules for MyProject

## Project: E-Commerce Platform
A modern e-commerce platform with AI-powered recommendations

## Development Philosophy
- Keep It Simple (KISS) - Choose straightforward solutions
- You Aren't Gonna Need It (YAGNI) - Avoid speculative features
- Don't Repeat Yourself (DRY) - Reuse code effectively

## Code Structure Rules
- Never create files longer than 500 lines
- Functions should be focused and single-purpose
- Components/Classes should have single responsibility
- Use descriptive variable and function names

## Tech Stack Rules
- Use Next.js 15 App Router patterns
- Implement React Server Components where appropriate
- Follow file-based routing conventions
- Use async/await for all endpoints
- Implement Pydantic v2 models

## File Organization
\`\`\`
frontend/
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
└── requirements.txt
\`\`\`

## Testing Requirements
- Minimum 85% code coverage
- Write tests for all new features
- Test user behavior, not implementation details
- Include both unit and integration tests

## Security Guidelines
- Validate all user inputs
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Follow OWASP security best practices
- Never commit secrets to version control

## Cursor-Specific Guidelines
- Use Cursor's AI features for code generation
- Follow the project's established patterns
- Always review AI-generated code before committing
- Use Cursor's chat for clarification on complex tasks

## Pre-commit Checklist
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] No debug statements left
- [ ] Security considerations addressed
```

## Example: .cursor/rules/global.md

```markdown
# Global Cursor Rules

## General Coding Standards
- Write clean, readable, and maintainable code
- Follow language-specific best practices
- Use meaningful commit messages
- Document complex logic

## AI Assistance Guidelines
- Be specific in your prompts
- Review all generated code
- Test thoroughly before committing
- Don't rely solely on AI for critical logic

## Common Patterns
- Use dependency injection
- Implement proper error handling
- Follow SOLID principles
- Write testable code
```

## Example: .cursor/rules/project.md

```markdown
# Project-Specific Rules: E-Commerce Platform

## Project Context
A scalable e-commerce platform with real-time inventory management

## Key Features to Implement
### User Authentication (must-have)
- JWT-based authentication
- Social login integration
- Complexity: medium
- Subtasks:
  - Set up auth middleware
  - Implement login/register endpoints
  - Add password reset functionality

### Product Catalog (must-have)
- Dynamic product listings
- Advanced search and filtering
- Complexity: complex

### Shopping Cart (must-have)
- Persistent cart storage
- Real-time updates
- Complexity: medium

## Implementation Stages
1. **Foundation** - Set up project structure and core dependencies
2. **Core Features** - Implement must-have functionality
3. **Enhancement** - Add should-have features
4. **Polish** - Optimize and refine

## Project-Specific Guidelines
- Use Server Components by default, Client Components only when needed
- Implement proper loading and error states
- Optimize images with next/image
- Use Pydantic for request/response validation
- Implement async endpoints for better performance
```

## Example: PRP Files

### prp-overview.mdc
```markdown
---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Implementation Overview: E-Commerce Platform

## What is PRP?
Product Requirement Prompts provide a structured approach to implementing features...

## Implementation Stages
- 📋 Stage 1: Foundation (see prp-stage-1.mdc)
- 🚀 Stage 2: Core Features (see prp-stage-2.mdc)
- ✨ Stage 3: Advanced Features (see prp-stage-3.mdc)
- ✅ Validation Gates (see prp-validation.mdc)
```

### prp-stage-2.mdc
```markdown
---
type: project
globs: ["**/*"]
alwaysApply: true
---

# PRP Stage 2: Core Features

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

#### Acceptance Criteria:
- [ ] Users can register with email/password
- [ ] Users can login and receive JWT token
- [ ] Protected routes require authentication
```

## Usage with Cursor IDE

1. Generate the configuration:
   ```bash
   context-forge init --ide cursor
   ```

2. Open your project in Cursor IDE

3. Cursor will automatically read:
   - `.cursorrules` for main project rules
   - `.cursor/rules/global.md` for general guidelines
   - `.cursor/rules/project.md` for specific features

4. Use Cursor's AI features with context:
   - Cmd+K for inline generation
   - Cmd+L for chat assistance
   - Rules will guide AI responses

## Best Practices

1. **Hierarchical Rules**: Global rules apply everywhere, project rules are specific
2. **Keep Rules Updated**: Update as your project evolves
3. **Be Specific**: The more detailed your rules, the better AI assistance
4. **Test AI Output**: Always review and test generated code

## Cursor-Specific Features

### Rule Hierarchy
- `.cursorrules` - Main entry point
- `.cursor/rules/global.md` - Team/company standards
- `.cursor/rules/project.md` - Project-specific guidance

### Integration Tips
- Use Cursor's chat to ask about rules
- Reference rules in your prompts
- Let Cursor learn from your codebase

### Performance Tips
- Keep rule files concise
- Use clear section headers
- Organize rules by topic
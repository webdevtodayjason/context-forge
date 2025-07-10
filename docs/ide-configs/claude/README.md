# Claude Code Configuration

Claude Code is Anthropic's official CLI for AI-assisted development. Context Forge provides the most comprehensive support for Claude Code with full PRP (Product Requirement Prompt) integration.

## Generated File Structure

```
project-root/
├── CLAUDE.md                    # Main context file
├── Docs/
│   ├── Implementation.md       # Staged development plan
│   ├── project_structure.md    # Project organization
│   ├── UI_UX_doc.md           # Design specifications
│   └── Bug_tracking.md        # Bug tracking template
├── PRPs/                      # Product Requirement Prompts
│   ├── base.md               # Core implementation PRP
│   ├── planning.md           # Architecture planning
│   └── validation-gate.md    # Validation requirements
└── .context-forge/           # Configuration metadata
    └── config.json
```

## Example: CLAUDE.md

```markdown
# MyProject - Claude Code Context

## Project Overview
A modern web application built with Next.js and FastAPI

## Context Engineering Setup
This project uses context engineering principles for efficient AI-assisted development.

### Key Files:
- `/Docs/Implementation.md` - Staged development plan
- `/Docs/project_structure.md` - Project organization
- `/PRPs/` - Product Requirement Prompts for detailed implementation

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation.

## Code Structure & Modularity
- Never create a file longer than 500 lines
- Functions should be short and focused
- Components/Classes should have single responsibility

## Tech Stack
- **Frontend**: Next.js 15
- **Backend**: FastAPI
- **Database**: PostgreSQL

## Testing Requirements
- Minimum 85% code coverage
- All features must have tests

## Pre-commit Checklist
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated
```

## Features

### ✅ Full PRP Support
Claude Code is the only IDE with full PRP (Product Requirement Prompt) support, enabling:
- Detailed implementation blueprints
- Validation loops
- Architecture planning documents
- Specification generation

### ✅ Validation System
Built-in validation commands for:
- Syntax checking
- Test coverage
- Build verification
- Security scanning

### ✅ Tech-Stack Specific Templates
Optimized CLAUDE.md files for:
- Next.js 15
- React
- FastAPI
- Express
- Django
- And more...

## Usage with Claude Code

1. Generate the configuration:
   ```bash
   context-forge init --ide claude
   ```

2. Open your project in Claude Code

3. Claude will automatically read `CLAUDE.md` and understand:
   - Project structure and conventions
   - Development philosophy
   - Testing requirements
   - Implementation stages

4. Use PRPs for complex features:
   - Reference `/PRPs/base.md` for implementation
   - Follow validation gates
   - Track progress in Implementation.md

## Best Practices

1. **Keep CLAUDE.md Updated**: As your project evolves, update the main context file
2. **Use Bug Tracking**: Document issues in `Bug_tracking.md` for Claude to learn from
3. **Follow Stages**: Work through Implementation.md stages sequentially
4. **Leverage PRPs**: For complex features, create specific PRPs

## Advanced Features

### Custom Commands
Place custom Claude commands in `.claude/commands/` (if enabled)

### AI Documentation
Store curated documentation in `ai_docs/` for Claude's reference

### Validation Integration
Run `context-forge validate` to ensure code quality before commits
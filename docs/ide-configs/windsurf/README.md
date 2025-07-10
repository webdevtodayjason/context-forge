# Windsurf Configuration

Windsurf is an AI-powered IDE with Cascade AI integration. Context Forge generates a comprehensive configuration that leverages Windsurf's unique features for predictive coding assistance.

## Generated File Structure

```
project-root/
├── .windsurfrules.md         # Project-specific rules
├── global_rules.md           # Global development standards
├── .codeiumignore           # Files to ignore in Cascade AI
└── windsurf_workflows/      # Custom workflow definitions
    └── test_and_lint.yaml   # Example workflow
```

## Example: .windsurfrules.md

```markdown
# Cascade AI Rules for E-Commerce Platform

## Project Configuration
**Project Name**: E-Commerce Platform
**Type**: fullstack
**Description**: A modern e-commerce platform with AI-powered product recommendations
**Status**: Active Development

### Tech Stack
- **Frontend**: nextjs (App Router, Server Components)
- **Backend**: fastapi (Async, Type Hints)
- **Database**: postgresql (Relational)
- **Auth**: jwt (Secure tokens)

## Cascade AI Settings
```yaml
cascade:
  mode: collaborative
  context_awareness: high
  suggestion_level: balanced
  auto_complete: true
  error_prevention: true
```

## Development Philosophy
- **Predictive Assistance**: Let Cascade AI anticipate your needs
- **Collaborative Coding**: Work with AI as a pair programmer
- **Quality First**: Use AI to prevent bugs before they happen
- **Continuous Learning**: Cascade adapts to your coding style

## Code Standards
- Maximum file size: 500 lines
- Clear function names and documentation
- Consistent code style across the project
- Follow language-specific best practices

## Project Structure
```
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
```

## Cascade AI Workflows

### Code Generation
- Use natural language prompts
- Reference existing patterns
- Let Cascade suggest implementations
- Review and refine AI suggestions

### Error Prevention
- Real-time error detection
- Suggested fixes before runtime
- Type safety enforcement
- Security vulnerability scanning

### Refactoring Assistance
- Identify code smells
- Suggest improvements
- Maintain backward compatibility
- Update related files automatically

## Windsurf-Specific Features

### Cascade AI Commands
- `cascade:generate` - Generate code from description
- `cascade:refactor` - Improve existing code
- `cascade:explain` - Get code explanations
- `cascade:test` - Generate test cases
- `cascade:review` - AI code review

### Integration Points
- Git integration for version control
- Terminal integration for commands
- Debugger integration for troubleshooting
- Package manager integration

## Best Practices
- Let Cascade AI learn from your codebase
- Use descriptive prompts for better results
- Review AI suggestions before accepting
- Provide feedback to improve AI responses
```

## Example: global_rules.md

```markdown
# Global Rules for Windsurf

## Development Standards
- Write clean, maintainable code
- Follow language-specific best practices
- Document complex logic
- Write tests for new features

## Communication Style
- Be clear and concise in comments
- Use descriptive variable names
- Explain "why" not just "what"

## Code Quality
- No code duplication
- Keep functions small and focused
- Handle errors gracefully
- Follow SOLID principles

## Security
- Never commit secrets
- Validate all inputs
- Use environment variables
- Follow OWASP guidelines

## Performance
- Optimize for readability first
- Profile before optimizing
- Consider scalability
- Cache when appropriate
```

## Example: .codeiumignore

```
# Windsurf/Cascade AI ignore file
# Prevents Cascade from viewing, editing or creating files in these paths

# Dependencies
node_modules/
*.pyc
__pycache__/
venv/
.env

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Test coverage
coverage/
.coverage
htmlcov/

# Temporary files
*.tmp
*.temp
.cache/
```

## Example: windsurf_workflows/test_and_lint.yaml

```yaml
name: Test and Lint Workflow
description: Run tests and linting before committing

trigger:
  - pre_commit
  - manual

steps:
  - name: Run Linter
    command: |
      if [ -f "package.json" ]; then
        npm run lint
      elif [ -f "requirements.txt" ]; then
        python -m pylint src/
      fi
    
  - name: Run Tests
    command: |
      if [ -f "package.json" ]; then
        npm test
      elif [ -f "requirements.txt" ]; then
        python -m pytest
      fi
    
  - name: Check Coverage
    command: |
      if [ -f "package.json" ]; then
        npm run test:coverage
      elif [ -f "requirements.txt" ]; then
        python -m pytest --cov
      fi
    minimum_coverage: 80

success_message: "All checks passed! Ready to commit."
failure_message: "Checks failed. Please fix issues before committing."
```

## Usage with Windsurf

1. Generate the configuration:
   ```bash
   context-forge init --ide windsurf
   ```

2. Open project in Windsurf IDE

3. Cascade AI will automatically:
   - Read `.windsurfrules.md` for project context
   - Apply `global_rules.md` standards
   - Respect `.codeiumignore` patterns
   - Execute workflows as configured

4. Use Cascade AI features:
   ```
   # Generate a new component
   Type: "Create a ProductCard component with image, title, price"
   
   # Refactor existing code
   Select code → Right-click → Cascade: Refactor
   
   # Get explanations
   Select code → Right-click → Cascade: Explain
   ```

## Best Practices

1. **Predictive Coding**: Let Cascade anticipate your needs
2. **Natural Language**: Use descriptive prompts
3. **Workflow Automation**: Create custom workflows
4. **Continuous Learning**: Cascade improves over time

## Windsurf-Specific Features

### Real-time Collaboration
- Cascade AI learns from your coding patterns
- Suggests code based on project context
- Prevents errors before they happen
- Adapts to team coding standards

### Workflow System
```yaml
# Create custom workflows in windsurf_workflows/
workflow: feature_development
steps:
  - analyze_requirements
  - generate_boilerplate
  - implement_logic
  - generate_tests
  - review_code
```

### Error Prevention
- Type checking in real-time
- Security vulnerability detection
- Performance issue warnings
- Code smell identification

### Integration Points
- **Version Control**: Deep Git integration
- **Testing**: Automated test generation
- **Documentation**: Auto-documentation
- **Refactoring**: Smart code improvements
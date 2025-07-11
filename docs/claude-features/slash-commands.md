# Claude Code Slash Commands

## Overview

Context Forge now generates a comprehensive set of slash commands for Claude Code, enabling powerful AI-assisted development workflows. These commands are stored in `.claude/commands/` and provide structured, repeatable patterns for common development tasks.

## How Slash Commands Work

### Command Structure

Each slash command is a markdown file in `.claude/commands/` with this format:

```markdown
name: command-name
description: Brief description of the command
category: PRPs|context|implementation|testing|documentation|custom

---

# Command Title: $ARGUMENTS

[Detailed instructions for Claude]
```

### Using Commands

In Claude Code, invoke commands by typing:
```
/command-name your arguments here
```

The `$ARGUMENTS` placeholder is replaced with everything after the command name.

## Command Categories

### 🎯 PRP Commands

#### `/prp-create`
Generate comprehensive PRPs with deep research and context gathering.

**Usage**: `/prp-create user authentication system`

**Process**:
1. Analyzes codebase for patterns
2. Researches external documentation
3. Identifies gotchas and best practices
4. Generates context-rich PRP with validation gates

#### `/prp-execute`
Execute a PRP with built-in validation loops.

**Usage**: `/prp-execute authentication-prp`

**Features**:
- Reads PRP from `PRPs/` directory
- Implements step-by-step
- Runs validation after each step
- Auto-fixes issues
- Confirms all tests pass

#### `/parallel-prp-create`
Create multiple interdependent PRPs simultaneously.

**Usage**: `/parallel-prp-create auth, user-management, permissions`

**Benefits**:
- Considers feature interactions
- Shared context across PRPs
- Consistent architecture

#### `/prp-validate`
Check PRP completeness and quality.

**Usage**: `/prp-validate authentication-prp`

**Checks**:
- Required sections present
- Validation gates defined
- Context sufficiency
- Task clarity

#### `/prp-add-docs`
Add critical documentation to ai_docs for future reference.

**Usage**: `/prp-add-docs https://docs.example.com/auth-guide`

### 📚 Context Commands

#### `/prime-context`
Load essential project knowledge into Claude's context.

**Usage**: `/prime-context`

**Loads**:
- Project structure
- Key configuration files
- Architecture patterns
- Testing conventions
- Recent changes

#### `/analyze-codebase`
Deep dive into specific codebase areas.

**Usage**: `/analyze-codebase authentication flow`

**Analysis includes**:
- File relationships
- Data flow
- Dependencies
- Patterns used

#### `/context-refresh`
Update context with recent changes.

**Usage**: `/context-refresh`

**Updates**:
- Modified files
- New dependencies
- Configuration changes

#### `/explain-architecture`
Document and explain system architecture.

**Usage**: `/explain-architecture API layer`

### 🛠️ Implementation Commands

#### `/implement-feature`
Implement features with tests and validation.

**Usage**: `/implement-feature dark mode toggle`

**Process**:
1. Research similar features
2. Plan implementation
3. Write code with tests
4. Run validation gates
5. Ensure quality

#### `/fix-bug`
Diagnose and fix bugs with regression tests.

**Usage**: `/fix-bug login fails with special characters`

**Workflow**:
1. Reproduce issue
2. Identify root cause
3. Implement fix
4. Add regression tests
5. Verify fix

#### `/refactor-code`
Safe refactoring with test coverage.

**Usage**: `/refactor-code user service to use dependency injection`

**Safety measures**:
- Maintains test coverage
- Incremental changes
- Validation after each step

#### `/performance-optimize`
Optimize code with benchmarking.

**Usage**: `/performance-optimize database queries in user service`

**Includes**:
- Performance profiling
- Optimization strategies
- Before/after benchmarks
- Regression testing

### 🧪 Testing Commands

#### `/test-create`
Generate comprehensive test suites.

**Usage**: `/test-create user authentication module`

**Coverage**:
- Unit tests
- Integration tests
- Edge cases
- Error scenarios

#### `/test-coverage`
Analyze and improve test coverage.

**Usage**: `/test-coverage`

**Actions**:
- Identify untested code
- Generate missing tests
- Improve test quality

#### `/test-integration`
Create end-to-end integration tests.

**Usage**: `/test-integration user registration flow`

### 📖 Documentation Commands

#### `/doc-api`
Generate API documentation.

**Usage**: `/doc-api user endpoints`

**Generates**:
- Endpoint descriptions
- Request/response examples
- Error codes
- Authentication requirements

#### `/doc-architecture`
Create architecture documentation.

**Usage**: `/doc-architecture`

**Includes**:
- System overview
- Component diagrams
- Data flow
- Design decisions

#### `/doc-user-guide`
Generate user-facing documentation.

**Usage**: `/doc-user-guide authentication features`

### 🚀 Deployment Commands

#### `/deploy-checklist`
Generate deployment checklist.

**Usage**: `/deploy-checklist production`

**Covers**:
- Pre-deployment tests
- Configuration validation
- Migration steps
- Rollback procedures

#### `/env-setup`
Set up environment configurations.

**Usage**: `/env-setup staging`

### 🐛 Debugging Commands

#### `/debug-analyze`
Analyze issues with debugging strategies.

**Usage**: `/debug-analyze memory leak in background jobs`

#### `/log-analysis`
Analyze logs for patterns and issues.

**Usage**: `/log-analysis last 24 hours`

### 🔍 Code Review Commands

#### `/review-code`
Perform AI code review.

**Usage**: `/review-code src/services/auth.ts`

**Reviews**:
- Code quality
- Best practices
- Security issues
- Performance concerns

#### `/security-scan`
Security-focused code analysis.

**Usage**: `/security-scan authentication module`

### 🏗️ Scaffolding Commands

#### `/scaffold-module`
Generate module boilerplate.

**Usage**: `/scaffold-module payment-processing`

#### `/scaffold-api`
Create API endpoint structure.

**Usage**: `/scaffold-api /api/v2/orders CRUD`

## Custom Commands

### Creating Custom Commands

1. Create a new file in `.claude/commands/custom/`:

```markdown
name: my-project-command
description: Project-specific workflow
category: custom

---

# My Custom Command: $ARGUMENTS

## Purpose
[What this command does]

## Steps
1. [Step 1 with specific project conventions]
2. [Step 2 with validation]
3. [Step 3 with output]

## Validation
- [ ] Tests pass
- [ ] Linting clean
- [ ] Project-specific checks
```

2. Use in Claude Code: `/my-project-command parameters`

### Best Practices for Custom Commands

1. **Be Specific**: Include exact file paths, patterns, and conventions
2. **Add Validation**: Always include verification steps
3. **Reference Examples**: Point to existing code patterns
4. **Include Context**: Add links to relevant documentation
5. **Error Handling**: Specify what to do when things go wrong

## Advanced Usage

### Command Chaining

Commands can reference other commands for complex workflows:

```
/prime-context
/analyze-codebase authentication
/prp-create OAuth2 integration
/prp-execute oauth2-integration
```

### Parameterized Commands

Commands support multiple parameters:

```
/implement-feature "user profiles" --priority=high --tests=comprehensive
```

### Conditional Execution

Commands can include conditional logic:

```markdown
## If using TypeScript
- Add type definitions
- Run type checking

## If using JavaScript
- Add JSDoc comments
- Run linting
```

## Integration with PRP Runner

Slash commands work seamlessly with the PRP runner:

1. Create PRP: `/prp-create feature-name`
2. Review generated PRP
3. Execute: `context-forge run-prp feature-name`

Or directly in Claude Code:
1. `/prp-execute feature-name`

## Troubleshooting

### Command Not Found
- Ensure `.claude/commands/` exists
- Check command name spelling
- Verify file has correct frontmatter

### Arguments Not Replaced
- Ensure using `$ARGUMENTS` (all caps)
- Check for typos in placeholder

### Command Not Working as Expected
- Review command instructions
- Check for project-specific requirements
- Ensure all dependencies available

## Examples

### Full Feature Implementation

```bash
# 1. Load context
/prime-context

# 2. Create comprehensive PRP
/prp-create user notification system with email and SMS

# 3. Review and execute
/prp-execute user-notification-system

# 4. Generate tests
/test-create notification service

# 5. Document
/doc-api notification endpoints
```

### Bug Fix Workflow

```bash
# 1. Analyze the issue
/debug-analyze users report login timeout

# 2. Fix with tests
/fix-bug login timeout after 30 seconds

# 3. Verify
/test-integration login flow
```

### Performance Optimization

```bash
# 1. Analyze current performance
/performance-analyze API response times

# 2. Optimize
/performance-optimize database queries

# 3. Verify improvements
/benchmark-compare before after
```

## Conclusion

Slash commands transform Claude Code into a powerful development orchestrator, providing:

- **Consistency**: Repeatable workflows
- **Quality**: Built-in validation
- **Efficiency**: Complex tasks in one command
- **Customization**: Project-specific workflows
- **Knowledge**: Embedded best practices

Use them to accelerate development while maintaining high code quality!
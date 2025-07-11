# PRP Runner - Automated PRP Execution

## Overview

The PRP Runner is a powerful CLI tool that executes Product Requirement Prompts (PRPs) directly with Claude Code, enabling automated implementation with built-in validation gates and quality assurance.

## Installation & Setup

The PRP Runner is included when you install Context Forge:

```bash
npm install -g context-forge
```

## Basic Usage

### Interactive Mode (Default)

```bash
context-forge run-prp [prp-name]
```

This launches an interactive session where you can:
- Select from available PRPs
- Set Claude Code configuration
- Monitor execution progress
- Review results

### Headless Mode

```bash
context-forge run-prp authentication-prp --no-interactive
```

Runs without user interaction, perfect for:
- CI/CD pipelines
- Automated workflows
- Batch processing

### Output Formats

```bash
# Human-readable text (default)
context-forge run-prp feature-prp

# JSON output for parsing
context-forge run-prp feature-prp -o json

# Streaming JSON for real-time processing
context-forge run-prp feature-prp -o stream-json
```

## Configuration

### Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--interactive` | `-i` | Run in interactive mode | `true` |
| `--output-format` | `-o` | Output format: text, json, stream-json | `text` |
| `--api-key` | `-k` | Claude API key (or use env var) | - |
| `--model` | `-m` | Claude model to use | `claude-3-5-sonnet-latest` |
| `--max-tokens` | `-t` | Maximum tokens for response | `8192` |
| `--config` | `-c` | Path to config file | - |

### Environment Variables

```bash
# Claude API Key
export CLAUDE_API_KEY="your-api-key"

# Default model
export CLAUDE_MODEL="claude-3-5-sonnet-latest"

# Default output format
export PRP_OUTPUT_FORMAT="json"
```

### Configuration File

Create `.prp-runner.json` in your project root:

```json
{
  "model": "claude-3-5-sonnet-latest",
  "maxTokens": 8192,
  "temperature": 0.7,
  "outputFormat": "text",
  "validation": {
    "runTests": true,
    "runLinting": true,
    "runTypeCheck": true,
    "stopOnError": false
  },
  "hooks": {
    "beforeExecute": "npm run pre-prp",
    "afterExecute": "npm run post-prp",
    "onError": "npm run prp-error"
  }
}
```

## PRP Execution Flow

### 1. PRP Discovery

The runner looks for PRPs in these locations:
- `PRPs/` directory (default)
- `.claude/PRPs/` directory
- Custom path via `--prp-dir` flag

### 2. Pre-execution Phase

1. **Context Loading**
   - Project structure analysis
   - Configuration file parsing
   - Dependency checking

2. **Validation Setup**
   - Identify validation commands
   - Prepare test environment
   - Set up monitoring

3. **Claude Code Initialization**
   - API connection
   - Model configuration
   - Token allocation

### 3. Execution Phase

The runner sends the PRP to Claude Code with:

1. **Enhanced Context**
   ```
   - Project structure
   - Existing code patterns
   - Test examples
   - Configuration files
   - Recent changes
   ```

2. **Execution Instructions**
   ```
   - Step-by-step implementation
   - Validation after each step
   - Error recovery procedures
   - Success criteria
   ```

3. **Monitoring**
   - Real-time progress updates
   - Token usage tracking
   - Error detection
   - Performance metrics

### 4. Validation Gates

After each implementation step:

#### Level 1: Syntax Validation
```bash
npm run lint
npm run typecheck
```

#### Level 2: Unit Tests
```bash
npm test -- --related
```

#### Level 3: Integration Tests
```bash
npm run test:integration
```

#### Level 4: Creative Validation
```bash
npm run test:e2e
npm run security:scan
```

### 5. Post-execution Phase

1. **Results Compilation**
   - Success/failure status
   - Files created/modified
   - Test results
   - Performance metrics

2. **Reporting**
   - Execution summary
   - Validation results
   - Token usage
   - Recommendations

## Advanced Features

### Parallel Execution

Execute multiple PRPs simultaneously:

```bash
context-forge run-prp "auth-prp,user-prp,profile-prp" --parallel
```

### Conditional Execution

PRPs can include conditions:

```markdown
## IF database === 'postgresql'
- Use pg client
- Add connection pooling

## IF database === 'mongodb'
- Use mongoose
- Add schema validation
```

### Custom Validation Gates

Add project-specific validation:

```json
{
  "validation": {
    "custom": [
      {
        "name": "Security Scan",
        "command": "npm run security:audit",
        "required": true
      },
      {
        "name": "Performance Test",
        "command": "npm run perf:test",
        "threshold": "< 200ms"
      }
    ]
  }
}
```

### Incremental Execution

Resume from failure point:

```bash
# First run fails at step 3
context-forge run-prp feature-prp

# Resume from step 3
context-forge run-prp feature-prp --resume
```

### Dry Run Mode

Preview without execution:

```bash
context-forge run-prp feature-prp --dry-run
```

Shows:
- Steps to be executed
- Validation gates
- Estimated token usage
- Potential issues

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/prp-execution.yml
name: Execute PRP
on:
  issue_comment:
    types: [created]

jobs:
  prp-run:
    if: contains(github.event.comment.body, '/execute-prp')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Context Forge
        run: npm install -g context-forge
      
      - name: Execute PRP
        env:
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        run: |
          PRP_NAME=$(echo "${{ github.event.comment.body }}" | sed 's/\/execute-prp //')
          context-forge run-prp "$PRP_NAME" --no-interactive -o json > result.json
      
      - name: Comment Results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const result = JSON.parse(fs.readFileSync('result.json', 'utf8'));
            const body = `## PRP Execution Results\n\n${result.summary}`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### Git Hook Integration

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check if PRP exists for changes
CHANGED_FILES=$(git diff --cached --name-only)
if echo "$CHANGED_FILES" | grep -q "PRPs/"; then
  echo "Validating PRP..."
  context-forge run-prp --validate-only
fi
```

### VS Code Task

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Execute Current PRP",
      "type": "shell",
      "command": "context-forge",
      "args": [
        "run-prp",
        "${fileBasenameNoExtension}",
        "--interactive"
      ],
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## Error Handling

### Common Errors

#### API Key Issues
```
Error: Claude API key not found
Solution: Set CLAUDE_API_KEY environment variable
```

#### PRP Not Found
```
Error: PRP 'feature-prp' not found
Solution: Ensure PRP exists in PRPs/ directory
```

#### Validation Failure
```
Error: Validation gate failed: npm test
Solution: Review test output, fix issues, use --resume
```

### Recovery Strategies

1. **Automatic Retry**
   ```json
   {
     "retry": {
       "maxAttempts": 3,
       "backoff": "exponential",
       "onErrors": ["timeout", "rate_limit"]
     }
   }
   ```

2. **Checkpoint System**
   - Saves progress after each step
   - Allows resume from failure
   - Preserves context between runs

3. **Rollback Support**
   ```bash
   # Rollback last PRP execution
   context-forge run-prp --rollback
   ```

## Performance Optimization

### Token Usage

Monitor and optimize token consumption:

```bash
# Show token estimate before running
context-forge run-prp feature-prp --estimate-tokens

# Set token limit
context-forge run-prp feature-prp --max-tokens 4000
```

### Caching

Enable caching for faster execution:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "storage": ".prp-cache"
  }
}
```

### Batch Processing

Process multiple PRPs efficiently:

```bash
# Sequential with shared context
context-forge run-prp --batch "auth,user,profile"

# Parallel execution
context-forge run-prp --batch "auth,user,profile" --parallel --max-concurrent 3
```

## Monitoring & Observability

### Execution Logs

```bash
# Verbose logging
context-forge run-prp feature-prp --verbose

# Save logs
context-forge run-prp feature-prp --log-file execution.log

# Real-time streaming
context-forge run-prp feature-prp --stream
```

### Metrics Collection

```json
{
  "metrics": {
    "enabled": true,
    "endpoint": "https://metrics.example.com",
    "include": [
      "execution_time",
      "token_usage",
      "validation_results",
      "error_rate"
    ]
  }
}
```

### Webhooks

```json
{
  "webhooks": {
    "onStart": "https://api.example.com/prp/start",
    "onComplete": "https://api.example.com/prp/complete",
    "onError": "https://api.example.com/prp/error"
  }
}
```

## Best Practices

### 1. PRP Quality

- **Comprehensive Context**: Include all necessary information
- **Clear Validation**: Define success criteria
- **Error Scenarios**: Plan for edge cases
- **Incremental Steps**: Break into manageable chunks

### 2. Execution Strategy

- **Test First**: Always dry-run complex PRPs
- **Monitor Progress**: Use verbose mode for debugging
- **Validate Often**: Don't skip validation gates
- **Document Results**: Keep execution logs

### 3. Integration

- **Version Control**: Track PRPs in git
- **Code Review**: Review generated code
- **Automated Testing**: Include in CI/CD
- **Rollback Plan**: Always have recovery strategy

## Examples

### Simple Feature Implementation

```bash
# Create PRP
context-forge init --prp-only
# Edit PRPs/user-profile-prp.md

# Execute
context-forge run-prp user-profile

# Output:
✓ Loading PRP: user-profile-prp.md
✓ Initializing Claude Code
✓ Executing Step 1: Create user profile model
  ✓ Syntax validation passed
  ✓ Unit tests passed
✓ Executing Step 2: Add profile API endpoints
  ✓ Syntax validation passed
  ✓ Integration tests passed
✓ Executing Step 3: Update UI components
  ✓ All tests passed
✓ PRP execution completed successfully!

Files created: 7
Files modified: 3
Tests added: 12
Coverage: 94%
```

### Complex Multi-Feature Implementation

```bash
# Batch execution with dependencies
context-forge run-prp \
  --batch "auth-system,user-management,permissions,audit-log" \
  --parallel \
  --max-concurrent 2 \
  --output-format json \
  > implementation-result.json
```

### Debugging Failed Execution

```bash
# Verbose mode with step-by-step execution
context-forge run-prp payment-integration \
  --verbose \
  --step-mode \
  --log-file debug.log

# Resume from failure
context-forge run-prp payment-integration --resume --from-step 3
```

## Conclusion

The PRP Runner transforms PRPs from static documents into executable specifications, enabling:

- **Automated Implementation**: From requirements to working code
- **Quality Assurance**: Built-in validation at every step
- **Efficiency**: Reduce implementation time by 70%+
- **Consistency**: Repeatable, high-quality results
- **Integration**: Seamless CI/CD and workflow integration

Combined with Context Forge's slash commands and enhanced templates, it provides a complete AI-assisted development platform.
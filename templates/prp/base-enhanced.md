name: "Base PRP Template v2 - Context-Rich with Validation Loops"
description: |

## Purpose

Template optimized for AI agents to implement features with sufficient context and self-validation capabilities to achieve working code through iterative refinement.

## Core Principles

1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance

---

## Goal

{{goal}}

## Why

{{#each reasons}}

- {{this}}
  {{/each}}

## What

{{description}}

### Success Criteria

{{#each successCriteria}}

- [ ] {{this}}
      {{/each}}

## All Needed Context

### Documentation & References (list all context needed to implement the feature)

```yaml
# MUST READ - Include these in your context window
{{#each documentation}}
- {{type}}: {{url}}
  why: {{reason}}
{{/each}}

# Additional critical docs
{{#if hasAiDocs}}
{{#each aiDocs}}
- docfile: PRPs/ai_docs/{{filename}}
  why: {{reason}}
{{/each}}
{{/if}}
```

### Current Codebase tree (run `tree` in the root of the project)

```bash
{{projectStructure}}
```

### Desired Codebase tree with files to be added

```bash
{{desiredStructure}}
```

### Known Gotchas & Library Quirks

```{{language}}
{{#each gotchas}}
# CRITICAL: {{this}}
{{/each}}

# Framework Version Notes:
{{#each versionNotes}}
# {{this}}
{{/each}}
```

## Implementation Blueprint

### Data Models and Structure

{{#if dataModels}}
{{dataModels}}
{{else}}
Create the core data models to ensure type safety and consistency:

```{{language}}
# TODO: Define models based on requirements
# Follow existing patterns in {{modelPath}}
```

{{/if}}

### List of tasks to be completed in order

```yaml
{{#each tasks}}
Task {{inc @index}}: {{name}}
{{#if action}}{{action}} {{file}}:{{/if}}
{{#each steps}}
  - {{this}}
{{/each}}
{{#if pattern}}
  PATTERN: Follow {{pattern}}
{{/if}}
{{#if critical}}
  CRITICAL: {{critical}}
{{/if}}

{{/each}}
```

### Per task pseudocode

{{#each tasks}}

#### Task {{inc @index}}: {{name}}

```{{../language}}
{{#if pseudocode}}
{{pseudocode}}
{{else}}
# Pseudocode with CRITICAL details
{{#each steps}}
# - {{this}}
{{/each}}
{{/if}}
```

{{/each}}

### Integration Points

```yaml
{{#if database}}
DATABASE:
{{#each database}}
  - {{type}}: "{{command}}"
  {{#if index}}
  - index: "{{index}}"
  {{/if}}
{{/each}}
{{/if}}

{{#if config}}
CONFIG:
{{#each config}}
  - add to: {{file}}
  - pattern: "{{pattern}}"
  {{#if validation}}
  - validate: {{validation}}
  {{/if}}
{{/each}}
{{/if}}

{{#if routes}}
ROUTES:
{{#each routes}}
  - add to: {{file}}
  - pattern: "{{pattern}}"
  - method: {{method}}
  - path: {{path}}
{{/each}}
{{/if}}

{{#if environment}}
ENVIRONMENT:
{{#each environment}}
  - variable: {{name}}
  - type: {{type}}
  - default: {{default}}
  - validation: {{validation}}
{{/each}}
{{/if}}
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
{{#each validationCommands.syntax}}
{{this}}
{{/each}}

# Expected: No errors. If errors, READ the error and fix.
# Common fixes:
{{#each commonFixes.syntax}}
# - {{this}}
{{/each}}
```

### Level 2: Unit Tests

```{{testLanguage}}
# Test cases to implement:
{{#each testCases}}
def test_{{name}}():
    """{{description}}"""
    {{implementation}}

{{/each}}

# Edge cases to cover:
{{#each edgeCases}}
# - {{this}}
{{/each}}
```

```bash
# Run and iterate until passing:
{{#each validationCommands.tests}}
{{this}}
{{/each}}

# If failing: Read error, understand root cause, fix code, re-run
# NEVER mock to pass - fix the actual issue
```

### Level 3: Integration Test

```bash
# Start the service
{{validationCommands.start}}

# Test the endpoints/functionality
{{#each integrationTests}}
{{command}}
# Expected: {{expected}}
{{/each}}

# Check logs if errors
{{#if logPath}}
{{validationCommands.logs}} {{logPath}}
{{/if}}
```

### Level 4: Deployment & Creative Validation

```bash
{{#each validationCommands.deployment}}
# {{description}}
{{command}}
{{/each}}

# Creative validation approaches:
{{#each creativeValidation}}
# {{name}}: {{description}}
{{#if command}}
{{command}}
{{/if}}
{{/each}}

# Examples:
# - MCP server validation for tool integration
# - Load testing with realistic data volumes
# - Security scanning for vulnerabilities
# - Performance profiling for bottlenecks
# - Accessibility testing for UI components
```

## Final Validation Checklist

{{#each checklist}}

- [ ] {{this}}
      {{/each}}
- [ ] All validation gates pass (Levels 1-4)
- [ ] Code follows project conventions
- [ ] Documentation updated if needed
- [ ] No hardcoded values (use config)
- [ ] Error handling is comprehensive
- [ ] Security considerations addressed

---

## Anti-Patterns to Avoid

{{#each antiPatterns}}

- ❌ {{this}}
  {{/each}}
- ❌ Don't skip validation because "it should work"
- ❌ Don't mock tests to pass - fix the real issues
- ❌ Don't ignore failing tests - understand and fix
- ❌ Don't catch all exceptions - be specific
- ❌ Don't create files > 500 lines

## Handlebars Helpers

This template uses custom helpers:

- `inc`: Increments index by 1 for display

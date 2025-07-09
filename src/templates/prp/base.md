# PRP: {{projectName}} - {{featureName}}

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

### Documentation & References

```yaml
# MUST READ - Include these in your context window
{{#each documentation}}
- {{type}}: {{url}}
  why: {{reason}}
{{/each}}
```

### Current Codebase Structure

```
{{projectStructure}}
```

### Desired Codebase Structure

```
{{desiredStructure}}
```

### Known Gotchas & Library Quirks

```{{language}}
{{#each gotchas}}
# CRITICAL: {{this}}
{{/each}}
```

## Implementation Blueprint

### Data Models and Structure

{{#if dataModels}}
{{dataModels}}
{{else}}
Define the core data models to ensure type safety and consistency:

```{{language}}
# TODO: Add data models based on requirements
```
{{/if}}

### Task Breakdown

```yaml
{{#each tasks}}
Task {{@index}}: {{name}}
{{#if file}}
{{action}} {{file}}:
{{/if}}
{{#each steps}}
  - {{this}}
{{/each}}

{{/each}}
```

### Implementation Details

{{#each tasks}}
#### Task {{@index}}: {{name}}

```{{language}}
{{#if pseudocode}}
{{pseudocode}}
{{else}}
# TODO: Add implementation details
{{/if}}
```

{{/each}}

### Integration Points

```yaml
{{#if database}}
DATABASE:
{{#each database}}
  - {{type}}: "{{command}}"
{{/each}}
{{/if}}

{{#if config}}
CONFIG:
{{#each config}}
  - add to: {{file}}
  - pattern: "{{pattern}}"
{{/each}}
{{/if}}

{{#if routes}}
ROUTES:
{{#each routes}}
  - add to: {{file}}
  - pattern: "{{pattern}}"
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
```

### Level 2: Unit Tests

```{{testLanguage}}
# Test cases to implement:
{{#each testCases}}
def test_{{name}}():
    """{{description}}"""
    {{implementation}}
{{/each}}
```

```bash
# Run and iterate until passing:
{{#each validationCommands.tests}}
{{this}}
{{/each}}
```

### Level 3: Integration Test

```bash
# Start the service
{{validationCommands.start}}

# Test the endpoint
{{#each integrationTests}}
{{this}}
{{/each}}

# Expected: {{expectedResult}}
```

### Level 4: Deployment & Creative Validation

```bash
{{#each validationCommands.deployment}}
# {{this}}
{{/each}}

# Custom validation specific to this feature:
{{#each customValidation}}
# - {{this}}
{{/each}}
```

## Final Validation Checklist

{{#each checklist}}
- [ ] {{this}}
{{/each}}

---

## Anti-Patterns to Avoid

{{#each antiPatterns}}
- ❌ {{this}}
{{/each}}
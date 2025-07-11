name: "Task PRP Template - Focused Single-Feature Implementation"
description: |
Lightweight PRP template for specific tasks or bug fixes with clear scope and validation.
Optimized for rapid implementation with built-in success criteria.

---

# Task: {{taskName}}

## Quick Context

**Type**: {{taskType}} <!-- feature | bugfix | refactor | performance | security -->  
**Priority**: {{priority}} <!-- P0 | P1 | P2 | P3 -->  
**Estimated Time**: {{estimatedTime}}  
**Assignee**: {{assignee}}

## Problem Statement

{{problemDescription}}

### Current Behavior

{{currentBehavior}}

### Expected Behavior

{{expectedBehavior}}

### Impact

- **Users Affected**: {{usersAffected}}
- **Severity**: {{severity}}
- **Business Impact**: {{businessImpact}}

## Solution Overview

{{solutionSummary}}

## Implementation Checklist

### Pre-Implementation

- [ ] Understand the existing code structure
- [ ] Identify all files that need modification
- [ ] Review similar implementations in codebase
- [ ] Check for existing tests to understand behavior

### Core Implementation

{{#each implementationSteps}}

#### Step {{inc @index}}: {{title}}

**Files to Modify**:
{{#each files}}

- `{{path}}`: {{change}}
  {{/each}}

**Implementation**:

```{{../language}}
{{code}}
```

**Validation**:
{{#each validations}}

- [ ] {{this}}
      {{/each}}

{{/each}}

### Post-Implementation

- [ ] Run all affected tests
- [ ] Add/update tests for new behavior
- [ ] Update documentation if needed
- [ ] Verify no regressions introduced

## Code Context

### Key Files

{{#each keyFiles}}

- **{{path}}**
  - Purpose: {{purpose}}
  - Key Functions: {{functions}}
  - Dependencies: {{dependencies}}
    {{/each}}

### Patterns to Follow

{{#each patterns}}

- **{{pattern}}**: {{example}}
  {{/each}}

### Anti-Patterns to Avoid

{{#each antiPatterns}}

- ❌ {{this}}
  {{/each}}

## Testing Requirements

### Unit Tests

{{#each unitTests}}

#### Test: {{name}}

```{{testLanguage}}
{{testCode}}
```

{{/each}}

### Integration Tests

{{#each integrationTests}}

- **Scenario**: {{scenario}}
  - Setup: {{setup}}
  - Action: {{action}}
  - Expected: {{expected}}
    {{/each}}

### Manual Testing Steps

{{#each manualTests}}

1. {{this}}
   {{/each}}

## Validation Gates

### Level 1: Syntax Check

```bash
{{syntaxCommand}}
```

- [ ] No syntax errors
- [ ] No linting warnings

### Level 2: Unit Tests

```bash
{{testCommand}}
```

- [ ] All existing tests pass
- [ ] New tests pass
- [ ] Coverage maintained/improved

### Level 3: Integration

```bash
{{integrationCommand}}
```

- [ ] Feature works as expected
- [ ] No regressions in related features
- [ ] Performance acceptable

### Level 4: Verification

{{#each verificationSteps}}

- [ ] {{this}}
      {{/each}}

## Success Criteria

{{#each successCriteria}}

- [ ] {{this}}
      {{/each}}

## Rollback Plan

If issues are discovered after implementation:

{{#each rollbackSteps}}

1. {{this}}
   {{/each}}

## Documentation Updates

{{#if documentationNeeded}}

### Files to Update

{{#each documentationFiles}}

- `{{file}}`: {{update}}
  {{/each}}

### Changelog Entry

```markdown
{{changelogEntry}}
```

{{else}}
No documentation updates required.
{{/if}}

## Related Information

### Related Issues/PRs

{{#each relatedItems}}

- {{type}} #{{id}}: {{title}}
  {{/each}}

### External Resources

{{#each resources}}

- [{{title}}]({{url}})
  {{/each}}

### Notes

{{notes}}

---

## Quick Reference Commands

```bash
# Run tests
{{testCommand}}

# Run linter
{{lintCommand}}

# Start dev server
{{devCommand}}

# Build project
{{buildCommand}}
```

## Definition of Done

- [ ] Code implemented and working
- [ ] All tests passing
- [ ] Code reviewed (self-review minimum)
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] Performance impact assessed
- [ ] Security implications considered
- [ ] Accessibility maintained

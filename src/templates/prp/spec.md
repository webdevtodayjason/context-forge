# Technical Specification: {{featureName}}

## Overview

**Feature**: {{featureName}}
**Version**: {{version}}
**Status**: {{status}}
**Author**: {{author}}
**Last Updated**: {{date}}

## Objective

{{objective}}

## Scope

### In Scope
{{#each inScope}}
- {{this}}
{{/each}}

### Out of Scope
{{#each outOfScope}}
- {{this}}
{{/each}}

## Technical Requirements

### Functional Requirements

{{#each functionalRequirements}}
#### {{id}}: {{title}}

**Description**: {{description}}

**Acceptance Criteria**:
{{#each criteria}}
- {{this}}
{{/each}}

{{/each}}

### Non-Functional Requirements

{{#each nonFunctionalRequirements}}
#### {{category}}

{{#each requirements}}
- **{{name}}**: {{value}}
{{/each}}

{{/each}}

## API Design

### Endpoints

{{#each endpoints}}
#### {{method}} {{path}}

**Description**: {{description}}

**Request**:
```json
{{requestExample}}
```

**Response**:
```json
{{responseExample}}
```

**Status Codes**:
{{#each statusCodes}}
- `{{code}}`: {{description}}
{{/each}}

{{/each}}

## Data Models

### Entities

{{#each entities}}
#### {{name}}

```{{language}}
{{schema}}
```

**Relationships**:
{{#each relationships}}
- {{this}}
{{/each}}

{{/each}}

### Database Schema

```sql
{{databaseSchema}}
```

## Business Logic

{{#each businessRules}}
### {{rule}}

**Condition**: {{condition}}
**Action**: {{action}}
**Validation**: {{validation}}

{{/each}}

## Error Handling

{{#each errorScenarios}}
### {{scenario}}

**Error Code**: `{{code}}`
**Message**: {{message}}
**Recovery**: {{recovery}}

{{/each}}

## Testing Strategy

### Unit Tests

{{#each unitTests}}
- **{{component}}**: {{coverage}}% coverage required
{{/each}}

### Integration Tests

{{#each integrationTests}}
- {{scenario}}
{{/each}}

### Performance Tests

{{#each performanceTests}}
- **{{test}}**: {{criteria}}
{{/each}}

## Security Requirements

{{#each securityRequirements}}
### {{requirement}}

**Implementation**: {{implementation}}
**Validation**: {{validation}}

{{/each}}

## Dependencies

### External Services

{{#each externalDependencies}}
- **{{service}}**: {{purpose}}
{{/each}}

### Libraries

{{#each libraries}}
- **{{name}}** ({{version}}): {{purpose}}
{{/each}}

## Migration Plan

{{#if migrationRequired}}
### Steps

{{#each migrationSteps}}
{{@index}}. {{this}}
{{/each}}

### Rollback Strategy

{{rollbackStrategy}}
{{else}}
No migration required.
{{/if}}

## Documentation Requirements

{{#each documentation}}
- {{this}}
{{/each}}

## Open Questions

{{#each openQuestions}}
- {{this}}
{{/each}}

## Approval

- [ ] Technical Lead
- [ ] Product Owner
- [ ] Security Review
- [ ] Architecture Review
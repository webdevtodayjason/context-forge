# Planning Document: {{projectName}}

## Executive Summary

{{summary}}

## Architecture Overview

```mermaid
{{architectureDiagram}}
```

## System Components

{{#each components}}

### {{name}}

**Purpose**: {{purpose}}

**Key Responsibilities**:
{{#each responsibilities}}

- {{this}}
  {{/each}}

**Dependencies**:
{{#each dependencies}}

- {{this}}
  {{/each}}

{{/each}}

## Data Flow

```mermaid
{{dataFlowDiagram}}
```

## Technical Decisions

{{#each decisions}}

### {{decision}}

**Options Considered**:
{{#each options}}

- {{name}}: {{description}}
  {{/each}}

**Decision**: {{chosen}}

**Rationale**: {{rationale}}

{{/each}}

## Implementation Phases

{{#each phases}}

### Phase {{@index}}: {{name}}

**Duration**: {{duration}}

**Goals**:
{{#each goals}}

- {{this}}
  {{/each}}

**Deliverables**:
{{#each deliverables}}

- {{this}}
  {{/each}}

**Dependencies**: {{#if dependencies}}{{dependencies}}{{else}}None{{/if}}

{{/each}}

## Risk Analysis

{{#each risks}}

### {{risk}}

**Probability**: {{probability}}
**Impact**: {{impact}}
**Mitigation**: {{mitigation}}

{{/each}}

## Security Considerations

{{#each security}}

- {{this}}
  {{/each}}

## Performance Requirements

{{#each performance}}

- **{{metric}}**: {{requirement}}
  {{/each}}

## Monitoring & Observability

{{#each monitoring}}

### {{area}}

**Metrics**:
{{#each metrics}}

- {{this}}
  {{/each}}

**Alerts**:
{{#each alerts}}

- {{this}}
  {{/each}}

{{/each}}

## Future Considerations

{{#each future}}

- {{this}}
  {{/each}}

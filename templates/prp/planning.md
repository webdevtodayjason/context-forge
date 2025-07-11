name: "Planning PRP Template - ULTRATHINK Deep Analysis"
description: |
Template for deep architectural planning and research using the ULTRATHINK methodology.
Designed for complex features requiring comprehensive analysis before implementation.

---

# ULTRATHINK Planning: {{featureName}}

## Executive Summary

{{executiveSummary}}

## Problem Space Analysis

### Core Problem

{{problemStatement}}

### Sub-Problems Identified

{{#each subProblems}}

- **{{name}}**: {{description}}
  - Complexity: {{complexity}}
  - Dependencies: {{dependencies}}
    {{/each}}

### Constraints & Requirements

{{#each constraints}}

- **{{type}}**: {{description}}
  {{/each}}

## Solution Architecture

### High-Level Design

```mermaid
{{architectureDiagram}}
```

### Component Breakdown

{{#each components}}

#### {{name}}

- **Purpose**: {{purpose}}
- **Responsibilities**: {{responsibilities}}
- **Interfaces**: {{interfaces}}
- **Dependencies**: {{dependencies}}
  {{/each}}

### Data Flow

```mermaid
{{dataFlowDiagram}}
```

## Technical Decisions

{{#each decisions}}

### {{title}}

**Options Considered**:
{{#each options}}

- **{{name}}**: {{description}}
  - Pros: {{pros}}
  - Cons: {{cons}}
    {{/each}}

**Decision**: {{decision}}

**Rationale**: {{rationale}}

{{/each}}

## Implementation Strategy

### Phase 1: Foundation ({{phase1Duration}})

{{#each phase1Tasks}}

- [ ] {{this}}
      {{/each}}

### Phase 2: Core Implementation ({{phase2Duration}})

{{#each phase2Tasks}}

- [ ] {{this}}
      {{/each}}

### Phase 3: Integration & Polish ({{phase3Duration}})

{{#each phase3Tasks}}

- [ ] {{this}}
      {{/each}}

## Risk Analysis

{{#each risks}}

### Risk: {{title}}

- **Probability**: {{probability}}
- **Impact**: {{impact}}
- **Mitigation**: {{mitigation}}
- **Contingency**: {{contingency}}
  {{/each}}

## Performance Considerations

### Expected Load

- **Users**: {{expectedUsers}}
- **Requests/sec**: {{expectedRPS}}
- **Data Volume**: {{dataVolume}}

### Optimization Strategies

{{#each optimizations}}

- **{{area}}**: {{strategy}}
  {{/each}}

### Benchmarking Plan

{{#each benchmarks}}

- [ ] {{metric}}: Target {{target}}
      {{/each}}

## Security Analysis

### Attack Vectors

{{#each attackVectors}}

- **{{vector}}**: {{description}}
  - Prevention: {{prevention}}
    {{/each}}

### Security Measures

{{#each securityMeasures}}

- [ ] {{this}}
      {{/each}}

## Testing Strategy

### Unit Testing

- Coverage Target: {{coverageTarget}}%
- Key Areas:
  {{#each unitTestAreas}}
  - {{this}}
    {{/each}}

### Integration Testing

{{#each integrationTests}}

- **{{name}}**: {{description}}
  {{/each}}

### Performance Testing

{{#each performanceTests}}

- **{{scenario}}**: {{description}}
  - Expected: {{expected}}
    {{/each}}

## Monitoring & Observability

### Metrics

{{#each metrics}}

- **{{name}}**: {{description}}
  - Alert Threshold: {{threshold}}
    {{/each}}

### Logging

{{#each loggingPoints}}

- **{{event}}**: {{details}}
  {{/each}}

### Tracing

- Key User Journeys:
  {{#each traces}}
  - {{this}}
    {{/each}}

## Documentation Plan

### API Documentation

- Format: {{apiDocFormat}}
- Location: {{apiDocLocation}}

### User Documentation

{{#each userDocs}}

- **{{type}}**: {{description}}
  {{/each}}

### Developer Documentation

{{#each devDocs}}

- **{{type}}**: {{description}}
  {{/each}}

## Research Artifacts

### External Resources

{{#each externalResources}}

- [{{title}}]({{url}})
  - Key Insight: {{insight}}
    {{/each}}

### Code Examples

{{#each codeExamples}}

#### {{title}}

```{{language}}
{{code}}
```

{{/each}}

### Proof of Concepts

{{#each proofOfConcepts}}

- **{{name}}**: {{description}}
  - Result: {{result}}
  - Code: `{{location}}`
    {{/each}}

## Success Metrics

{{#each successMetrics}}

- **{{metric}}**: {{target}}
  - Measurement: {{howToMeasure}}
    {{/each}}

## Timeline & Milestones

{{#each milestones}}

### {{name}} ({{date}})

- Deliverables:
  {{#each deliverables}}
  - {{this}}
    {{/each}}
- Success Criteria:
  {{#each criteria}}
  - {{this}}
    {{/each}}
    {{/each}}

## Open Questions

{{#each openQuestions}}

- [ ] {{question}}
  - Who to ask: {{whoToAsk}}
  - Deadline: {{deadline}}
    {{/each}}

## Next Steps

1. Review this planning document with stakeholders
2. Get approval on technical decisions
3. Create detailed PRPs for each component
4. Begin Phase 1 implementation

---

## Appendix: Research Notes

{{researchNotes}}

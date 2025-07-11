name: "Technical Specification Template - Detailed Implementation Blueprint"
description: |
Comprehensive technical specification with implementation details, API contracts,
and validation criteria for feature development.

---

# Technical Specification: {{featureName}}

## Document Information

| Field            | Value           |
| ---------------- | --------------- |
| **Feature**      | {{featureName}} |
| **Version**      | {{version}}     |
| **Status**       | {{status}}      |
| **Author**       | {{author}}      |
| **Created**      | {{createdDate}} |
| **Last Updated** | {{lastUpdated}} |
| **Reviewers**    | {{reviewers}}   |

## Executive Summary

{{executiveSummary}}

## Objectives & Success Criteria

### Primary Objectives

{{#each primaryObjectives}}

- **{{id}}**: {{description}}
  - Success Metric: {{metric}}
    {{/each}}

### Secondary Objectives

{{#each secondaryObjectives}}

- {{description}}
  {{/each}}

## Scope Definition

### In Scope

{{#each inScope}}

- ✅ {{this}}
  {{/each}}

### Out of Scope

{{#each outOfScope}}

- ❌ {{this}}
  {{/each}}

### Future Considerations

{{#each futureConsiderations}}

- 🔮 {{this}}
  {{/each}}

## Technical Architecture

### System Context

```mermaid
{{systemContextDiagram}}
```

### Component Architecture

```mermaid
{{componentDiagram}}
```

### Technology Stack

{{#each techStack}}

- **{{layer}}**: {{technology}} ({{version}})
  - Rationale: {{rationale}}
    {{/each}}

## Detailed Requirements

### Functional Requirements

{{#each functionalRequirements}}

#### FR-{{id}}: {{title}}

**Priority**: {{priority}}  
**Description**: {{description}}

**Acceptance Criteria**:
{{#each acceptanceCriteria}}

- [ ] {{this}}
      {{/each}}

**Implementation Notes**:

```{{language}}
{{implementationNotes}}
```

{{/each}}

### Non-Functional Requirements

{{#each nfrs}}

#### {{category}}

| Requirement | Target | Measurement Method |
| ----------- | ------ | ------------------ |

{{#each requirements}}
| {{name}} | {{target}} | {{measurement}} |
{{/each}}

{{/each}}

## API Specification

### RESTful Endpoints

{{#each endpoints}}

#### {{method}} `{{path}}`

**Description**: {{description}}  
**Authentication**: {{authentication}}  
**Rate Limit**: {{rateLimit}}

**Request Headers**:

```http
{{#each headers}}
{{name}}: {{value}}
{{/each}}
```

**Request Body**:

```json
{{requestSchema}}
```

**Response Success ({{successCode}})**:

```json
{{successResponse}}
```

**Response Error**:
{{#each errorResponses}}

- **{{code}}**: {{description}}

```json
{{example}}
```

{{/each}}

**Implementation**:

```{{language}}
{{implementationSnippet}}
```

{{/each}}

### GraphQL Schema

{{#if hasGraphQL}}

```graphql
{{graphqlSchema}}
```

{{/if}}

### WebSocket Events

{{#if hasWebSocket}}
{{#each websocketEvents}}

#### Event: `{{name}}`

**Direction**: {{direction}}  
**Payload**:

```json
{{payload}}
```

{{/each}}
{{/if}}

## Data Architecture

### Domain Models

{{#each domainModels}}

#### {{name}}

```{{language}}
{{definition}}
```

**Business Rules**:
{{#each businessRules}}

- {{this}}
  {{/each}}

**Validations**:
{{#each validations}}

- {{field}}: {{rule}}
  {{/each}}

{{/each}}

### Database Design

#### Schema Definition

```sql
{{databaseSchema}}
```

#### Indexes

{{#each indexes}}

- `{{name}}` on {{table}}({{columns}}) - {{purpose}}
  {{/each}}

#### Data Migration

{{#if hasMigration}}

```sql
{{migrationScript}}
```

**Rollback**:

```sql
{{rollbackScript}}
```

{{/if}}

## Business Logic

### Core Algorithms

{{#each algorithms}}

#### {{name}}

**Purpose**: {{purpose}}

**Pseudocode**:

```
{{pseudocode}}
```

**Complexity**: Time O({{timeComplexity}}), Space O({{spaceComplexity}})

{{/each}}

### State Management

```mermaid
{{stateDiagram}}
```

### Business Rules Engine

{{#each businessRules}}

#### Rule: {{name}}

```{{language}}
if ({{condition}}) {
    {{action}}
} else {
    {{alternativeAction}}
}
```

**Validation**: {{validation}}

{{/each}}

## Integration Specifications

### External Services

{{#each integrations}}

#### {{serviceName}}

**Type**: {{type}}  
**Authentication**: {{authMethod}}  
**Base URL**: `{{baseUrl}}`

**Key Operations**:
{{#each operations}}

- **{{name}}**: {{description}}
  - Endpoint: `{{endpoint}}`
  - Timeout: {{timeout}}ms
  - Retry: {{retryPolicy}}
    {{/each}}

**Error Handling**:
{{#each errorHandling}}

- {{scenario}}: {{strategy}}
  {{/each}}

{{/each}}

### Message Queue Specifications

{{#if hasMessageQueue}}
{{#each queues}}

#### Queue: {{name}}

**Type**: {{type}}  
**Message Format**: {{format}}

**Producer**:

```{{language}}
{{producerCode}}
```

**Consumer**:

```{{language}}
{{consumerCode}}
```

{{/each}}
{{/if}}

## Security Specifications

### Authentication & Authorization

**Authentication Method**: {{authMethod}}

**Authorization Matrix**:
| Role | {{#each resources}}{{name}} | {{/each}}
|------|{{#each resources}}----------|{{/each}}
{{#each roles}}
| {{name}} | {{#each permissions}}{{this}} | {{/each}}
{{/each}}

### Security Controls

{{#each securityControls}}

#### {{control}}

**Implementation**:

```{{language}}
{{implementation}}
```

**Validation**:

- {{validation}}

{{/each}}

### Data Protection

{{#each dataProtection}}

- **{{dataType}}**: {{method}}
  - Implementation: {{implementation}}
    {{/each}}

## Performance Specifications

### Performance Targets

| Metric | Target | Degraded | Unacceptable |
| ------ | ------ | -------- | ------------ |

{{#each performanceTargets}}
| {{metric}} | {{target}} | {{degraded}} | {{unacceptable}} |
{{/each}}

### Optimization Strategies

{{#each optimizations}}

#### {{area}}

**Strategy**: {{strategy}}

**Implementation**:

```{{language}}
{{implementation}}
```

**Expected Impact**: {{impact}}

{{/each}}

### Caching Strategy

{{#each cachingLayers}}

#### {{layer}}

- **TTL**: {{ttl}}
- **Invalidation**: {{invalidation}}
- **Key Pattern**: `{{keyPattern}}`

{{/each}}

## Testing Specifications

### Test Strategy Overview

```mermaid
{{testPyramid}}
```

### Unit Testing

**Coverage Target**: {{coverageTarget}}%

{{#each unitTestSuites}}

#### {{component}}

**Key Test Cases**:
{{#each testCases}}

- {{name}}: {{description}}
  {{/each}}

**Example**:

```{{testLanguage}}
{{exampleTest}}
```

{{/each}}

### Integration Testing

{{#each integrationTests}}

#### {{scenario}}

**Components**: {{components}}  
**Test Data**: {{testData}}

**Steps**:
{{#each steps}}

1. {{this}}
   {{/each}}

**Validation**:
{{#each validations}}

- {{this}}
  {{/each}}

{{/each}}

### Performance Testing

{{#each performanceTests}}

#### {{testName}}

**Type**: {{type}}  
**Load Profile**: {{loadProfile}}  
**Duration**: {{duration}}

**Success Criteria**:
{{#each criteria}}

- {{this}}
  {{/each}}

{{/each}}

### Security Testing

{{#each securityTests}}

- **{{test}}**: {{description}}
  - Tool: {{tool}}
  - Frequency: {{frequency}}
    {{/each}}

## Deployment Specifications

### Deployment Architecture

```mermaid
{{deploymentDiagram}}
```

### Environment Configurations

{{#each environments}}

#### {{name}} Environment

**Infrastructure**:

- Compute: {{compute}}
- Storage: {{storage}}
- Network: {{network}}

**Configuration**:

```yaml
{ { configuration } }
```

{{/each}}

### CI/CD Pipeline

```mermaid
{{pipelineDiagram}}
```

**Pipeline Stages**:
{{#each pipelineStages}}

1. **{{stage}}**: {{description}}
   - Duration: ~{{duration}}
   - Validation: {{validation}}
     {{/each}}

## Monitoring & Observability

### Key Metrics

{{#each metrics}}

#### {{name}}

- **Type**: {{type}}
- **Threshold**: {{threshold}}
- **Alert**: {{alertCondition}}
- **Dashboard**: {{dashboardLink}}

{{/each}}

### Logging Strategy

{{#each logLevels}}

#### {{level}} Logs

**When to Use**: {{whenToUse}}

**Example**:

```{{language}}
{{example}}
```

{{/each}}

### Health Checks

{{#each healthChecks}}

#### {{name}}

- **Endpoint**: `{{endpoint}}`
- **Frequency**: {{frequency}}
- **Timeout**: {{timeout}}ms
- **Success Criteria**: {{criteria}}

{{/each}}

## Risk Assessment

### Technical Risks

{{#each risks}}

#### Risk: {{title}}

| Aspect          | Detail          |
| --------------- | --------------- |
| **Probability** | {{probability}} |
| **Impact**      | {{impact}}      |
| **Detection**   | {{detection}}   |
| **Mitigation**  | {{mitigation}}  |
| **Contingency** | {{contingency}} |
| **Owner**       | {{owner}}       |

{{/each}}

## Dependencies & Constraints

### Technical Dependencies

{{#each dependencies}}

- **{{name}}** ({{version}})
  - Purpose: {{purpose}}
  - Critical: {{critical}}
  - Alternative: {{alternative}}
    {{/each}}

### Constraints

{{#each constraints}}

- **{{type}}**: {{description}}
  - Impact: {{impact}}
    {{/each}}

## Documentation & Training

### Documentation Deliverables

{{#each documentation}}

- [ ] **{{type}}**: {{description}}
  - Audience: {{audience}}
  - Format: {{format}}
    {{/each}}

### Training Requirements

{{#each training}}

- **{{audience}}**: {{topics}}
  - Duration: {{duration}}
  - Format: {{format}}
    {{/each}}

## Approval & Sign-off

### Review Checklist

- [ ] Technical feasibility confirmed
- [ ] Security review completed
- [ ] Performance targets validated
- [ ] Cost estimates approved
- [ ] Risk assessment reviewed
- [ ] Compliance requirements met

### Approvals Required

| Role           | Name             | Date       | Signature  |
| -------------- | ---------------- | ---------- | ---------- |
| Technical Lead | {{techLead}}     | **\_\_\_** | ****\_**** |
| Product Owner  | {{productOwner}} | **\_\_\_** | ****\_**** |
| Security Lead  | {{securityLead}} | **\_\_\_** | ****\_**** |
| Architecture   | {{architect}}    | **\_\_\_** | ****\_**** |

---

## Appendices

### A. Glossary

{{#each glossary}}

- **{{term}}**: {{definition}}
  {{/each}}

### B. References

{{#each references}}

- [{{title}}]({{url}})
  {{/each}}

### C. Change Log

| Version | Date | Author | Changes |
| ------- | ---- | ------ | ------- |

{{#each changelog}}
| {{version}} | {{date}} | {{author}} | {{changes}} |
{{/each}}

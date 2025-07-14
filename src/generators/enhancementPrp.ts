import { ProjectConfig, EnhancementConfig, FeatureRequirement } from '../types';
import { GeneratedFile } from '../adapters/base';

export async function generateEnhancementPRPs(config: ProjectConfig): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  const enhancement = config.enhancementConfig;

  if (!enhancement) {
    return files;
  }

  // Generate overview PRP
  files.push({
    path: 'PRPs/enhancement-overview.md',
    content: generateOverviewPRP(config, enhancement),
    description: 'Enhancement overview PRP',
  });

  // Generate feature-specific PRPs
  for (const feature of enhancement.features) {
    files.push({
      path: `PRPs/feature-${feature.id}.md`,
      content: generateFeaturePRP(config, feature, enhancement),
      description: `PRP for ${feature.name}`,
    });
  }

  // Generate implementation guide
  files.push({
    path: 'PRPs/implementation-guide.md',
    content: generateImplementationGuide(config, enhancement),
    description: 'Detailed implementation guide',
  });

  // Generate technical architecture PRP if complex features exist
  const hasComplexFeatures = enhancement.features.some(
    (f) => f.complexity === 'complex' || f.complexity === 'very-complex'
  );
  if (hasComplexFeatures) {
    files.push({
      path: 'PRPs/technical-architecture.md',
      content: generateTechnicalArchitecturePRP(config, enhancement),
      description: 'Technical architecture for complex features',
    });
  }

  return files;
}

function generateOverviewPRP(config: ProjectConfig, enhancement: EnhancementConfig): string {
  return `# Enhancement Overview PRP

## Context
**Project**: ${config.projectName}  
**Current Stack**: ${enhancement.existingStack.name}  
**Enhancement Strategy**: ${enhancement.implementationStrategy}  
**Total Features**: ${enhancement.features.length}  
**Estimated Duration**: ${enhancement.estimatedDuration}

## Objective
Implement ${enhancement.features.length} new features to enhance the existing ${config.projectName} application while maintaining backward compatibility and system stability.

## Features Summary

${enhancement.features
  .map(
    (feature) => `### ${feature.name}
- **Priority**: ${feature.priority}
- **Complexity**: ${feature.complexity}
- **Category**: ${feature.category}
- **Effort**: ${feature.estimatedEffort}
- **Description**: ${feature.description}`
  )
  .join('\n\n')}

## Implementation Strategy

### Approach: ${enhancement.implementationStrategy}
${
  enhancement.implementationStrategy === 'sequential'
    ? `Features will be implemented one at a time in dependency order. This approach ensures:
- Lower risk of conflicts
- Easier debugging and testing
- Clear progress tracking
- Simplified rollback if needed`
    : enhancement.implementationStrategy === 'parallel'
      ? `Multiple features will be implemented simultaneously where possible. This approach provides:
- Faster overall delivery
- Better resource utilization
- Requires careful coordination
- More complex testing strategy`
      : `A hybrid approach combining sequential and parallel implementation:
- Critical features implemented sequentially
- Independent features developed in parallel
- Balanced risk and speed
- Flexible resource allocation`
}

## Phases Overview

${enhancement.enhancementPhases
  .map(
    (phase, index) => `### Phase ${index + 1}: ${phase.name}
- **Duration**: ${phase.estimatedDuration}
- **Features**: ${phase.features.join(', ')}
- **Tasks**: ${phase.tasks.length}
- **Key Checkpoints**: ${phase.checkpoints.length}`
  )
  .join('\n\n')}

## Success Criteria

1. All ${enhancement.features.length} features implemented and tested
2. No regression in existing functionality
3. Performance benchmarks maintained or improved
4. All acceptance criteria met for each feature
5. Documentation updated for new features
6. Successful deployment to production

## Risk Management

### Key Risks
${enhancement.features
  .flatMap((f) => f.risks)
  .slice(0, 5)
  .map((risk) => `- **${risk.category}**: ${risk.description} (${risk.impact} impact)`)
  .join('\n')}

### Mitigation Strategies
- Comprehensive testing at each phase
- Feature flags for gradual rollout
- Regular code reviews
- Automated validation checkpoints
- Rollback procedures for each phase

## Validation Strategy

${Object.entries(enhancement.validationStrategy)
  .filter(([_, enabled]) => enabled)
  .map(([strategy]) => `- ${strategy.replace(/([A-Z])/g, ' $1').trim()}`)
  .join('\n')}

## Dependencies

### Feature Dependencies
${enhancement.features
  .filter((f) => f.dependencies.length > 0)
  .map((f) => `- ${f.name} depends on: ${f.dependencies.join(', ')}`)
  .join('\n')}

### Technical Dependencies
- Existing ${enhancement.existingStack.name} infrastructure
- Current authentication and authorization system
- Existing database schema and migrations
- Current API structure and conventions

## Next Steps

1. Review and approve enhancement plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Track progress using /enhancement-status command
5. Validate each checkpoint before proceeding
`;
}

function generateFeaturePRP(
  config: ProjectConfig,
  feature: FeatureRequirement,
  enhancement: EnhancementConfig
): string {
  const phase = enhancement.enhancementPhases.find((p) => p.features.includes(feature.id));
  const tasks = phase?.tasks.filter((t) => t.id.startsWith(feature.id)) || [];

  return `# Feature PRP: ${feature.name}

## Feature Overview
**ID**: ${feature.id}  
**Category**: ${feature.category}  
**Priority**: ${feature.priority}  
**Complexity**: ${feature.complexity}  
**Estimated Effort**: ${feature.estimatedEffort}

## Description
${feature.description}

## Acceptance Criteria
${feature.acceptanceCriteria.map((criteria, index) => `${index + 1}. ${criteria}`).join('\n')}

## Technical Requirements
${feature.technicalRequirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

## Integration Points
${
  feature.integrationPoints.length > 0
    ? feature.integrationPoints
        .map(
          (point) => `### ${point.component} (${point.type})
**Description**: ${point.description}

**Required Changes**:
${point.requiredChanges.map((change) => `- ${change}`).join('\n')}

**Testing Strategy**: ${point.testingStrategy}`
        )
        .join('\n\n')
    : 'No specific integration points identified.'
}

## Implementation Tasks

${tasks
  .map(
    (task) => `### ${task.name}
**Type**: ${task.type}  
**Complexity**: ${task.complexity}  
**Estimated Hours**: ${task.estimatedHours}

**Subtasks**:
${task.subtasks.map((subtask) => `- ${subtask}`).join('\n')}

**Validation Steps**:
${task.validationSteps.map((step) => `- ${step}`).join('\n')}

${task.aiContext ? `**AI Context**: ${task.aiContext}` : ''}`
  )
  .join('\n\n')}

## Risks and Mitigation

${
  feature.risks.length > 0
    ? feature.risks
        .map(
          (risk) => `### ${risk.category} Risk
**Description**: ${risk.description}  
**Impact**: ${risk.impact}  
**Probability**: ${risk.probability}  
**Mitigation**: ${risk.mitigation}`
        )
        .join('\n\n')
    : 'No significant risks identified.'
}

## Implementation Approach

${getImplementationApproach(feature)}

## Testing Strategy

### Unit Tests
- Test all new functions and methods
- Achieve minimum 80% code coverage
- Mock external dependencies

### Integration Tests
${feature.integrationPoints.map((point) => `- Test ${point.component} integration`).join('\n')}
- Verify data flow between components
- Test error handling scenarios

### Acceptance Tests
${feature.acceptanceCriteria.map((criteria) => `- Verify: ${criteria}`).join('\n')}

## Documentation Requirements

1. Update API documentation for new endpoints
2. Add usage examples for new features
3. Update configuration documentation
4. Create user guide for feature usage
5. Document any breaking changes

## Dependencies

${
  feature.dependencies.length > 0
    ? `This feature depends on:
${feature.dependencies.map((dep) => `- ${dep}`).join('\n')}`
    : 'This feature has no dependencies on other features.'
}

## Definition of Done

- [ ] All implementation tasks completed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Feature deployed to staging
- [ ] Acceptance criteria verified
- [ ] Performance impact assessed
- [ ] Security review completed (if applicable)
- [ ] Feature merged to main branch

## Notes for AI Assistant

When implementing this feature:
1. Follow existing code patterns in the ${config.projectName} project
2. Use the established ${enhancement.existingStack.name} conventions
3. Ensure backward compatibility with existing features
4. Add comprehensive error handling
5. Include detailed logging for debugging
6. Consider performance implications
7. Follow the project's coding standards
`;
}

function generateImplementationGuide(
  config: ProjectConfig,
  enhancement: EnhancementConfig
): string {
  return `# Implementation Guide

## Overview
This guide provides detailed instructions for implementing the ${enhancement.features.length} features planned for ${config.projectName}.

## Development Environment Setup

### Prerequisites
- ${enhancement.existingStack.name} development environment
- Access to project repository
- Required development tools installed

### Setup Steps
1. Clone or update the repository
2. Install dependencies
3. Configure environment variables
4. Verify development environment
5. Run existing tests to ensure baseline

## Code Organization

### Directory Structure
\`\`\`
${generateDirectoryStructure(enhancement)}
\`\`\`

### Naming Conventions
- Features: \`feature-{id}-{name}\`
- Components: PascalCase for classes/components
- Functions: camelCase for functions/methods
- Files: kebab-case for file names
- Tests: \`{name}.test.{ext}\` or \`{name}.spec.{ext}\`

## Implementation Patterns

### API Endpoints
\`\`\`typescript
// Example API endpoint pattern
router.post('/api/v1/feature-name', 
  authenticate,
  validate(featureSchema),
  async (req, res) => {
    try {
      const result = await featureService.process(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(error, res);
    }
  }
);
\`\`\`

### Service Layer
\`\`\`typescript
// Example service pattern
export class FeatureService {
  async process(data: FeatureInput): Promise<FeatureOutput> {
    // Validate business rules
    this.validateBusinessRules(data);
    
    // Process data
    const processed = await this.processData(data);
    
    // Update database
    const result = await this.repository.save(processed);
    
    // Emit events if needed
    this.eventEmitter.emit('feature.processed', result);
    
    return result;
  }
}
\`\`\`

### Database Migrations
\`\`\`sql
-- Example migration pattern
CREATE TABLE IF NOT EXISTS feature_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_name ON feature_table(name);
\`\`\`

## Testing Guidelines

### Test Structure
\`\`\`typescript
describe('FeatureName', () => {
  describe('ComponentName', () => {
    beforeEach(() => {
      // Setup
    });

    it('should handle normal case', async () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = await component.process(input);
      
      // Assert
      expect(result).toMatchExpectedOutput();
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
\`\`\`

### Test Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical paths
- All edge cases tested
- Integration tests for all API endpoints

## Phase Implementation

${enhancement.enhancementPhases
  .map(
    (phase, index) => `### Phase ${index + 1}: ${phase.name}

**Timeline**: ${phase.estimatedDuration}

**Setup**:
1. Create feature branch: \`git checkout -b enhancement-${phase.id}\`
2. Set up phase-specific configuration
3. Review phase requirements

**Implementation Order**:
${phase.tasks
  .slice(0, 5)
  .map((task, i) => `${i + 1}. ${task.name}`)
  .join('\n')}${phase.tasks.length > 5 ? `\n... and ${phase.tasks.length - 5} more tasks` : ''}

**Validation**:
${phase.validationCriteria.map((criteria) => `- ${criteria}`).join('\n')}

**Completion Checklist**:
- [ ] All tasks completed
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Checkpoint validated`
  )
  .join('\n\n')}

## Integration Guidelines

### API Integration
- Use existing authentication middleware
- Follow current API versioning scheme
- Implement proper error responses
- Add rate limiting where appropriate

### Database Integration
- Use existing connection pool
- Follow current transaction patterns
- Implement proper indexing
- Consider query performance

### UI Integration
- Follow existing component patterns
- Use current styling system
- Maintain responsive design
- Ensure accessibility compliance

## Deployment Process

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Code coverage meets requirements
- [ ] Performance benchmarks acceptable
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Database migrations tested

### Deployment Steps
1. Merge feature branch to staging
2. Run automated tests on staging
3. Perform manual testing
4. Get stakeholder approval
5. Deploy to production
6. Monitor for issues
7. Run smoke tests

## Monitoring and Validation

### Metrics to Track
- Feature usage statistics
- Performance metrics
- Error rates
- User feedback
- System resource usage

### Success Indicators
- All acceptance criteria met
- No increase in error rates
- Performance within acceptable range
- Positive user feedback
- No critical issues reported

## Troubleshooting

### Common Issues
1. **Integration conflicts**: Check dependency versions
2. **Performance degradation**: Review database queries
3. **Test failures**: Verify test data and mocks
4. **Build errors**: Check environment configuration

### Debug Commands
\`\`\`bash
# Check logs
npm run logs

# Run specific tests
npm test -- --grep "FeatureName"

# Check database state
npm run db:status

# Verify environment
npm run env:check
\`\`\`

## Resources

- [Project Documentation](../README.md)
- [API Documentation](../docs/api.md)
- [Database Schema](../docs/database.md)
- [Testing Guide](../docs/testing.md)
- [Deployment Guide](../docs/deployment.md)
`;
}

function generateTechnicalArchitecturePRP(
  config: ProjectConfig,
  enhancement: EnhancementConfig
): string {
  const complexFeatures = enhancement.features.filter(
    (f) => f.complexity === 'complex' || f.complexity === 'very-complex'
  );

  return `# Technical Architecture PRP

## Overview
This document outlines the technical architecture for implementing complex features in the ${config.projectName} enhancement project.

## Complex Features

${complexFeatures
  .map(
    (feature) => `### ${feature.name}
**Complexity**: ${feature.complexity}  
**Category**: ${feature.category}  
**Technical Challenges**: ${identifyTechnicalChallenges(feature).join(', ')}`
  )
  .join('\n\n')}

## Architecture Principles

### Design Patterns
1. **Separation of Concerns**: Clear boundaries between layers
2. **DRY (Don't Repeat Yourself)**: Reusable components and services
3. **SOLID Principles**: Maintainable and extensible code
4. **Dependency Injection**: Loose coupling between components
5. **Event-Driven Architecture**: For complex workflows

### Performance Considerations
- Implement caching for frequently accessed data
- Use database query optimization
- Implement pagination for large datasets
- Consider async processing for heavy operations
- Monitor and optimize critical paths

### Security Architecture
- Input validation at all entry points
- Authentication and authorization checks
- Data encryption for sensitive information
- Audit logging for critical operations
- Regular security scans and updates

## System Architecture

### High-Level Architecture
\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Apps   │────▶│   API Gateway   │────▶│   Application   │
│  (Web/Mobile)   │     │  (Auth/Routes)  │     │    Services     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External APIs  │◀────│   Integration   │◀────│    Database     │
│   (3rd Party)   │     │    Services     │     │   (Primary)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
\`\`\`

### Component Architecture

${complexFeatures
  .map(
    (feature) => `#### ${feature.name} Architecture
\`\`\`
${generateFeatureArchitecture(feature)}
\`\`\`

**Key Components**:
${identifyKeyComponents(feature)
  .map((comp) => `- **${comp.name}**: ${comp.description}`)
  .join('\n')}`
  )
  .join('\n\n')}

## Data Architecture

### Data Flow
1. Client request → API Gateway
2. Authentication & Authorization
3. Request validation
4. Business logic processing
5. Data persistence/retrieval
6. Response transformation
7. Client response

### Database Design Considerations
${complexFeatures
  .filter(
    (f) => f.category === 'database' || f.integrationPoints.some((ip) => ip.type === 'database')
  )
  .map(
    (feature) => `#### ${feature.name} Data Model
- Tables/Collections needed
- Relationships and constraints
- Indexing strategy
- Data migration approach`
  )
  .join('\n\n')}

## Integration Architecture

### API Integration Patterns
- **Adapter Pattern**: For third-party API integration
- **Circuit Breaker**: For fault tolerance
- **Retry Logic**: For transient failures
- **Rate Limiting**: For API protection

### Event-Driven Integration
\`\`\`typescript
// Event pattern for complex features
interface FeatureEvent {
  type: string;
  payload: any;
  timestamp: Date;
  metadata: EventMetadata;
}

// Event handler pattern
class FeatureEventHandler {
  async handle(event: FeatureEvent): Promise<void> {
    // Process event
    // Update state
    // Trigger side effects
  }
}
\`\`\`

## Scalability Design

### Horizontal Scaling
- Stateless service design
- Load balancer configuration
- Session management strategy
- Database connection pooling

### Caching Strategy
- **Memory Cache**: For frequently accessed data
- **Redis Cache**: For distributed caching
- **CDN**: For static assets
- **Database Query Cache**: For expensive queries

## Error Handling Architecture

### Error Categories
1. **Validation Errors**: 400 Bad Request
2. **Authentication Errors**: 401 Unauthorized
3. **Authorization Errors**: 403 Forbidden
4. **Not Found Errors**: 404 Not Found
5. **Server Errors**: 500 Internal Server Error

### Error Response Format
\`\`\`json
{
  "error": {
    "code": "FEATURE_ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific field error"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "traceId": "unique-trace-id"
  }
}
\`\`\`

## Monitoring Architecture

### Metrics Collection
- Application Performance Monitoring (APM)
- Custom business metrics
- Error rate tracking
- Resource utilization

### Logging Strategy
\`\`\`typescript
// Structured logging pattern
logger.info('Feature action completed', {
  feature: 'feature-name',
  action: 'action-type',
  userId: user.id,
  duration: executionTime,
  metadata: additionalInfo
});
\`\`\`

## Deployment Architecture

### Containerization
- Docker containers for services
- Docker Compose for local development
- Kubernetes for production orchestration

### CI/CD Pipeline
1. Code commit triggers pipeline
2. Run automated tests
3. Build Docker images
4. Deploy to staging
5. Run integration tests
6. Deploy to production
7. Run smoke tests

## Technology Stack Decisions

### Core Technologies
- **Runtime**: ${enhancement.existingStack.name}
- **Database**: Existing database system
- **Caching**: Redis (if applicable)
- **Message Queue**: RabbitMQ/Kafka (for async processing)
- **Monitoring**: Application-specific tools

### Library Choices
${complexFeatures
  .flatMap((f) => f.technicalRequirements)
  .filter((req) => req.includes('library') || req.includes('package'))
  .map((req) => `- ${req}`)
  .join('\n')}

## Performance Requirements

### Response Time Targets
- API endpoints: < 200ms (p95)
- Database queries: < 100ms (p95)
- Page load time: < 2 seconds
- Background jobs: Based on complexity

### Throughput Requirements
- Concurrent users: Based on current + 50% growth
- Requests per second: Current baseline + new features
- Data processing: Based on feature requirements

## Security Requirements

### Authentication & Authorization
- Use existing auth system
- Implement feature-specific permissions
- Regular token rotation
- Session management

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement field-level encryption where needed
- Regular security audits

## Conclusion

This architecture provides a scalable, maintainable foundation for implementing complex features while maintaining system stability and performance. Regular reviews and updates should be conducted as implementation progresses.
`;
}

function getImplementationApproach(feature: FeatureRequirement): string {
  const approaches = {
    api: `1. Design RESTful endpoints following existing patterns
2. Implement request/response schemas
3. Create service layer for business logic
4. Add comprehensive error handling
5. Implement rate limiting if needed
6. Add API documentation`,

    ui: `1. Create reusable components
2. Implement responsive design
3. Add accessibility features
4. Integrate with state management
5. Add loading and error states
6. Implement user feedback mechanisms`,

    database: `1. Design optimal schema
2. Create migration scripts
3. Implement data access layer
4. Add proper indexing
5. Implement data validation
6. Plan for data backups`,

    integration: `1. Research API documentation
2. Implement authentication flow
3. Create service wrapper
4. Add error handling and retries
5. Implement data transformation
6. Add monitoring and logging`,

    infrastructure: `1. Assess current infrastructure
2. Plan incremental changes
3. Implement with rollback capability
4. Add monitoring and alerts
5. Document configuration
6. Test disaster recovery`,

    analytics: `1. Define metrics to track
2. Implement data collection
3. Create dashboards
4. Set up alerts
5. Document insights process
6. Plan for data retention`,

    security: `1. Conduct security assessment
2. Implement authentication
3. Add authorization checks
4. Encrypt sensitive data
5. Add audit logging
6. Plan security testing`,
  };

  return (
    approaches[feature.category] ||
    `1. Analyze requirements
2. Design solution
3. Implement incrementally
4. Test thoroughly
5. Document changes
6. Deploy carefully`
  );
}

function generateDirectoryStructure(enhancement: EnhancementConfig): string {
  const structure = [
    `project-root/
├── src/
│   ├── features/`,
  ];

  // Add feature directories
  enhancement.features.forEach((feature) => {
    structure.push(`│   │   ├── ${feature.id}/`);

    switch (feature.category) {
      case 'api':
        structure.push(`│   │   │   ├── routes/`);
        structure.push(`│   │   │   ├── controllers/`);
        structure.push(`│   │   │   └── services/`);
        break;
      case 'ui':
        structure.push(`│   │   │   ├── components/`);
        structure.push(`│   │   │   ├── hooks/`);
        structure.push(`│   │   │   └── styles/`);
        break;
      case 'database':
        structure.push(`│   │   │   ├── models/`);
        structure.push(`│   │   │   ├── migrations/`);
        structure.push(`│   │   │   └── repositories/`);
        break;
      default:
        structure.push(`│   │   │   └── implementation/`);
    }
  });

  structure.push(`│   ├── shared/
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── features/
│   └── api/
└── scripts/
    ├── migrations/
    └── deployment/`);

  return structure.join('\n');
}

function identifyTechnicalChallenges(feature: FeatureRequirement): string[] {
  const challenges: string[] = [];

  if (feature.complexity === 'very-complex') {
    challenges.push('High algorithmic complexity');
  }

  if (feature.integrationPoints.length > 3) {
    challenges.push('Multiple integration points');
  }

  if (feature.category === 'database') {
    challenges.push('Data migration complexity');
  }

  if (feature.risks.some((r) => r.category === 'performance')) {
    challenges.push('Performance optimization required');
  }

  if (feature.risks.some((r) => r.category === 'security')) {
    challenges.push('Security considerations');
  }

  if (challenges.length === 0) {
    challenges.push('Standard implementation complexity');
  }

  return challenges;
}

function identifyKeyComponents(
  feature: FeatureRequirement
): Array<{ name: string; description: string }> {
  const components: Array<{ name: string; description: string }> = [];

  switch (feature.category) {
    case 'api':
      components.push(
        { name: 'Route Handler', description: 'Processes HTTP requests and responses' },
        { name: 'Service Layer', description: 'Contains business logic' },
        { name: 'Validation Layer', description: 'Validates input data' },
        { name: 'Data Access Layer', description: 'Manages database operations' }
      );
      break;

    case 'ui':
      components.push(
        { name: 'UI Components', description: 'Reusable visual elements' },
        { name: 'State Management', description: 'Manages component state' },
        { name: 'Event Handlers', description: 'Processes user interactions' },
        { name: 'API Integration', description: 'Communicates with backend' }
      );
      break;

    case 'database':
      components.push(
        { name: 'Schema Design', description: 'Database structure definition' },
        { name: 'Migration Scripts', description: 'Database change management' },
        { name: 'ORM Models', description: 'Object-relational mapping' },
        { name: 'Query Optimization', description: 'Performance tuning' }
      );
      break;

    case 'integration':
      components.push(
        { name: 'API Client', description: 'External service communication' },
        { name: 'Data Mapper', description: 'Transforms data formats' },
        { name: 'Error Handler', description: 'Manages integration failures' },
        { name: 'Rate Limiter', description: 'Controls API usage' }
      );
      break;

    default:
      components.push(
        { name: 'Core Logic', description: 'Main feature implementation' },
        { name: 'Interface Layer', description: 'External communication' },
        { name: 'Data Layer', description: 'Data management' }
      );
  }

  return components;
}

function generateFeatureArchitecture(feature: FeatureRequirement): string {
  const architectures = {
    api: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Routes    │────▶│  Controller │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Database   │◀────│ Repository  │◀────│   Service   │
└─────────────┘     └─────────────┘     └─────────────┘`,

    ui: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│ Components  │────▶│    State    │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Events    │     │   Hooks     │     │     API     │
└─────────────┘     └─────────────┘     └─────────────┘`,

    database: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    App      │────▶│    ORM      │────▶│   Models    │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cache     │◀────│    Query    │◀────│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘`,

    integration: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    App      │────▶│   Adapter   │────▶│ API Client  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cache     │     │  Transform  │     │ External API│
└─────────────┘     └─────────────┘     └─────────────┘`,

    infrastructure: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    App      │────▶│   Config    │────▶│   Services  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Monitoring │     │   Logging   │     │Infrastructure│
└─────────────┘     └─────────────┘     └─────────────┘`,

    analytics: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Events    │────▶│  Collector  │────▶│  Processor  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │◀────│  Analytics  │◀────│   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘`,

    security: `┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│    Auth     │────▶│ Middleware  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Session   │     │  Validator  │     │   Handler   │
└─────────────┘     └─────────────┘     └─────────────┘`,
  };

  return architectures[feature.category] || architectures.api;
}

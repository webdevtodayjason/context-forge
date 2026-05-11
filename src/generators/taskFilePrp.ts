import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import { ParsedTaskFile, TaskFilePhase, TaskFileTask } from '../services/taskFileAnalyzer';
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';

export interface TaskFilePRPOptions {
  generateOverview: boolean;
  generatePhasesPRPs: boolean;
  generateFeaturePRPs: boolean;
  generateImplementationGuide: boolean;
  includeAIContext: boolean;
}

/**
 * Generator for creating PRPs from parsed task files like HoLaCe's implementation tasks
 */
export class TaskFilePRPGenerator {
  /**
   * Generate comprehensive PRPs from a parsed task file
   */
  async generatePRPs(
    config: ProjectConfig,
    parsedTaskFile: ParsedTaskFile,
    options: TaskFilePRPOptions = {
      generateOverview: true,
      generatePhasesPRPs: true,
      generateFeaturePRPs: true,
      generateImplementationGuide: true,
      includeAIContext: true,
    }
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    if (options.generateOverview) {
      files.push(await this.generateOverviewPRP(parsedTaskFile));
    }

    if (options.generatePhasesPRPs) {
      for (const phase of parsedTaskFile.phases) {
        files.push(await this.generatePhasePRP(parsedTaskFile, phase, options.includeAIContext));
      }
    }

    if (options.generateFeaturePRPs) {
      const featurePRPs = await this.generateFeaturePRPs(parsedTaskFile, options.includeAIContext);
      files.push(...featurePRPs);
    }

    if (options.generateImplementationGuide) {
      files.push(await this.generateImplementationGuide(parsedTaskFile));
    }

    return files;
  }

  /**
   * Generate main overview PRP
   */
  private async generateOverviewPRP(parsedTaskFile: ParsedTaskFile): Promise<GeneratedFile> {
    const content = `# ${parsedTaskFile.projectName} - Implementation Overview PRP

## Project Context
**Project**: ${parsedTaskFile.projectName}  
**Total Tasks**: ${parsedTaskFile.totalTasks}  
**Estimated Duration**: ${parsedTaskFile.estimatedDuration}  
**Implementation Phases**: ${parsedTaskFile.phases.length}

## Executive Summary
${parsedTaskFile.overview}

## Implementation Strategy

This PRP outlines the complete implementation approach for ${parsedTaskFile.projectName} based on the comprehensive task analysis. The project is structured in ${parsedTaskFile.phases.length} phases with clear milestones and validation checkpoints.

## Phase Overview

${parsedTaskFile.phases
  .map(
    (phase, index) => `### Phase ${index + 1}: ${phase.name}
**Duration**: ${phase.duration}  
**Task Count**: ${phase.tasks.length}  
**Priority Tasks**: ${phase.tasks.filter((t) => t.priority === 'Critical').length} Critical, ${phase.tasks.filter((t) => t.priority === 'High').length} High

${phase.description}

**Key Deliverables**:
${phase.tasks
  .slice(0, 5)
  .map((task) => `- ${task.name}`)
  .join(
    '\n'
  )}${phase.tasks.length > 5 ? `\n- ... and ${phase.tasks.length - 5} additional tasks` : ''}`
  )
  .join('\n\n')}

## Risk Management

### Key Risks Identified
${parsedTaskFile.riskManagement.keyRisks.map((risk) => `- ${risk}`).join('\n')}

### Mitigation Strategies
${parsedTaskFile.riskManagement.mitigationStrategies.map((strategy) => `- ${strategy}`).join('\n')}

## Resource Requirements

### Team Structure
${parsedTaskFile.resourceRequirements.teamStructure.map((member) => `- ${member}`).join('\n')}

### Technology Infrastructure
${parsedTaskFile.resourceRequirements.technology.map((tech) => `- ${tech}`).join('\n')}

## Success Metrics

${parsedTaskFile.successMetrics.map((metric) => `- ${metric}`).join('\n')}

## Implementation Approach

1. **Sequential Phase Execution**: Each phase must complete before the next begins
2. **Checkpoint Validation**: Mandatory validation at the end of each phase
3. **Risk Monitoring**: Continuous monitoring of identified risks
4. **Progress Tracking**: Regular progress reports using Context Forge slash commands
5. **Quality Gates**: All acceptance criteria must be met before phase completion

## Next Steps

1. **Phase 1 Setup**: Begin with ${parsedTaskFile.phases[0]?.name || 'initial phase'}
2. **Resource Allocation**: Assign team members to specific task categories
3. **Environment Preparation**: Set up development and staging environments
4. **Monitoring Setup**: Configure progress tracking and risk monitoring
5. **Stakeholder Communication**: Establish regular progress reporting

## Context Forge Integration

This project has been analyzed and structured for optimal Context Forge integration:

- **Enhanced PRP Generation**: AI-powered PRPs for complex tasks
- **Progress Tracking**: Use \`/progress\` to track implementation status
- **Phase Management**: Use \`/phase-status\` to monitor current phase
- **Risk Monitoring**: Use \`/risks\` to track and update risk status
- **Team Coordination**: Use \`/team-status\` for team progress updates

## Validation Commands

\`\`\`bash
# Run comprehensive validation
npm test

# Check code quality
npm run lint

# Build verification
npm run build

# Integration tests
npm run test:integration

# E2E validation
npm run test:e2e
\`\`\`

## Documentation

- [Phase 1 PRP](./phase-1-prp.md) - Detailed Phase 1 implementation guide
- [Implementation Guide](./implementation-guide.md) - Comprehensive implementation documentation
- [Risk Management Plan](./risk-management.md) - Detailed risk monitoring and mitigation

---

*Generated by Context Forge with Task File Analysis*  
*Last Updated: ${new Date().toISOString()}*
`;

    return {
      path: 'PRPs/implementation-overview.md',
      content,
      description: 'Complete implementation overview PRP',
    };
  }

  /**
   * Generate phase-specific PRPs
   */
  private async generatePhasePRP(
    parsedTaskFile: ParsedTaskFile,
    phase: TaskFilePhase,
    includeAIContext: boolean
  ): Promise<GeneratedFile> {
    const phaseNumber = parsedTaskFile.phases.indexOf(phase) + 1;
    const tasksByCategory = this.groupTasksByCategory(phase.tasks);

    const content = `# ${parsedTaskFile.projectName} - Phase ${phaseNumber} PRP: ${phase.name}

## Phase Context
**Project**: ${parsedTaskFile.projectName}  
**Phase**: ${phaseNumber} of ${parsedTaskFile.phases.length}  
**Duration**: ${phase.duration}  
**Task Count**: ${phase.tasks.length}

## Phase Description
${phase.description}

## Implementation Strategy

This phase focuses on ${phase.name.toLowerCase()} and represents a critical milestone in the ${parsedTaskFile.projectName} implementation. The phase includes ${phase.tasks.length} tasks across ${Object.keys(tasksByCategory).length} categories.

## Task Categories

${Object.entries(tasksByCategory)
  .map(
    ([category, tasks]) => `### ${category} (${tasks.length} tasks)

${tasks
  .map(
    (task) => `#### ${task.name}
**Priority**: ${task.priority}  
**Effort**: ${task.effort}  
**ID**: ${task.id}

${task.description}

**Acceptance Criteria**:
${task.acceptanceCriteria.length > 0 ? task.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n') : '- Complete task as specified'}

**Technical Requirements**:
${task.technicalRequirements.length > 0 ? task.technicalRequirements.map((req) => `- ${req}`).join('\n') : '- Follow project standards'}

${
  task.risks.length > 0
    ? `**Risks**:
${task.risks.map((risk) => `- **${risk.type}**: ${risk.description} → *${risk.mitigation}*`).join('\n')}`
    : ''
}`
  )
  .join('\n\n')}`
  )
  .join('\n\n')}

## Implementation Order

The tasks in this phase should be implemented in the following order based on dependencies:

${this.generateTaskOrder(phase.tasks)
  .map(
    (task, index) => `${index + 1}. **${task.name}** (${task.effort}) - ${task.priority} priority`
  )
  .join('\n')}

## Validation Checkpoints

${this.generateValidationCheckpoints(phase)
  .map((checkpoint) => `- ${checkpoint}`)
  .join('\n')}

## Phase Success Criteria

${phase.successCriteria.map((criteria) => `- ${criteria}`).join('\n')}

## Dependencies

### Prerequisites
${this.extractPhasePrerequisites(phase, parsedTaskFile)
  .map((prereq) => `- ${prereq}`)
  .join('\n')}

### External Dependencies
${this.extractExternalDependencies(phase.tasks)
  .map((dep) => `- ${dep}`)
  .join('\n')}

## Testing Strategy

### Unit Testing
- Test all new functions and components
- Achieve minimum 80% code coverage for phase deliverables
- Mock external dependencies and services

### Integration Testing
- Test interactions between phase components
- Validate data flow and API integrations
- Test error handling and recovery scenarios

### Acceptance Testing
- Validate all acceptance criteria are met
- Perform user story validation
- Test edge cases and error conditions

## Risk Management

### Phase-Specific Risks
${this.extractPhaseRisks(phase.tasks)
  .map(
    (risk) => `- **${risk.type}**: ${risk.description}
  - *Mitigation*: ${risk.mitigation}`
  )
  .join('\n\n')}

### Risk Monitoring
- Daily risk assessment during implementation
- Escalation procedures for high-impact risks
- Regular risk register updates

## Resource Allocation

### Required Skills
${this.identifyRequiredSkills(phase.tasks)
  .map((skill) => `- ${skill}`)
  .join('\n')}

### Estimated Effort Distribution
${this.calculateEffortDistribution(tasksByCategory)
  .map(([category, effort]) => `- **${category}**: ${effort}`)
  .join('\n')}

## Tools and Technologies

### Development Tools
- Primary IDE/Editor with project extensions
- Version control (Git) with feature branch strategy
- Package manager with dependency management
- Testing frameworks for unit and integration tests

### Monitoring and Validation
- Code quality tools (linting, formatting)
- Automated testing pipeline
- Performance monitoring tools
- Security scanning tools

${
  includeAIContext
    ? `## AI Assistant Context

When implementing this phase, the AI assistant should:

1. **Follow Established Patterns**: Use existing code patterns from the ${parsedTaskFile.projectName} project
2. **Maintain Consistency**: Ensure consistent naming, structure, and approaches
3. **Implement Incrementally**: Break large tasks into smaller, testable pieces
4. **Validate Continuously**: Run tests after each significant change
5. **Document Changes**: Update relevant documentation as implementation progresses

### AI-Specific Guidelines
- Always validate prerequisites before starting implementation
- Use project-specific error handling patterns
- Follow the existing authentication and authorization patterns
- Maintain database consistency and referential integrity
- Add comprehensive logging for debugging and monitoring

### Context Awareness
- This is Phase ${phaseNumber} of ${parsedTaskFile.phases.length} in the overall implementation
- Previous phases may have established patterns to follow
- Consider impact on subsequent phases when making design decisions
- Maintain backward compatibility with existing functionality`
    : ''
}

## Phase Completion Checklist

- [ ] All ${phase.tasks.length} tasks implemented and tested
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] Code review completed for all changes
- [ ] Documentation updated
- [ ] Performance benchmarks meet requirements
- [ ] Security review completed (if applicable)
- [ ] Deployment to staging successful
- [ ] Acceptance criteria validated
- [ ] Phase deliverables approved by stakeholders

## Next Phase Preparation

After completing this phase:

1. **Validate All Deliverables**: Ensure all phase deliverables meet quality standards
2. **Update Documentation**: Update project documentation with phase outcomes
3. **Risk Assessment**: Reassess risks for the next phase
4. **Team Retrospective**: Conduct lessons learned session
5. **Next Phase Planning**: Finalize planning for the subsequent phase

---

*Generated by Context Forge Task File Analysis*  
*Phase ${phaseNumber}: ${phase.name}*  
*Generated: ${new Date().toISOString()}*
`;

    return {
      path: `PRPs/phase-${phaseNumber}-prp.md`,
      content,
      description: `Phase ${phaseNumber} implementation PRP: ${phase.name}`,
    };
  }

  /**
   * Generate individual feature PRPs from task groupings
   */
  private async generateFeaturePRPs(
    parsedTaskFile: ParsedTaskFile,
    includeAIContext: boolean
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const featureGroups = this.extractFeatureGroups(parsedTaskFile);

    for (const [featureName, featureData] of Object.entries(featureGroups)) {
      const content = await this.generateFeaturePRP(
        parsedTaskFile,
        featureName,
        featureData,
        includeAIContext
      );

      files.push({
        path: `PRPs/feature-${featureName.toLowerCase().replace(/\s+/g, '-')}.md`,
        content,
        description: `Feature PRP for ${featureName}`,
      });
    }

    return files;
  }

  /**
   * Generate feature-specific PRP
   */
  private async generateFeaturePRP(
    parsedTaskFile: ParsedTaskFile,
    featureName: string,
    featureData: { tasks: TaskFileTask[]; phases: string[] },
    includeAIContext: boolean
  ): Promise<string> {
    const { tasks, phases } = featureData;
    const totalEffort = this.calculateTotalEffort(tasks);
    const criticalTasks = tasks.filter((t) => t.priority === 'Critical');

    return `# Feature PRP: ${featureName}

## Feature Overview
**Project**: ${parsedTaskFile.projectName}  
**Feature**: ${featureName}  
**Task Count**: ${tasks.length}  
**Phases Involved**: ${phases.join(', ')}  
**Total Effort**: ${totalEffort}  
**Critical Tasks**: ${criticalTasks.length}

## Feature Description

${featureName} represents a core component of the ${parsedTaskFile.projectName} system, spanning ${phases.length} implementation phases and requiring ${tasks.length} distinct implementation tasks.

## Implementation Tasks

${tasks
  .map(
    (task) => `### ${task.name}
**Phase**: ${task.phase}  
**Priority**: ${task.priority}  
**Effort**: ${task.effort}  
**Category**: ${task.category}

${task.description}

**Acceptance Criteria**:
${task.acceptanceCriteria.length > 0 ? task.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n') : '- Task completed according to specifications'}

**Technical Requirements**:
${task.technicalRequirements.length > 0 ? task.technicalRequirements.map((req) => `- ${req}`).join('\n') : '- Follow established project patterns'}

${
  task.risks.length > 0
    ? `**Associated Risks**:
${task.risks.map((risk) => `- ${risk.description} (${risk.type})`).join('\n')}`
    : ''
}

${
  task.dependencies.length > 0
    ? `**Dependencies**:
${task.dependencies.map((dep) => `- ${dep}`).join('\n')}`
    : ''
}
`
  )
  .join('\n')}

## Implementation Strategy

### Sequential Approach
The tasks for this feature should be implemented in the following order:

${this.generateFeatureTaskOrder(tasks)
  .map((task, index) => `${index + 1}. **${task.name}** (${task.phase})`)
  .join('\n')}

### Key Implementation Points
- **Start with Foundation**: Begin with core infrastructure tasks
- **Build Incrementally**: Add functionality in testable increments  
- **Validate Continuously**: Test each component before proceeding
- **Document Progress**: Update documentation as features are completed

## Testing Strategy

### Feature Testing Plan
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Cross-component interaction testing
3. **Feature Tests**: End-to-end feature validation
4. **Regression Tests**: Ensure no existing functionality is broken

### Test Coverage Requirements
- **Unit Test Coverage**: >85% for all new code
- **Integration Coverage**: 100% of feature integration points
- **E2E Coverage**: All user-facing functionality tested

## Risk Assessment

### Feature-Specific Risks
${this.extractFeatureRisks(tasks)
  .map(
    (risk) => `#### ${risk.type} Risk
**Description**: ${risk.description}  
**Impact**: High  
**Mitigation**: ${risk.mitigation}`
  )
  .join('\n\n')}

### Risk Monitoring
- Track implementation blockers daily
- Escalate risks that impact other features
- Maintain risk register with mitigation status

## Dependencies and Integration

### Internal Dependencies
${this.extractInternalDependencies(tasks)
  .map((dep) => `- ${dep}`)
  .join('\n')}

### External Dependencies  
${this.extractExternalDependencies(tasks)
  .map((dep) => `- ${dep}`)
  .join('\n')}

### Integration Points
${this.identifyIntegrationPoints(featureName, tasks)
  .map((point) => `- ${point}`)
  .join('\n')}

${
  includeAIContext
    ? `## AI Implementation Context

### Implementation Guidelines for AI Assistant
1. **Feature Scope**: Focus only on tasks related to ${featureName}
2. **Cross-Phase Coordination**: Be aware this feature spans multiple phases
3. **Dependency Management**: Implement dependencies before dependent tasks
4. **Pattern Consistency**: Follow existing ${parsedTaskFile.projectName} patterns
5. **Incremental Implementation**: Build and test in small increments

### AI-Specific Considerations
- **Code Consistency**: Maintain consistent naming and structure
- **Error Handling**: Implement comprehensive error handling
- **Performance**: Consider performance implications of each implementation choice
- **Security**: Follow security best practices for all implementations
- **Documentation**: Update inline documentation as code is implemented

### Context Awareness
- This feature is part of a larger ${parsedTaskFile.phases.length}-phase implementation
- Changes may impact other features being developed concurrently
- Consider backward compatibility with existing system functionality
- Plan for future extensibility where appropriate`
    : ''
}

## Validation Criteria

### Feature Acceptance Criteria
${this.generateFeatureAcceptanceCriteria(tasks)
  .map((criteria) => `- ${criteria}`)
  .join('\n')}

### Performance Criteria
- Response time requirements met
- Resource usage within acceptable limits
- Scalability requirements satisfied
- Error handling comprehensive

### Quality Criteria
- Code review completed and approved
- All tests passing with required coverage
- Documentation complete and accurate
- Security review passed (if applicable)

## Definition of Done

- [ ] All ${tasks.length} feature tasks completed
- [ ] Unit tests implemented with >85% coverage
- [ ] Integration tests passing
- [ ] Feature testing completed
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security requirements validated
- [ ] Feature deployed to staging
- [ ] Stakeholder acceptance obtained

## Rollback Plan

In case of critical issues:
1. **Immediate Rollback**: Revert to previous stable version
2. **Issue Assessment**: Identify root cause of problems
3. **Fix Strategy**: Determine fix approach (hotfix vs. complete rework)
4. **Testing**: Comprehensive testing before redeployment
5. **Monitoring**: Enhanced monitoring post-redeployment

---

*Feature PRP Generated by Context Forge*  
*Feature: ${featureName}*  
*Generated: ${new Date().toISOString()}*
`;
  }

  /**
   * Generate comprehensive implementation guide
   */
  private async generateImplementationGuide(
    parsedTaskFile: ParsedTaskFile
  ): Promise<GeneratedFile> {
    const content = `# ${parsedTaskFile.projectName} - Complete Implementation Guide

## Overview

This comprehensive implementation guide provides detailed instructions for completing the ${parsedTaskFile.totalTasks} tasks across ${parsedTaskFile.phases.length} phases of the ${parsedTaskFile.projectName} project.

## Project Structure

### Implementation Phases
${parsedTaskFile.phases
  .map(
    (phase, index) => `#### Phase ${index + 1}: ${phase.name}
- **Duration**: ${phase.duration}
- **Tasks**: ${phase.tasks.length}
- **Focus**: ${phase.description}`
  )
  .join('\n\n')}

### Task Categories
${this.generateTaskCategoryBreakdown(parsedTaskFile)
  .map(([category, count]) => `- **${category}**: ${count} tasks`)
  .join('\n')}

## Development Environment Setup

### Prerequisites
1. **System Requirements**: Ensure development machine meets minimum requirements
2. **Repository Access**: Clone and configure the project repository
3. **Dependency Installation**: Install all required dependencies
4. **Environment Configuration**: Set up environment variables and configuration
5. **Database Setup**: Initialize and configure database
6. **Testing Setup**: Configure testing frameworks and tools

### Initial Setup Steps
\`\`\`bash
# Clone repository
git clone [repository-url]
cd ${parsedTaskFile.projectName.toLowerCase()}

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:setup
npm run db:migrate

# Verify setup
npm run dev
npm test
\`\`\`

## Implementation Methodology

### Development Workflow
1. **Phase Planning**: Review phase requirements and dependencies
2. **Task Analysis**: Understand each task's requirements and acceptance criteria
3. **Implementation**: Code implementation following established patterns
4. **Testing**: Comprehensive testing at each step
5. **Review**: Code review and quality assurance
6. **Deployment**: Deploy to staging for validation
7. **Validation**: Stakeholder review and approval

### Code Standards
- **Naming Conventions**: Follow established project naming patterns
- **Code Organization**: Maintain consistent file and folder structure
- **Documentation**: Comprehensive inline and API documentation
- **Testing**: Minimum 80% test coverage for all new code
- **Error Handling**: Robust error handling and recovery
- **Logging**: Comprehensive logging for debugging and monitoring

## Phase-by-Phase Implementation

${parsedTaskFile.phases
  .map(
    (phase, index) => `### Phase ${index + 1}: ${phase.name}

**Duration**: ${phase.duration}  
**Task Count**: ${phase.tasks.length}

#### Phase Setup
1. Create feature branch: \`git checkout -b phase-${index + 1}-${phase.name.toLowerCase().replace(/\s+/g, '-')}\`
2. Review phase documentation: [Phase ${index + 1} PRP](./phase-${index + 1}-prp.md)
3. Set up phase-specific environment configuration
4. Initialize monitoring and logging for the phase

#### Implementation Tasks
${phase.tasks
  .slice(0, 10)
  .map((task) => `- [ ] **${task.name}** (${task.priority}) - ${task.effort}`)
  .join(
    '\n'
  )}${phase.tasks.length > 10 ? `\n- [ ] ... and ${phase.tasks.length - 10} additional tasks` : ''}

#### Phase Validation
${phase.successCriteria.map((criteria) => `- [ ] ${criteria}`).join('\n')}

#### Phase Completion
1. Run comprehensive tests: \`npm run test:comprehensive\`
2. Perform code review
3. Deploy to staging environment
4. Validate all acceptance criteria
5. Get stakeholder approval
6. Merge to main branch
7. Tag release: \`git tag v${index + 1}.0.0\`
`
  )
  .join('\n')}

## Quality Assurance

### Testing Strategy
1. **Unit Testing**: Test individual components and functions
2. **Integration Testing**: Test component interactions
3. **System Testing**: Test complete workflows
4. **Acceptance Testing**: Validate business requirements
5. **Performance Testing**: Ensure system performance
6. **Security Testing**: Validate security requirements

### Code Quality
- **Linting**: Use ESLint/TSLint for code quality
- **Formatting**: Use Prettier for consistent formatting
- **Type Checking**: Use TypeScript for type safety
- **Code Review**: Peer review for all code changes
- **Static Analysis**: Use tools like SonarQube for code analysis

## Risk Management

### Identified Risks
${parsedTaskFile.riskManagement.keyRisks.map((risk) => `- ${risk}`).join('\n')}

### Risk Mitigation Strategies
${parsedTaskFile.riskManagement.mitigationStrategies.map((strategy) => `- ${strategy}`).join('\n')}

### Risk Monitoring
- **Daily Risk Review**: Assess risks during daily standups
- **Risk Register**: Maintain updated risk register
- **Escalation Process**: Clear escalation path for high-impact risks
- **Mitigation Tracking**: Track implementation of mitigation strategies

## Team Coordination

### Communication Plan
- **Daily Standups**: Progress updates and blocker identification
- **Weekly Reviews**: Phase progress and quality metrics
- **Sprint Reviews**: Stakeholder updates and feedback
- **Retrospectives**: Process improvement and lessons learned

### Responsibility Matrix
${parsedTaskFile.resourceRequirements.teamStructure.map((role) => `- **${role}**: Assigned to relevant tasks based on expertise`).join('\n')}

## Progress Tracking

### Metrics and KPIs
- **Task Completion Rate**: Percentage of tasks completed per phase
- **Code Coverage**: Test coverage percentage
- **Bug Discovery Rate**: Number of bugs found per phase
- **Performance Metrics**: Response times and system performance
- **Stakeholder Satisfaction**: Feedback scores from stakeholders

### Reporting
- **Daily Reports**: Task completion and blocker status
- **Weekly Reports**: Phase progress and quality metrics
- **Phase Reports**: Comprehensive phase completion reports
- **Project Dashboard**: Real-time project status dashboard

## Deployment Strategy

### Environment Management
1. **Development**: Local development environment
2. **Testing**: Automated testing environment
3. **Staging**: Pre-production validation environment
4. **Production**: Live system environment

### Deployment Process
1. **Code Review**: All code changes reviewed and approved
2. **Testing**: Comprehensive testing in testing environment
3. **Staging Deployment**: Deploy to staging for validation
4. **Stakeholder Approval**: Get approval from stakeholders
5. **Production Deployment**: Deploy to production environment
6. **Monitoring**: Monitor system performance and stability
7. **Rollback Plan**: Ready to rollback if issues detected

## Success Criteria

### Project Success Metrics
${parsedTaskFile.successMetrics.map((metric) => `- ${metric}`).join('\n')}

### Quality Gates
- All ${parsedTaskFile.totalTasks} tasks completed successfully
- Test coverage >80% across all modules
- Performance benchmarks met
- Security requirements satisfied
- Stakeholder acceptance obtained
- Documentation complete and accurate

## Post-Implementation

### Maintenance Plan
- **Bug Fixing**: Process for identifying and fixing bugs
- **Feature Enhancements**: Process for adding new features
- **Performance Monitoring**: Ongoing performance monitoring
- **Security Updates**: Regular security updates and patches
- **Documentation Updates**: Keep documentation current

### Knowledge Transfer
- **Code Documentation**: Comprehensive code documentation
- **System Documentation**: Complete system architecture documentation
- **User Guides**: End-user documentation and training materials
- **Operations Guides**: System administration and troubleshooting guides

## Troubleshooting

### Common Issues
1. **Build Failures**: Check dependencies and environment configuration
2. **Test Failures**: Verify test data and mock configurations
3. **Performance Issues**: Profile and optimize bottlenecks
4. **Integration Issues**: Verify API contracts and data formats

### Debug Resources
- **Log Files**: Check application and system logs
- **Debug Tools**: Use debugging tools and profilers
- **Monitoring**: Use application performance monitoring
- **Support**: Escalation process for technical issues

---

*Complete Implementation Guide*  
*Generated by Context Forge Task File Analysis*  
*Project: ${parsedTaskFile.projectName}*  
*Generated: ${new Date().toISOString()}*
`;

    return {
      path: 'PRPs/implementation-guide.md',
      content,
      description: 'Comprehensive implementation guide for all phases',
    };
  }

  // Helper methods for content generation
  private groupTasksByCategory(tasks: TaskFileTask[]): Record<string, TaskFileTask[]> {
    const grouped: Record<string, TaskFileTask[]> = {};
    tasks.forEach((task) => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });
    return grouped;
  }

  private generateTaskOrder(tasks: TaskFileTask[]): TaskFileTask[] {
    // Sort by priority first, then by dependencies
    return [...tasks].sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by dependencies (fewer dependencies first)
      return a.dependencies.length - b.dependencies.length;
    });
  }

  private generateValidationCheckpoints(phase: TaskFilePhase): string[] {
    const checkpoints = [
      `All ${phase.tasks.length} phase tasks completed`,
      'Unit tests written and passing',
      'Integration tests validated',
      'Code review completed',
      'Performance benchmarks met',
    ];

    // Add phase-specific checkpoints based on task categories
    const categories = [...new Set(phase.tasks.map((t) => t.category))];
    categories.forEach((category) => {
      switch (category) {
        case 'API Development':
          checkpoints.push('API documentation updated');
          checkpoints.push('API endpoints tested');
          break;
        case 'Frontend':
          checkpoints.push('UI components tested');
          checkpoints.push('Responsive design validated');
          break;
        case 'Database':
          checkpoints.push('Database migration successful');
          checkpoints.push('Data integrity verified');
          break;
        case 'Security':
          checkpoints.push('Security scan completed');
          checkpoints.push('Access controls validated');
          break;
      }
    });

    return checkpoints;
  }

  private extractPhasePrerequisites(
    phase: TaskFilePhase,
    parsedTaskFile: ParsedTaskFile
  ): string[] {
    const phaseIndex = parsedTaskFile.phases.indexOf(phase);
    if (phaseIndex === 0) {
      return [
        'Project repository set up',
        'Development environment configured',
        'Team access established',
      ];
    }

    const previousPhase = parsedTaskFile.phases[phaseIndex - 1];
    return [`${previousPhase.name} completed successfully`, 'Previous phase deliverables approved'];
  }

  private extractExternalDependencies(tasks: TaskFileTask[]): string[] {
    const dependencies = new Set<string>();
    tasks.forEach((task) => {
      task.dependencies.forEach((dep) => {
        if (
          dep.toLowerCase().includes('api') ||
          dep.toLowerCase().includes('service') ||
          dep.toLowerCase().includes('external')
        ) {
          dependencies.add(dep);
        }
      });
    });
    return Array.from(dependencies);
  }

  private extractPhaseRisks(
    tasks: TaskFileTask[]
  ): Array<{ type: string; description: string; mitigation: string }> {
    const risks = new Map<string, { type: string; description: string; mitigation: string }>();

    tasks.forEach((task) => {
      task.risks.forEach((risk) => {
        risks.set(risk.description, risk);
      });
    });

    return Array.from(risks.values());
  }

  private identifyRequiredSkills(tasks: TaskFileTask[]): string[] {
    const skills = new Set<string>();

    tasks.forEach((task) => {
      switch (task.category) {
        case 'API Development':
          skills.add('Backend Development');
          skills.add('REST API Design');
          break;
        case 'Frontend':
          skills.add('Frontend Development');
          skills.add('UI/UX Design');
          break;
        case 'Database':
          skills.add('Database Design');
          skills.add('SQL/Query Optimization');
          break;
        case 'Security':
          skills.add('Security Engineering');
          skills.add('Authentication Systems');
          break;
        case 'Testing':
          skills.add('Test Automation');
          skills.add('Quality Assurance');
          break;
      }
    });

    return Array.from(skills);
  }

  private calculateEffortDistribution(
    tasksByCategory: Record<string, TaskFileTask[]>
  ): Array<[string, string]> {
    return Object.entries(tasksByCategory).map(([category, tasks]) => {
      const totalDays = tasks.reduce((sum, task) => {
        const effortMatch = task.effort.match(/(\d+(?:\.\d+)?)\s*days?/);
        return sum + (effortMatch ? parseFloat(effortMatch[1]) : 1);
      }, 0);
      return [category, `${totalDays} days`];
    });
  }

  private extractFeatureGroups(
    parsedTaskFile: ParsedTaskFile
  ): Record<string, { tasks: TaskFileTask[]; phases: string[] }> {
    const featureGroups: Record<string, { tasks: TaskFileTask[]; phases: string[] }> = {};

    parsedTaskFile.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        const featureName = this.extractFeatureName(task.name);
        if (!featureGroups[featureName]) {
          featureGroups[featureName] = { tasks: [], phases: [] };
        }
        featureGroups[featureName].tasks.push(task);
        if (!featureGroups[featureName].phases.includes(phase.name)) {
          featureGroups[featureName].phases.push(phase.name);
        }
      });
    });

    return featureGroups;
  }

  private extractFeatureName(taskName: string): string {
    // Extract feature name from task name using common patterns
    const patterns = [
      /^(.*?)\s+(system|component|module|service|feature)/i,
      /^(.*?)\s+(creation|implementation|development)/i,
      /^Create\s+(.*?)\s+(page|interface|system)/i,
      /^Implement\s+(.*?)\s+(functionality|features?)/i,
      /^Build\s+(.*?)\s+(system|component)/i,
    ];

    for (const pattern of patterns) {
      const match = taskName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: use first two words
    const words = taskName.split(' ');
    return words.slice(0, 2).join(' ');
  }

  private calculateTotalEffort(tasks: TaskFileTask[]): string {
    const totalDays = tasks.reduce((sum, task) => {
      const effortMatch = task.effort.match(/(\d+(?:\.\d+)?)\s*days?/);
      return sum + (effortMatch ? parseFloat(effortMatch[1]) : 1);
    }, 0);
    return `${totalDays} days`;
  }

  private generateFeatureTaskOrder(tasks: TaskFileTask[]): TaskFileTask[] {
    return this.generateTaskOrder(tasks);
  }

  private extractFeatureRisks(
    tasks: TaskFileTask[]
  ): Array<{ type: string; description: string; mitigation: string }> {
    return this.extractPhaseRisks(tasks);
  }

  private extractInternalDependencies(tasks: TaskFileTask[]): string[] {
    const dependencies = new Set<string>();
    tasks.forEach((task) => {
      task.dependencies.forEach((dep) => {
        if (
          !dep.toLowerCase().includes('api') &&
          !dep.toLowerCase().includes('service') &&
          !dep.toLowerCase().includes('external')
        ) {
          dependencies.add(dep);
        }
      });
    });
    return Array.from(dependencies);
  }

  private identifyIntegrationPoints(featureName: string, tasks: TaskFileTask[]): string[] {
    const integrations = new Set<string>();

    tasks.forEach((task) => {
      if (
        task.name.toLowerCase().includes('integration') ||
        task.name.toLowerCase().includes('connect')
      ) {
        integrations.add(`${featureName} integration with ${task.category}`);
      }

      task.technicalRequirements.forEach((req) => {
        if (req.toLowerCase().includes('integrate') || req.toLowerCase().includes('connect')) {
          integrations.add(req);
        }
      });
    });

    if (integrations.size === 0) {
      integrations.add(`Standard ${featureName} integration points`);
    }

    return Array.from(integrations);
  }

  private generateFeatureAcceptanceCriteria(tasks: TaskFileTask[]): string[] {
    const criteria = new Set<string>();

    tasks.forEach((task) => {
      task.acceptanceCriteria.forEach((c) => criteria.add(c));
    });

    if (criteria.size === 0) {
      criteria.add('All feature tasks completed successfully');
      criteria.add('Feature functionality validated');
      criteria.add('Integration tests passing');
    }

    return Array.from(criteria);
  }

  private generateTaskCategoryBreakdown(parsedTaskFile: ParsedTaskFile): Array<[string, number]> {
    const categories = new Map<string, number>();

    parsedTaskFile.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        categories.set(task.category, (categories.get(task.category) || 0) + 1);
      });
    });

    return Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
  }
}

/**
 * Convenience function to generate task file PRPs
 */
export async function generateTaskFilePRPs(
  config: ProjectConfig,
  parsedTaskFile: ParsedTaskFile,
  options?: TaskFilePRPOptions
): Promise<GeneratedFile[]> {
  const generator = new TaskFilePRPGenerator();
  return await generator.generatePRPs(config, parsedTaskFile, options);
}

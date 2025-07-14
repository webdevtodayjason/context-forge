import { ProjectConfig, EnhancementConfig, CheckpointCommand } from '../types';

export async function generateEnhancementCheckpoints(config: ProjectConfig): Promise<void> {
  const enhancement = config.enhancementConfig;

  if (!enhancement || !config.checkpointConfig) {
    return;
  }

  // Generate checkpoint commands for each phase
  const checkpointCommands: CheckpointCommand[] = [];

  enhancement.enhancementPhases.forEach((phase) => {
    phase.checkpoints.forEach((checkpoint) => {
      checkpointCommands.push({
        name: `enhancement-${checkpoint.id}`,
        category: 'enhancement',
        description: checkpoint.description,
        template: generateCheckpointTemplate(enhancement, phase.id, checkpoint),
        triggers: [checkpoint],
      });
    });
  });

  // Add feature-specific checkpoints
  enhancement.features.forEach((feature) => {
    if (feature.priority === 'critical' || feature.complexity === 'very-complex') {
      checkpointCommands.push({
        name: `feature-${feature.id}-review`,
        category: 'enhancement',
        description: `Critical review checkpoint for ${feature.name}`,
        template: generateFeatureCheckpointTemplate(feature),
        triggers: [
          {
            id: `${feature.id}-critical-review`,
            name: `${feature.name} Critical Review`,
            description: `Review critical implementation of ${feature.name}`,
            category: 'critical',
            autoTrigger: false,
            conditions: ['feature', 'implementation', 'review'],
          },
        ],
      });
    }
  });

  // Add phase transition checkpoints
  enhancement.enhancementPhases.forEach((phase, index) => {
    if (index < enhancement.enhancementPhases.length - 1) {
      checkpointCommands.push({
        name: `phase-transition-${phase.id}`,
        category: 'enhancement',
        description: `Transition checkpoint from ${phase.name} to next phase`,
        template: generatePhaseTransitionTemplate(enhancement, phase.id),
        triggers: [
          {
            id: `transition-${phase.id}`,
            name: `Complete ${phase.name}`,
            description: `Verify phase completion before proceeding`,
            category: 'important',
            autoTrigger: true,
            conditions: ['phase', 'complete', 'verified'],
          },
        ],
      });
    }
  });

  // Update checkpoint configuration
  if (!config.checkpointConfig.customCommands) {
    config.checkpointConfig.customCommands = [];
  }

  config.checkpointConfig.customCommands.push(...checkpointCommands);
}

function generateCheckpointTemplate(
  enhancement: EnhancementConfig,
  phaseId: string,
  checkpoint: any
): string {
  const phase = enhancement.enhancementPhases.find((p) => p.id === phaseId);

  return `## Checkpoint: ${checkpoint.name}

**Phase**: ${phase?.name || phaseId}  
**Type**: ${checkpoint.category}  
**Auto-trigger**: ${checkpoint.autoTrigger ? 'Yes' : 'No'}

### Validation Checklist

${phase?.validationCriteria.map((criteria) => `- [ ] ${criteria}`).join('\n') || '- [ ] Validation pending'}

### Phase Status
- **Tasks Completed**: [X/${phase?.tasks.length || 0}]
- **Features Implemented**: ${phase?.features.join(', ') || 'None'}
- **Tests Passing**: [Yes/No]
- **Documentation Updated**: [Yes/No]

### Pre-checkpoint Verification
1. Run all tests: \`npm test\`
2. Check code coverage: \`npm run coverage\`
3. Verify documentation: \`npm run docs:check\`
4. Review implementation against requirements

### Checkpoint Decision

**Status**: [✅ PROCEED | ⚠️ REVIEW NEEDED | ❌ BLOCKED]

**Notes**:
[Add any relevant notes about the checkpoint status]

### Next Steps
${
  checkpoint.category === 'critical'
    ? '- Schedule review meeting\n- Prepare demonstration\n- Document any concerns'
    : '- Continue to next task\n- Update progress tracking\n- Notify team of completion'
}

### Rollback Information
${
  phase?.rollbackStrategy
    ? `**Rollback Available**: Yes
**Estimated Time**: ${phase.rollbackStrategy.estimatedTime}
**Procedure**: See rollback documentation`
    : '**Rollback Available**: No - This is a forward-only checkpoint'
}
`;
}

function generateFeatureCheckpointTemplate(feature: any): string {
  return `## Feature Review Checkpoint: ${feature.name}

**Priority**: ${feature.priority}  
**Complexity**: ${feature.complexity}  
**Category**: ${feature.category}

### Implementation Review

#### Acceptance Criteria
${feature.acceptanceCriteria.map((criteria: string) => `- [ ] ${criteria}`).join('\n')}

#### Technical Requirements
${feature.technicalRequirements.map((req: string) => `- [ ] ${req}`).join('\n')}

#### Code Quality
- [ ] Code follows project standards
- [ ] No critical linting errors
- [ ] Appropriate error handling
- [ ] Performance acceptable
- [ ] Security considerations addressed

#### Integration Verification
${feature.integrationPoints
  .map((point: any) => `- [ ] ${point.component} integration tested`)
  .join('\n')}

#### Test Coverage
- [ ] Unit tests complete (≥80% coverage)
- [ ] Integration tests passing
- [ ] Edge cases covered
- [ ] Performance tests (if applicable)

### Risk Assessment

${feature.risks
  .map(
    (risk: any) =>
      `#### ${risk.category} Risk
- **Description**: ${risk.description}
- **Impact**: ${risk.impact}
- **Mitigation Status**: [Implemented/Pending/Not Required]`
  )
  .join('\n\n')}

### Review Decision

**Approval Status**: [✅ APPROVED | ⚠️ APPROVED WITH CONDITIONS | ❌ REQUIRES CHANGES]

**Reviewer Comments**:
[Add review feedback here]

**Required Changes** (if any):
1. [Change 1]
2. [Change 2]

### Post-Review Actions
- [ ] Address reviewer feedback
- [ ] Update documentation
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Update project board
`;
}

function generatePhaseTransitionTemplate(enhancement: EnhancementConfig, phaseId: string): string {
  const currentPhase = enhancement.enhancementPhases.find((p) => p.id === phaseId);
  const currentIndex = enhancement.enhancementPhases.findIndex((p) => p.id === phaseId);
  const nextPhase = enhancement.enhancementPhases[currentIndex + 1];

  return `## Phase Transition Checkpoint

**Current Phase**: ${currentPhase?.name}  
**Next Phase**: ${nextPhase?.name}  
**Transition Date**: [Date]

### Current Phase Completion

#### Task Summary
- **Total Tasks**: ${currentPhase?.tasks.length || 0}
- **Completed**: [X]
- **Incomplete**: [List any incomplete tasks]

#### Feature Status
${currentPhase?.features
  .map((featureId) => {
    const feature = enhancement.features.find((f) => f.id === featureId);
    return `- **${feature?.name || featureId}**: [Completed/In Progress/Blocked]`;
  })
  .join('\n')}

#### Validation Results
${currentPhase?.validationCriteria.map((criteria) => `- [✓/✗] ${criteria}`).join('\n')}

### Pre-Transition Checklist

#### Technical Readiness
- [ ] All code merged to main branch
- [ ] No critical bugs open
- [ ] Performance benchmarks met
- [ ] Security scan passed

#### Documentation
- [ ] Technical documentation updated
- [ ] API documentation current
- [ ] User guides updated
- [ ] Changelog updated

#### Team Readiness
- [ ] Knowledge transfer completed
- [ ] Next phase plan reviewed
- [ ] Resources allocated
- [ ] Stakeholders informed

### Risk Assessment for Next Phase

#### Identified Risks
${
  nextPhase?.risks?.map((risk: any) => `- ${risk.description} (${risk.impact})`).join('\n') ||
  '- No specific risks identified'
}

#### Dependencies
- **External Dependencies**: [List any]
- **Internal Dependencies**: ${nextPhase?.dependencies.join(', ') || 'None'}
- **Resource Dependencies**: [List any]

### Transition Decision

**Approval to Proceed**: [YES / NO / CONDITIONAL]

**Conditions** (if any):
1. [Condition 1]
2. [Condition 2]

**Sign-offs**:
- Technical Lead: [Name] - [Date]
- Project Manager: [Name] - [Date]
- Stakeholder: [Name] - [Date]

### Next Phase Kickoff

#### Immediate Actions
1. Update project board for ${nextPhase?.name}
2. Schedule kickoff meeting
3. Assign tasks to team members
4. Set up monitoring for new features

#### Success Criteria for ${nextPhase?.name}
${nextPhase?.validationCriteria
  .slice(0, 3)
  .map((criteria) => `- ${criteria}`)
  .join('\n')}

### Notes
[Any additional notes about the transition]
`;
}

import { ProjectConfig, EnhancementConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

export async function generateEnhancementCommands(config: ProjectConfig): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  const enhancement = config.enhancementConfig;

  if (!enhancement || !config.targetIDEs.includes('claude')) {
    return files;
  }

  // Generate enhancement status command
  files.push({
    path: '.claude/commands/enhancement/enhancement-status.md',
    content: generateEnhancementStatusCommand(enhancement),
    description: 'Enhancement status tracking command',
  });

  // Generate feature status command
  files.push({
    path: '.claude/commands/enhancement/feature-status.md',
    content: generateFeatureStatusCommand(enhancement),
    description: 'Individual feature status command',
  });

  // Generate enhancement validation command
  files.push({
    path: '.claude/commands/enhancement/enhancement-validate.md',
    content: generateEnhancementValidateCommand(enhancement),
    description: 'Enhancement validation command',
  });

  // Generate feature complete command
  files.push({
    path: '.claude/commands/enhancement/feature-complete.md',
    content: generateFeatureCompleteCommand(enhancement),
    description: 'Mark feature as complete command',
  });

  // Generate enhancement metrics command
  files.push({
    path: '.claude/commands/enhancement/enhancement-metrics.md',
    content: generateEnhancementMetricsCommand(enhancement),
    description: 'Enhancement metrics and progress command',
  });

  // Generate feature dependencies command
  files.push({
    path: '.claude/commands/enhancement/feature-dependencies.md',
    content: generateFeatureDependenciesCommand(enhancement),
    description: 'Feature dependency visualization command',
  });

  return files;
}

function generateEnhancementStatusCommand(enhancement: EnhancementConfig): string {
  return `# Enhancement Status Command

## Command: /enhancement-status

Shows the current status of all enhancement phases and features.

## Usage
\`\`\`
/enhancement-status
\`\`\`

## Template

### Enhancement Progress Report

**Project**: ${enhancement.projectName}  
**Strategy**: ${enhancement.implementationStrategy}  
**Duration**: ${enhancement.estimatedDuration}  
**Started**: [Date]

#### Overall Progress
- **Phases Completed**: [X/${enhancement.enhancementPhases.length}]
- **Features Completed**: [X/${enhancement.features.length}]
- **Tasks Completed**: [X/Total]
- **Overall Progress**: [XX%]

#### Phase Status

${enhancement.enhancementPhases
  .map(
    (phase) => `##### ${phase.name}
- **Status**: [Not Started | In Progress | Completed]
- **Progress**: [X/${phase.tasks.length}] tasks
- **Duration**: ${phase.estimatedDuration}
- **Features**: ${phase.features.join(', ')}
- **Blockers**: [List any blockers]`
  )
  .join('\n\n')}

#### Feature Summary

${enhancement.features
  .map(
    (feature) =>
      `- **${feature.name}** (${feature.priority}): [Not Started | In Progress | Completed]`
  )
  .join('\n')}

#### Recent Activity
- [Recent completed tasks]
- [Recent checkpoints passed]
- [Recent issues resolved]

#### Next Steps
1. [Next task to complete]
2. [Next checkpoint to reach]
3. [Next feature to start]

#### Risk Status
- **Active Risks**: [Count]
- **Mitigated Risks**: [Count]
- **New Risks**: [List any new risks]

## Example Output

### Enhancement Progress Report

**Project**: MyApp Enhancement  
**Strategy**: hybrid  
**Duration**: 3 months  
**Started**: January 15, 2024

#### Overall Progress
- **Phases Completed**: 2/5
- **Features Completed**: 3/8
- **Tasks Completed**: 24/56
- **Overall Progress**: 43%

#### Phase Status

##### Phase 1: Environment Setup
- **Status**: Completed
- **Progress**: 3/3 tasks
- **Duration**: 1 day
- **Features**: N/A
- **Blockers**: None

##### Phase 2: Critical Features
- **Status**: Completed
- **Progress**: 12/12 tasks
- **Duration**: 2 weeks
- **Features**: user-auth, api-gateway
- **Blockers**: None

##### Phase 3: Parallel Implementation
- **Status**: In Progress
- **Progress**: 9/18 tasks
- **Duration**: 3 weeks
- **Features**: dashboard, analytics, notifications
- **Blockers**: Waiting for design approval on dashboard

#### Recent Activity
- Completed user authentication implementation
- Passed security review checkpoint
- Resolved API rate limiting issue

#### Next Steps
1. Complete dashboard UI components
2. Implement analytics data collection
3. Begin notification service setup
`;
}

function generateFeatureStatusCommand(enhancement: EnhancementConfig): string {
  return `# Feature Status Command

## Command: /feature-status [feature-id]

Shows detailed status of a specific feature.

## Usage
\`\`\`
/feature-status feature-1
/feature-status user-auth
\`\`\`

## Parameters
- **feature-id**: The ID of the feature to check (optional, shows menu if not provided)

## Template

### Feature Status: [Feature Name]

**ID**: [feature-id]  
**Priority**: [${enhancement.features[0]?.priority || 'priority'}]  
**Complexity**: [${enhancement.features[0]?.complexity || 'complexity'}]  
**Category**: [${enhancement.features[0]?.category || 'category'}]  
**Status**: [Not Started | In Progress | Completed | Blocked]

#### Progress
- **Tasks Completed**: [X/Total]
- **Integration Points**: [X/Total] configured
- **Tests Written**: [X estimated]
- **Documentation**: [Not Started | In Progress | Completed]

#### Acceptance Criteria
${
  enhancement.features[0]?.acceptanceCriteria.map((criteria) => `- [ ] ${criteria}`).join('\n') ||
  '- [ ] Criteria 1\n- [ ] Criteria 2'
}

#### Technical Requirements
${
  enhancement.features[0]?.technicalRequirements.map((req) => `- [status] ${req}`).join('\n') ||
  '- [status] Requirement 1\n- [status] Requirement 2'
}

#### Task Breakdown
1. **Planning** - [Completed]
2. **Implementation** - [In Progress]
   - Subtask 1 - [Completed]
   - Subtask 2 - [In Progress]
   - Subtask 3 - [Not Started]
3. **Testing** - [Not Started]
4. **Documentation** - [Not Started]

#### Dependencies
- **Depends On**: [List feature dependencies]
- **Blocks**: [List features this blocks]

#### Risks
${
  enhancement.features[0]?.risks
    .map((risk) => `- **${risk.category}** (${risk.impact}): ${risk.description}`)
    .join('\n') || '- No active risks'
}

#### Integration Status
${
  enhancement.features[0]?.integrationPoints
    .map((point) => `- **${point.component}**: [status]`)
    .join('\n') || '- No integration points'
}

#### Recent Updates
- [Date]: [Update description]
- [Date]: [Update description]

#### Next Actions
1. [Next immediate task]
2. [Following task]
3. [Validation step]

## Example Output

### Feature Status: User Authentication

**ID**: feature-1  
**Priority**: critical  
**Complexity**: medium  
**Category**: security  
**Status**: In Progress

#### Progress
- **Tasks Completed**: 3/5
- **Integration Points**: 2/3 configured
- **Tests Written**: 8/10 estimated
- **Documentation**: In Progress

#### Acceptance Criteria
- [x] Users can register with email
- [x] Users can login with credentials
- [ ] Password reset functionality
- [ ] Two-factor authentication support

#### Task Breakdown
1. **Planning** - Completed
2. **Implementation** - In Progress
   - User model - Completed
   - Auth service - Completed
   - Password reset - In Progress
   - 2FA integration - Not Started
3. **Testing** - In Progress
4. **Documentation** - In Progress

#### Recent Updates
- Jan 20: Completed basic auth flow
- Jan 19: Fixed session management bug
- Jan 18: Implemented user registration
`;
}

function generateEnhancementValidateCommand(enhancement: EnhancementConfig): string {
  return `# Enhancement Validation Command

## Command: /enhancement-validate

Runs validation checks for the enhancement implementation.

## Usage
\`\`\`
/enhancement-validate
/enhancement-validate --phase phase-1
/enhancement-validate --feature feature-1
\`\`\`

## Options
- **--phase [phase-id]**: Validate specific phase
- **--feature [feature-id]**: Validate specific feature
- **--all**: Run all validations (default)

## Template

### Enhancement Validation Report

**Timestamp**: [Current time]  
**Scope**: [All | Phase X | Feature X]

#### Code Quality Checks
- **Linting**: [Pass/Fail] - [X warnings, Y errors]
- **Type Checking**: [Pass/Fail] - [X issues]
- **Code Coverage**: [XX%] - [Pass/Fail threshold]
- **Complexity**: [Pass/Fail] - [X files exceed threshold]

#### Test Results
- **Unit Tests**: [X/Y passing]
- **Integration Tests**: [X/Y passing]
- **E2E Tests**: [X/Y passing]
- **Performance Tests**: [Pass/Fail]

#### Feature Validation

${enhancement.features
  .map(
    (feature) => `##### ${feature.name}
- **Implementation**: [Complete/Incomplete]
- **Acceptance Criteria**: [X/${feature.acceptanceCriteria.length}] met
- **Integration Points**: [X/${feature.integrationPoints.length}] verified
- **Documentation**: [Complete/Incomplete]`
  )
  .join('\n\n')}

#### Security Checks
- **Vulnerability Scan**: [Pass/Fail]
- **Dependency Audit**: [X vulnerabilities found]
- **Code Security**: [Pass/Fail]

#### Performance Metrics
- **Load Time**: [Baseline vs Current]
- **Memory Usage**: [Baseline vs Current]
- **API Response Time**: [Baseline vs Current]

#### Documentation Status
- **API Docs**: [Updated/Outdated]
- **User Guide**: [Updated/Outdated]
- **Technical Docs**: [Updated/Outdated]
- **Changelog**: [Updated/Outdated]

#### Validation Summary
- **Overall Status**: [Pass/Fail]
- **Critical Issues**: [Count]
- **Warnings**: [Count]
- **Recommendations**: [Count]

#### Action Items
1. [Critical issue to fix]
2. [Important warning to address]
3. [Recommended improvement]

## Validation Commands

\`\`\`bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Run security scan
npm audit

# Check coverage
npm run coverage

# Run performance tests
npm run perf-test
\`\`\`
`;
}

function generateFeatureCompleteCommand(enhancement: EnhancementConfig): string {
  return `# Feature Complete Command

## Command: /feature-complete [feature-id]

Marks a feature as complete and runs final validation.

## Usage
\`\`\`
/feature-complete feature-1
/feature-complete user-auth --skip-validation
\`\`\`

## Parameters
- **feature-id**: The ID of the feature to mark complete

## Options
- **--skip-validation**: Skip validation checks (not recommended)
- **--force**: Force completion even with warnings

## Template

### Feature Completion Checklist: [Feature Name]

#### Pre-Completion Validation
- [ ] All tasks completed
- [ ] All tests passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No critical issues

#### Acceptance Criteria Verification
${
  enhancement.features[0]?.acceptanceCriteria.map((criteria) => `- [ ] ${criteria}`).join('\n') ||
  '- [ ] All criteria met'
}

#### Technical Requirements Check
${
  enhancement.features[0]?.technicalRequirements.map((req) => `- [ ] ${req}`).join('\n') ||
  '- [ ] All requirements fulfilled'
}

#### Integration Verification
${
  enhancement.features[0]?.integrationPoints
    .map((point) => `- [ ] ${point.component} integration tested`)
    .join('\n') || '- [ ] No integration points'
}

#### Final Checks
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Accessibility compliance
- [ ] Cross-browser testing (if UI)
- [ ] Mobile responsiveness (if UI)

#### Documentation
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Technical documentation updated
- [ ] Changelog entry added

#### Deployment Readiness
- [ ] Feature flag configured (if applicable)
- [ ] Migration scripts tested (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring configured

### Completion Confirmation

**Feature**: [Feature Name]  
**Completed By**: [User]  
**Completion Date**: [Date]  
**Version**: [Version number]

#### Summary
- **Total Tasks**: [X]
- **Tests Added**: [X]
- **Files Modified**: [X]
- **Lines Changed**: +[X] -[Y]

#### Dependencies Resolved
- [List of completed dependencies]

#### Unlocked Features
- [Features that can now be started]

#### Post-Completion Actions
1. Update project board
2. Notify stakeholders
3. Schedule demo (if applicable)
4. Plan gradual rollout

### Completion Result

✅ **Feature "[Feature Name]" has been marked as complete!**

Next steps:
- Review in staging environment
- Monitor for issues
- Gather user feedback
- Plan incremental improvements
`;
}

function generateEnhancementMetricsCommand(enhancement: EnhancementConfig): string {
  return `# Enhancement Metrics Command

## Command: /enhancement-metrics

Displays metrics and analytics for the enhancement project.

## Usage
\`\`\`
/enhancement-metrics
/enhancement-metrics --period 7d
/enhancement-metrics --feature feature-1
\`\`\`

## Options
- **--period [Xd]**: Time period (e.g., 7d, 14d, 30d)
- **--feature [id]**: Metrics for specific feature
- **--export**: Export metrics as JSON

## Template

### Enhancement Metrics Dashboard

**Period**: Last [X] days  
**Generated**: [Timestamp]

#### Velocity Metrics
- **Features Completed**: [X] this period ([Y] total)
- **Tasks Completed**: [X] this period ([Y] total)
- **Average Feature Time**: [X] days
- **Velocity Trend**: [Increasing/Stable/Decreasing]

#### Progress Analytics
\`\`\`
Overall Progress: [##########-------] 58%
Phase Progress:  [########---------] 40%
Feature Progress:[#############----] 75%
\`\`\`

#### Feature Metrics
| Feature | Priority | Complexity | Progress | Time Spent | Est. Remaining |
|---------|----------|------------|----------|------------|----------------|
${enhancement.features
  .slice(0, 3)
  .map((f) => `| ${f.name} | ${f.priority} | ${f.complexity} | [X%] | [X days] | [Y days] |`)
  .join('\n')}

#### Efficiency Metrics
- **On-Time Delivery**: [X%] of features
- **First-Time Pass**: [X%] of implementations
- **Rework Rate**: [X%]
- **Test Coverage**: [X%]

#### Quality Metrics
- **Bug Density**: [X] bugs per feature
- **Code Review Time**: Avg [X] hours
- **Test Pass Rate**: [X%]
- **Documentation Coverage**: [X%]

#### Risk Metrics
- **Active Risks**: [X]
- **Risk Mitigation Success**: [X%]
- **Blocked Time**: [X%] of total
- **Dependency Delays**: [X] days total

#### Team Performance
- **Daily Commit Rate**: [X] commits/day
- **PR Merge Time**: Avg [X] hours
- **Code Review Participation**: [X%]
- **Knowledge Sharing**: [X] docs created

#### Milestone Progress
${enhancement.enhancementPhases
  .map((phase) => `- **${phase.name}**: [Status] - [X%] complete`)
  .join('\n')}

#### Predictions
- **Estimated Completion**: [Date]
- **Risk of Delay**: [Low/Medium/High]
- **Resource Utilization**: [X%]
- **Budget Status**: [On Track/At Risk/Over]

#### Recommendations
1. [Performance improvement suggestion]
2. [Risk mitigation recommendation]
3. [Process optimization idea]

## Visualization

\`\`\`
Feature Completion Trend (Last 30 days)
│
│    ╱╲
│   ╱  ╲    ╱╲
│  ╱    ╲  ╱  ╲
│ ╱      ╲╱    ╲
│╱              ╲
└────────────────────
  Week 1  2  3  4
\`\`\`
`;
}

function generateFeatureDependenciesCommand(enhancement: EnhancementConfig): string {
  return `# Feature Dependencies Command

## Command: /feature-dependencies

Visualizes feature dependencies and relationships.

## Usage
\`\`\`
/feature-dependencies
/feature-dependencies --feature feature-1
/feature-dependencies --format list
\`\`\`

## Options
- **--feature [id]**: Show dependencies for specific feature
- **--format [graph|list]**: Output format (default: graph)
- **--include-complete**: Include completed features

## Template

### Feature Dependency Graph

\`\`\`
${generateDependencyGraph(enhancement)}
\`\`\`

### Dependency Analysis

#### Direct Dependencies
${enhancement.features
  .filter((f) => f.dependencies.length > 0)
  .map((f) => `- **${f.name}** depends on: ${f.dependencies.join(', ')}`)
  .join('\n')}

#### Dependency Chains
${generateDependencyChains(enhancement)}

#### Implementation Order
Based on dependencies, features should be implemented in this order:
${generateImplementationOrder(enhancement)}

#### Parallel Opportunities
Features that can be developed in parallel:
${generateParallelGroups(enhancement)}

#### Critical Path
The longest dependency chain that determines minimum project duration:
${generateCriticalPath(enhancement)}

#### Blocked Features
Features currently blocked by dependencies:
${generateBlockedFeatures(enhancement)}

#### Risk Assessment
- **Circular Dependencies**: [None detected / List any found]
- **Deep Dependencies**: [Features with 3+ levels]
- **Single Points of Failure**: [Critical dependencies]

### Recommendations
1. [Suggestion to optimize dependencies]
2. [Parallel development opportunity]
3. [Risk mitigation strategy]

## Legend
- **[C]**: Completed
- **[P]**: In Progress
- **[B]**: Blocked
- **[R]**: Ready to start
- **→**: Direct dependency
- **⟶**: Transitive dependency
`;
}

// Helper functions for dependency graph generation
function generateDependencyGraph(enhancement: EnhancementConfig): string {
  // Simplified ASCII graph representation
  const graph: string[] = [];

  enhancement.features.forEach((feature) => {
    if (feature.dependencies.length === 0) {
      graph.push(`[${feature.id}] ${feature.name}`);
    } else {
      feature.dependencies.forEach((dep) => {
        graph.push(`[${dep}] → [${feature.id}] ${feature.name}`);
      });
    }
  });

  return graph.join('\n');
}

function generateDependencyChains(enhancement: EnhancementConfig): string {
  const chains: string[] = [];

  // Find features with no dependencies (roots)
  const roots = enhancement.features.filter((f) => f.dependencies.length === 0);

  roots.forEach((root) => {
    const dependents = enhancement.features.filter((f) => f.dependencies.includes(root.id));
    if (dependents.length > 0) {
      chains.push(`- ${root.name} → ${dependents.map((d) => d.name).join(' → ')}`);
    }
  });

  return chains.join('\n') || '- No dependency chains found';
}

function generateImplementationOrder(enhancement: EnhancementConfig): string {
  const order: string[] = [];
  let orderNum = 1;

  // Group by dependency levels
  const levels = new Map<number, typeof enhancement.features>();

  enhancement.features.forEach((feature) => {
    const level = feature.dependencies.length;
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(feature);
  });

  // Sort levels and generate order
  Array.from(levels.keys())
    .sort((a, b) => a - b)
    .forEach((level) => {
      const features = levels.get(level)!;
      features.forEach((feature) => {
        order.push(`${orderNum}. ${feature.name} (${feature.priority})`);
        orderNum++;
      });
    });

  return order.join('\n');
}

function generateParallelGroups(enhancement: EnhancementConfig): string {
  const groups: string[] = [];
  const processed = new Set<string>();

  enhancement.features.forEach((feature) => {
    if (processed.has(feature.id)) return;

    // Find features that can be done in parallel with this one
    const parallel = enhancement.features.filter((f) => {
      if (f.id === feature.id || processed.has(f.id)) return false;

      // Check if they have conflicting dependencies
      return !f.dependencies.includes(feature.id) && !feature.dependencies.includes(f.id);
    });

    if (parallel.length > 0) {
      const group = [feature, ...parallel].map((f) => f.name).join(', ');
      groups.push(`- Group: ${group}`);
      [feature, ...parallel].forEach((f) => processed.add(f.id));
    }
  });

  return groups.join('\n') || '- No parallel opportunities identified';
}

function generateCriticalPath(enhancement: EnhancementConfig): string {
  // Simplified critical path - find longest dependency chain
  let longestPath: string[] = [];

  enhancement.features.forEach((feature) => {
    if (feature.dependencies.length === 0) {
      const path = [feature.name];

      // Find all features that depend on this one
      const findDependents = (id: string, currentPath: string[]) => {
        const dependents = enhancement.features.filter((f) => f.dependencies.includes(id));

        if (dependents.length === 0 && currentPath.length > longestPath.length) {
          longestPath = [...currentPath];
        }

        dependents.forEach((dep) => {
          findDependents(dep.id, [...currentPath, dep.name]);
        });
      };

      findDependents(feature.id, path);
    }
  });

  return longestPath.join(' → ') || 'No critical path identified';
}

function generateBlockedFeatures(enhancement: EnhancementConfig): string {
  const blocked = enhancement.features.filter((f) => f.dependencies.length > 0);

  if (blocked.length === 0) {
    return '- No features currently blocked';
  }

  return blocked.map((f) => `- ${f.name} (waiting for: ${f.dependencies.join(', ')})`).join('\n');
}

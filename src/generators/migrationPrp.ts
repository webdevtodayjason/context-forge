import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import path from 'path';

export async function generateMigrationPRPs(config: ProjectConfig): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (!config.migrationConfig) {
    return files;
  }

  const migration = config.migrationConfig;

  // Generate overview PRP
  files.push({
    path: path.join('PRPs', 'migration-overview.md'),
    content: generateMigrationOverviewPRP(config),
    description: 'Migration overview and strategy PRP',
  });

  // Generate phase-specific PRPs
  migration.migrationPhases.forEach((phase, index) => {
    files.push({
      path: path.join('PRPs', `phase-${phase.id}.md`),
      content: generatePhasePRP(config, phase, index),
      description: `Migration phase ${index + 1}: ${phase.name}`,
    });
  });

  // Generate rollback PRP
  files.push({
    path: path.join('PRPs', 'rollback-procedures.md'),
    content: generateRollbackPRP(config),
    description: 'Rollback procedures and recovery strategies',
  });

  // Generate validation PRP
  files.push({
    path: path.join('PRPs', 'migration-validation.md'),
    content: generateValidationPRP(config),
    description: 'Migration validation and testing procedures',
  });

  return files;
}

function generateMigrationOverviewPRP(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `# Migration Overview: ${migration.sourceStack.name} → ${migration.targetStack.name}

## Goal
Successfully migrate ${config.projectName} from ${migration.sourceStack.name} to ${migration.targetStack.name} using a ${migration.strategy} approach with zero data loss and minimal downtime.

## Why
- ${migration.sourceStack.name} limitations are constraining growth
- ${migration.targetStack.name} offers better performance and scalability
- Modernize tech stack for improved developer experience
- Reduce technical debt and maintenance burden

## What
Complete migration of all functionality from the existing ${migration.sourceStack.name} application to a new ${migration.targetStack.name} implementation while maintaining:
- All existing features and functionality
- Data integrity and consistency
- API compatibility for consumers
- Authentication and session management
- Performance benchmarks

## Strategy: ${migration.strategy}

${
  migration.strategy === 'parallel-run'
    ? `
### Parallel Run Implementation
1. **Phase 1**: Set up new ${migration.targetStack.name} application alongside existing
2. **Phase 2**: Implement shared resource connectivity (database, auth, cache)
3. **Phase 3**: Migrate features incrementally with feature flags
4. **Phase 4**: Gradual traffic shifting using load balancer
5. **Phase 5**: Monitor both systems and compare outputs
6. **Phase 6**: Complete cutover once confidence achieved
`
    : migration.strategy === 'incremental'
      ? `
### Incremental Migration Path
1. **Module Identification**: Break application into independent modules
2. **Priority Ordering**: Migrate least risky modules first
3. **API Gateway**: Use gateway to route between old and new
4. **Feature Flags**: Control feature activation per module
5. **Continuous Validation**: Test each module thoroughly
6. **Progressive Rollout**: Deploy modules as completed
`
      : `
### Big Bang Approach
1. **Complete Development**: Build entire new system in parallel
2. **Comprehensive Testing**: Full regression and load testing
3. **Data Migration**: One-time data transfer with validation
4. **Cutover Planning**: Detailed minute-by-minute plan
5. **Go Live**: Switch all traffic at once
6. **Intensive Monitoring**: 24/7 monitoring post-cutover
`
}

## Shared Resources Management

${migration.sharedResources
  .map(
    (resource) => `
### ${resource.name} (${resource.type})
**Criticality**: ${resource.criticalityLevel}  
**Strategy**: ${resource.migrationStrategy}

Key considerations:
- Maintain backward compatibility during migration
- Monitor for performance impacts
- Implement connection pooling if needed
- Document all configuration changes
`
  )
  .join('\n')}

## Risk Mitigation

${migration.rollbackStrategy.triggers
  .map(
    (trigger) => `
- **${trigger.condition}**: ${trigger.action} (${trigger.severity})
`
  )
  .join('\n')}

## Success Metrics
- Zero data loss during migration
- API response time within 10% of original
- All tests passing in new system
- Successful rollback demonstration
- No increase in error rates

## Validation Gates

### Level 1: Syntax & Style
\`\`\`bash
# New system
npm run lint
npm run typecheck

# Compatibility checks
npm run migration:lint
\`\`\`

### Level 2: Unit Tests
\`\`\`bash
# Run all unit tests
npm test

# Run migration-specific tests
npm run test:migration
\`\`\`

### Level 3: Integration Tests
\`\`\`bash
# Test shared resource connectivity
npm run test:integration:db
npm run test:integration:auth

# API compatibility tests
npm run test:api:compatibility
\`\`\`

### Level 4: End-to-End Validation
\`\`\`bash
# Parallel system comparison
npm run migration:compare

# Performance benchmarks
npm run migration:benchmark

# Data integrity verification
npm run migration:verify-data
\`\`\`

## Implementation Checklist

### Pre-Migration
- [ ] Complete backup of all systems
- [ ] Document current system state
- [ ] Set up monitoring for both systems
- [ ] Create rollback procedures
- [ ] Brief all stakeholders

### During Migration
- [ ] Follow phase-specific PRPs
- [ ] Checkpoint at each critical milestone
- [ ] Monitor system health continuously
- [ ] Document all changes and decisions
- [ ] Maintain communication with team

### Post-Migration
- [ ] Verify all success metrics
- [ ] Complete performance analysis
- [ ] Document lessons learned
- [ ] Plan old system decommission
- [ ] Celebrate success! 🎉

## Commands

- \`/migration-status\` - Check current progress
- \`/migration-checkpoint [phase]\` - Manual checkpoint
- \`/migration-validate\` - Run validation suite
- \`/migration-compare\` - Compare system outputs
- \`/migration-rollback\` - Emergency rollback

Remember: Safety first! When in doubt, checkpoint and verify.
`;
}

function generatePhasePRP(config: ProjectConfig, phase: any, index: number): string {
  const migration = config.migrationConfig!;

  return `# Phase ${index + 1}: ${phase.name}

## Goal
${phase.description}

## Duration
${phase.estimatedDuration}

## Dependencies
${phase.dependencies.length > 0 ? phase.dependencies.map((d: string) => `- ${d}`).join('\n') : '- None (can start immediately)'}

## Pre-Phase Checklist
- [ ] Previous phase(s) completed and validated
- [ ] Team briefed on phase objectives
- [ ] Rollback procedures reviewed
- [ ] Monitoring alerts configured
- [ ] Stakeholders notified

## Implementation Steps

### Step 1: Environment Preparation
\`\`\`bash
# Verify environment readiness
npm run migration:check-env

# Run pre-phase validation
npm run migration:validate --phase ${phase.id}
\`\`\`

### Step 2: Core Implementation

${
  phase.id === 'setup'
    ? `
#### Project Initialization
1. Create new ${migration.targetStack.name} project structure
2. Configure development environment
3. Set up version control and CI/CD
4. Install core dependencies
5. Configure linting and formatting

\`\`\`bash
# Initialize project
npx create-${migration.targetStack.name.toLowerCase()}-app ${config.projectName}-new

# Install dependencies
cd ${config.projectName}-new
npm install

# Set up development tools
npm install -D eslint prettier typescript
\`\`\`
`
    : phase.id === 'infrastructure'
      ? `
#### Infrastructure Setup
1. Configure database connections
2. Set up authentication middleware
3. Implement session management
4. Configure caching layer
5. Set up logging and monitoring

\`\`\`bash
# Test database connectivity
npm run db:test-connection

# Verify authentication flow
npm run auth:test

# Check shared resources
npm run migration:check-shared
\`\`\`
`
      : phase.id === 'features'
        ? `
#### Feature Migration
1. Identify feature dependencies
2. Migrate data models/schemas
3. Implement business logic
4. Create API endpoints
5. Build UI components
6. Add feature tests

\`\`\`bash
# Run feature tests
npm run test:features

# Verify API compatibility
npm run test:api:compat
\`\`\`
`
        : phase.id === 'data'
          ? `
#### Data Migration
1. Create migration scripts
2. Validate data mappings
3. Run test migrations
4. Verify data integrity
5. Performance optimization

\`\`\`bash
# Test migration scripts
npm run migration:test-scripts

# Dry run with sample data
npm run migration:dry-run

# Verify data integrity
npm run migration:verify-integrity
\`\`\`
`
          : `
#### ${phase.name} Implementation
1. Follow phase-specific requirements
2. Implement with testing at each step
3. Document all changes
4. Validate against criteria
5. Prepare for next phase
`
}

### Step 3: Validation

#### Validation Criteria
${phase.validationCriteria.map((criteria: string) => `- [ ] ${criteria}`).join('\n')}

#### Automated Tests
\`\`\`bash
# Run phase-specific tests
npm run test:${phase.id}

# Integration tests
npm run test:integration

# Performance benchmarks
npm run benchmark:${phase.id}
\`\`\`

### Step 4: Checkpoint
${
  phase.rollbackPoint
    ? `
⚠️ **CRITICAL ROLLBACK POINT**

Before proceeding:
1. Create system snapshot
2. Document current state
3. Test rollback procedure
4. Get stakeholder approval

\`\`\`bash
# Create checkpoint
npm run migration:checkpoint ${phase.id}

# Test rollback
npm run migration:test-rollback ${phase.id}
\`\`\`
`
    : `
This phase can be rolled forward if issues arise.

\`\`\`bash
# Create checkpoint
npm run migration:checkpoint ${phase.id}
\`\`\`
`
}

## Risk Management

### Phase-Specific Risks
${
  phase.risks
    .map(
      (risk: any) => `
**${risk.description}**
- Probability: ${risk.probability}
- Impact: ${risk.impact}
- Mitigation: ${risk.mitigation}
`
    )
    .join('\n') || 'No specific risks identified for this phase.'
}

### Monitoring
- System health dashboards
- Error rate tracking
- Performance metrics
- Resource utilization

## Rollback Procedure
${
  phase.rollbackPoint
    ? `
1. **Stop all services**
   \`\`\`bash
   npm run migration:stop-services
   \`\`\`

2. **Restore previous state**
   \`\`\`bash
   npm run migration:rollback ${phase.id}
   \`\`\`

3. **Verify rollback**
   \`\`\`bash
   npm run migration:verify-rollback
   \`\`\`

4. **Notify stakeholders**
   - Send rollback notification
   - Document issues encountered
   - Plan remediation
`
    : 'This phase supports rolling forward to fix issues rather than rolling back.'
}

## Post-Phase Activities
- [ ] Update migration documentation
- [ ] Log lessons learned
- [ ] Update risk registry
- [ ] Notify stakeholders of completion
- [ ] Prepare for next phase

## Commands
- \`/checkpoint ${phase.id}\` - Create phase checkpoint
- \`/validate ${phase.id}\` - Run validation suite
- \`/rollback ${phase.id}\` - Execute rollback (if applicable)
- \`/status ${phase.id}\` - Check phase status
`;
}

function generateRollbackPRP(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `# Rollback Procedures

## Goal
Provide clear, tested procedures to safely rollback the migration at any critical point with minimal disruption and zero data loss.

## Rollback Strategy Overview
- **Automatic Rollback**: ${migration.rollbackStrategy.automatic ? 'Enabled' : 'Manual approval required'}
- **Data Backup Required**: ${migration.rollbackStrategy.dataBackupRequired ? 'Yes' : 'No'}
- **Estimated Rollback Time**: ${migration.rollbackStrategy.estimatedTime}

## Rollback Triggers

### Automatic Triggers
${migration.rollbackStrategy.triggers
  .filter((t) => t.action === 'rollback')
  .map(
    (trigger) => `
**${trigger.condition}**
- Severity: ${trigger.severity}
- Action: Automatic rollback initiated
- Response time: < 5 minutes
`
  )
  .join('\n')}

### Manual Decision Points
${migration.rollbackStrategy.triggers
  .filter((t) => t.action !== 'rollback')
  .map(
    (trigger) => `
**${trigger.condition}**
- Severity: ${trigger.severity}
- Action: ${trigger.action}
- Decision required within: 30 minutes
`
  )
  .join('\n')}

## Phase-Specific Rollback Procedures

${migration.rollbackStrategy.procedures
  .map(
    (proc) => `
### Rollback: ${proc.phase}

**Estimated Duration**: ${proc.estimatedDuration}

#### Steps
${proc.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

#### Verification Points
${proc.verificationPoints.map((point) => `- [ ] ${point}`).join('\n')}

#### Rollback Commands
\`\`\`bash
# Initiate rollback
npm run rollback:${proc.phase}

# Verify rollback success
npm run verify:rollback:${proc.phase}

# Check system health
npm run health:check
\`\`\`
`
  )
  .join('\n')}

## Data Rollback Procedures

${
  migration.rollbackStrategy.dataBackupRequired
    ? `
### Database Rollback
1. **Stop all write operations**
   \`\`\`sql
   -- Set database to read-only
   ALTER DATABASE ${config.projectName} SET READ_ONLY;
   \`\`\`

2. **Create rollback point**
   \`\`\`bash
   npm run db:create-restore-point
   \`\`\`

3. **Restore from backup**
   \`\`\`bash
   npm run db:restore --point pre-migration
   \`\`\`

4. **Verify data integrity**
   \`\`\`bash
   npm run db:verify-integrity
   \`\`\`

5. **Resume operations**
   \`\`\`sql
   -- Set database to read-write
   ALTER DATABASE ${config.projectName} SET READ_WRITE;
   \`\`\`
`
    : `
### No Database Rollback Required
The migration strategy does not modify existing data structures, so database rollback is not necessary.
`
}

## Emergency Procedures

### Critical Failure Response
1. **Immediate Actions** (< 5 minutes)
   - Execute emergency stop: \`npm run emergency:stop\`
   - Notify incident response team
   - Begin impact assessment

2. **Stabilization** (5-15 minutes)
   - Route all traffic to stable system
   - Disable problematic components
   - Implement emergency patches if possible

3. **Recovery Decision** (15-30 minutes)
   - Assess rollback necessity
   - Choose: rollback, roll forward, or hybrid approach
   - Execute decision with team consensus

### Communication Plan
- **Internal**: Slack #migration-status channel
- **Stakeholders**: Email templates in /templates/rollback
- **Customers**: Status page updates
- **Post-mortem**: Schedule within 48 hours

## Rollback Testing

### Pre-Migration Tests
\`\`\`bash
# Test each rollback procedure
npm run test:rollback:all

# Simulate failure scenarios
npm run test:rollback:simulate-failures

# Verify backup restoration
npm run test:backup:restore
\`\`\`

### Validation After Rollback
- [ ] All services operational
- [ ] Data integrity confirmed
- [ ] No residual migration artifacts
- [ ] Performance metrics normal
- [ ] Error rates at baseline

## Recovery Planning

### Post-Rollback Actions
1. **Root Cause Analysis**
   - Gather all logs and metrics
   - Interview team members
   - Document timeline of events

2. **Remediation Planning**
   - Address identified issues
   - Update migration plan
   - Enhance testing procedures

3. **Re-attempt Strategy**
   - Minimum 48-hour cooling period
   - Additional safeguards implemented
   - Expanded rollback procedures

## Commands Reference
- \`/rollback\` - Interactive rollback wizard
- \`/rollback [phase]\` - Rollback specific phase
- \`/rollback status\` - Check rollback capability
- \`/rollback test\` - Test rollback procedures
- \`/rollback verify\` - Verify system after rollback

Remember: A successful rollback is better than a failed migration. Don't hesitate to pull the trigger if needed.
`;
}

function generateValidationPRP(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `# Migration Validation & Testing

## Goal
Ensure the migrated system maintains 100% feature parity, meets performance requirements, and preserves data integrity throughout the migration process.

## Validation Strategy

### Continuous Validation
- Automated tests run on every commit
- Hourly health checks during migration
- Real-time monitoring dashboards
- Automated rollback on critical failures

### Phase Gate Validation
- Comprehensive testing before phase completion
- Stakeholder sign-off requirements
- Performance benchmarking
- Security scanning

## Test Categories

### 1. Functional Testing

#### Feature Parity Tests
\`\`\`bash
# Run full feature comparison
npm run test:feature-parity

# Specific feature validation
npm run test:feature --name authentication
npm run test:feature --name api-endpoints
\`\`\`

#### API Compatibility
\`\`\`bash
# Compare API responses
npm run test:api:compare

# Contract testing
npm run test:api:contracts

# Breaking change detection
npm run test:api:breaking-changes
\`\`\`

### 2. Data Validation

#### Integrity Checks
\`\`\`bash
# Row count validation
npm run validate:data:counts

# Checksum verification
npm run validate:data:checksums

# Relationship integrity
npm run validate:data:relationships
\`\`\`

#### Migration Accuracy
\`\`\`bash
# Sample data comparison
npm run validate:data:sample --size 1000

# Full data audit (resource intensive)
npm run validate:data:full
\`\`\`

### 3. Performance Testing

#### Baseline Comparison
\`\`\`yaml
Performance Targets:
- API Response Time: ±10% of baseline
- Database Queries: ±15% of baseline
- Memory Usage: <120% of baseline
- CPU Usage: <110% of baseline
\`\`\`

#### Load Testing
\`\`\`bash
# Standard load test
npm run test:load:standard

# Peak load simulation
npm run test:load:peak

# Stress testing
npm run test:load:stress
\`\`\`

### 4. Security Validation

#### Security Scanning
\`\`\`bash
# Vulnerability scanning
npm run security:scan

# Dependency audit
npm run security:audit

# OWASP compliance check
npm run security:owasp
\`\`\`

#### Access Control
\`\`\`bash
# Permission matrix validation
npm run test:auth:permissions

# Session management
npm run test:auth:sessions

# Token validation
npm run test:auth:tokens
\`\`\`

## Shared Resource Validation

${migration.sharedResources
  .map(
    (resource) => `
### ${resource.name} Validation

#### Connectivity Tests
\`\`\`bash
# Test connection from both systems
npm run test:shared:${resource.type}:connection

# Performance impact assessment
npm run test:shared:${resource.type}:performance

# Concurrent access testing
npm run test:shared:${resource.type}:concurrent
\`\`\`

#### Compatibility Verification
- Schema compatibility (if applicable)
- Protocol version matching
- Authentication mechanism alignment
- Connection pooling behavior
`
  )
  .join('\n')}

## Validation Automation

### Continuous Integration
\`\`\`yaml
# .github/workflows/migration-validation.yml
name: Migration Validation
on:
  push:
    branches: [migration/*]
  schedule:
    - cron: '0 * * * *' # Hourly validation

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run validation suite
        run: npm run validate:all
      - name: Compare systems
        run: npm run migration:compare
      - name: Check rollback readiness
        run: npm run rollback:check
\`\`\`

### Monitoring Dashboard
- Real-time system comparison
- Drift detection alerts
- Performance deviation tracking
- Error rate analysis
- Data consistency metrics

## Validation Checkpoints

### Pre-Migration Validation
- [ ] All tests passing in current system
- [ ] Backup verification completed
- [ ] Rollback procedures tested
- [ ] Performance baselines recorded
- [ ] Security scan completed

### Per-Phase Validation
- [ ] Phase requirements met
- [ ] No regression in completed features
- [ ] Performance within thresholds
- [ ] Data integrity maintained
- [ ] Rollback capability confirmed

### Final Validation
- [ ] 100% feature parity achieved
- [ ] All performance targets met
- [ ] Security requirements satisfied
- [ ] Data migration accuracy confirmed
- [ ] Stakeholder acceptance received

## Validation Reports

### Automated Reports
\`\`\`bash
# Generate validation report
npm run report:validation

# Performance comparison report
npm run report:performance

# Data integrity report
npm run report:data-integrity

# Executive summary
npm run report:executive
\`\`\`

### Report Distribution
- Technical team: Detailed reports via Slack
- Stakeholders: Executive summaries via email
- Compliance: Audit trail in documentation system

## Issue Resolution

### Validation Failure Protocol
1. **Immediate Actions**
   - Pause migration activities
   - Capture all relevant logs
   - Notify migration team

2. **Analysis**
   - Identify root cause
   - Assess impact scope
   - Determine fix vs rollback

3. **Resolution**
   - Implement fix if minor
   - Execute rollback if major
   - Re-validate after resolution

## Commands
- \`/validate\` - Run full validation suite
- \`/validate [category]\` - Run specific validation
- \`/compare\` - Compare old vs new system
- \`/report\` - Generate validation report
- \`/drift-check\` - Check for system drift

Remember: Trust but verify. Every assumption should be validated with data.
`;
}

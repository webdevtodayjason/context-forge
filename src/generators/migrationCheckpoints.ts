import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import path from 'path';

export async function generateMigrationCheckpoints(
  config: ProjectConfig
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (!config.migrationConfig || !config.extras.checkpoints) {
    return files;
  }

  // Generate migration status command
  files.push({
    path: path.join('.claude', 'commands', 'migration', 'migration-status.md'),
    content: generateMigrationStatusCommand(config),
    description: 'Migration status tracking command',
  });

  // Generate migration checkpoint command
  files.push({
    path: path.join('.claude', 'commands', 'migration', 'migration-checkpoint.md'),
    content: generateMigrationCheckpointCommand(config),
    description: 'Migration checkpoint verification command',
  });

  // Generate migration validate command
  files.push({
    path: path.join('.claude', 'commands', 'migration', 'migration-validate.md'),
    content: generateMigrationValidateCommand(config),
    description: 'Migration validation command',
  });

  // Generate migration compare command
  files.push({
    path: path.join('.claude', 'commands', 'migration', 'migration-compare.md'),
    content: generateMigrationCompareCommand(config),
    description: 'System comparison command',
  });

  // Generate migration rollback command
  files.push({
    path: path.join('.claude', 'commands', 'migration', 'migration-rollback.md'),
    content: generateMigrationRollbackCommand(config),
    description: 'Migration rollback command',
  });

  return files;
}

function generateMigrationStatusCommand(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `---
name: migration-status
category: Migration
description: Check current migration progress and phase status
---

# Migration Status

## Command
\`/migration-status\`

## Description
Displays the current migration progress, including completed phases, current phase status, and upcoming milestones.

## Purpose
- Track overall migration progress
- Identify current phase and tasks
- Review completed checkpoints
- Plan next steps

## Usage
\`\`\`
/migration-status
\`\`\`

## Implementation

### Phase Status Check
\`\`\`bash
# Check migration progress markers
ls -la .migration/phases/

# Show current phase
cat .migration/current-phase.json

# List completed checkpoints
cat .migration/checkpoints-log.json
\`\`\`

### Progress Report
\`\`\`javascript
// Progress calculation
const phases = ${JSON.stringify(
    migration.migrationPhases.map((p) => ({
      id: p.id,
      name: p.name,
      estimatedDuration: p.estimatedDuration,
    })),
    null,
    2
  )};

const completedPhases = [/* Read from .migration/phases/ */];
const currentPhase = /* Read from .migration/current-phase.json */;

const progress = {
  total: phases.length,
  completed: completedPhases.length,
  current: currentPhase,
  percentage: Math.round((completedPhases.length / phases.length) * 100)
};
\`\`\`

### Status Template
\`\`\`markdown
# Migration Status Report

## Overview
- **Strategy**: ${migration.strategy}
- **Risk Level**: ${migration.riskLevel}
- **Progress**: {percentage}%

## Completed Phases
{completedPhases.map(phase => '✅ ' + phase.name).join('\\n')}

## Current Phase
🔄 **{currentPhase.name}**
- Started: {currentPhase.startDate}
- Estimated completion: {currentPhase.estimatedEnd}
- Tasks completed: {currentPhase.tasksCompleted}/{currentPhase.totalTasks}

## Upcoming Phases
{upcomingPhases.map(phase => '⏳ ' + phase.name).join('\\n')}

## Critical Resources
${migration.sharedResources
  .filter((r) => r.criticalityLevel === 'critical')
  .map((r) => `- ${r.name} (${r.type}): ${r.migrationStrategy}`)
  .join('\\n')}

## Recent Checkpoints
{recentCheckpoints.map(cp => cp.timestamp + ': ' + cp.name).join('\\n')}

## Health Check
- Old System: {oldSystemHealth}
- New System: {newSystemHealth}
- Shared Resources: {sharedResourcesHealth}
\`\`\`

## Example Output
\`\`\`
Migration Status Report
======================

Overview
--------
- Strategy: parallel-run
- Risk Level: high
- Progress: 40%

Completed Phases
---------------
✅ Setup and Planning
✅ Core Infrastructure Migration

Current Phase
------------
🔄 Feature Migration
- Started: 2024-01-15
- Estimated completion: 2024-01-29
- Tasks completed: 3/8

Upcoming Phases
--------------
⏳ Data Migration
⏳ Production Cutover

Critical Resources
-----------------
- Production Database (database): Maintain compatibility during migration
- Authentication System (auth): Maintain session compatibility

Recent Checkpoints
-----------------
2024-01-17 09:30: Database Connection Verified
2024-01-16 14:22: Infrastructure Setup Complete
2024-01-15 10:00: Migration Started

Health Check
-----------
- Old System: ✅ Healthy
- New System: ✅ Healthy
- Shared Resources: ✅ All Connected
\`\`\`

## Error Handling
- Missing migration directory: Initialize with \`/migration-init\`
- No current phase: Start migration with phase 1
- Invalid phase data: Repair or rollback to last checkpoint

## Related Commands
- \`/migration-checkpoint\` - Create or verify checkpoint
- \`/migration-validate\` - Run validation tests
- \`/migration-logs\` - View detailed logs
`;
}

function generateMigrationCheckpointCommand(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `---
name: migration-checkpoint
category: Migration
description: Create or verify migration checkpoints
---

# Migration Checkpoint

## Command
\`/migration-checkpoint [phase-id]\`

## Description
Creates a checkpoint at the current migration state or verifies a specific phase checkpoint. This is critical for safe rollback capability.

## Purpose
- Create recovery points during migration
- Verify system state before proceeding
- Enable safe rollback if needed
- Document migration milestones

## Usage
\`\`\`
# Create checkpoint for current state
/migration-checkpoint

# Verify specific phase checkpoint
/migration-checkpoint infrastructure

# Create checkpoint with description
/migration-checkpoint --message "Pre-data-migration backup"
\`\`\`

## Implementation

### Checkpoint Creation
\`\`\`bash
#!/bin/bash
# checkpoint.sh

PHASE_ID=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CHECKPOINT_DIR=".migration/checkpoints/$TIMESTAMP"

# Create checkpoint directory
mkdir -p "$CHECKPOINT_DIR"

# Save current state
echo "Creating checkpoint at $TIMESTAMP..."

# 1. Configuration snapshot
cp -r config/ "$CHECKPOINT_DIR/config/"
cp .env "$CHECKPOINT_DIR/.env"

# 2. Database state marker
echo "Recording database state..."
npm run db:checkpoint -- --tag "$TIMESTAMP"

# 3. Service health snapshot
curl -s http://localhost:3000/health > "$CHECKPOINT_DIR/old-system-health.json"
curl -s http://localhost:4000/health > "$CHECKPOINT_DIR/new-system-health.json"

# 4. Migration metadata
cat > "$CHECKPOINT_DIR/metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "phase": "$PHASE_ID",
  "description": "$2",
  "oldSystemVersion": "$(git rev-parse HEAD)",
  "newSystemVersion": "$(cd ../new-system && git rev-parse HEAD)",
  "sharedResources": ${JSON.stringify(
    migration.sharedResources.map((r) => ({
      name: r.name,
      type: r.type,
      status: 'connected',
    }))
  )}
}
EOF

echo "✅ Checkpoint created: $CHECKPOINT_DIR"
\`\`\`

### Checkpoint Verification
\`\`\`javascript
// verify-checkpoint.js
const fs = require('fs');
const path = require('path');

async function verifyCheckpoint(checkpointId) {
  const checkpointDir = path.join('.migration/checkpoints', checkpointId);
  
  const checks = {
    configExists: fs.existsSync(path.join(checkpointDir, 'config')),
    envExists: fs.existsSync(path.join(checkpointDir, '.env')),
    healthDataExists: fs.existsSync(path.join(checkpointDir, 'old-system-health.json')),
    metadataValid: false,
    databaseCheckpoint: false
  };
  
  // Verify metadata
  try {
    const metadata = JSON.parse(
      fs.readFileSync(path.join(checkpointDir, 'metadata.json'), 'utf8')
    );
    checks.metadataValid = metadata.timestamp && metadata.phase;
  } catch (e) {
    console.error('Invalid metadata:', e);
  }
  
  // Verify database checkpoint
  const dbCheckpoint = await verifyDatabaseCheckpoint(checkpointId);
  checks.databaseCheckpoint = dbCheckpoint.success;
  
  return checks;
}
\`\`\`

### Checkpoint Template
\`\`\`markdown
# Migration Checkpoint: {timestamp}

## Phase: {phaseName}
**Created**: {createdDate}
**Description**: {description}

## System State
### Old System
- Version: {oldSystemVersion}
- Health: {oldSystemHealth}
- Active Users: {activeUsers}

### New System  
- Version: {newSystemVersion}
- Health: {newSystemHealth}
- Features Migrated: {featureCount}

## Shared Resources
{sharedResources.map(r => '- ' + r.name + ': ' + r.status).join('\\n')}

## Validation Results
- Configuration: {configCheck}
- Database State: {databaseCheck}
- API Compatibility: {apiCheck}
- Performance: {performanceCheck}

## Rollback Information
This checkpoint can be used to rollback to this state using:
\`\`\`
/migration-rollback {checkpointId}
\`\`\`

## Notes
{notes}
\`\`\`

## Automated Checks
${
  migration.checkpoints
    ?.map(
      (cp) => `
### ${cp.name}
- **Phase**: ${cp.phaseId}
- **Description**: ${cp.description}
- **Requires Approval**: ${cp.requiresApproval ? 'Yes' : 'No'}
- **Rollback Enabled**: ${cp.rollbackEnabled ? 'Yes' : 'No'}

#### Validation Steps
${cp.validationSteps.map((step) => `1. ${step}`).join('\\n')}
`
    )
    .join('\\n') || 'No automated checkpoints configured'
}

## Error Handling
- Checkpoint creation failed: Check disk space and permissions
- Database checkpoint failed: Verify database connectivity
- Health check timeout: Services may be under load

## Related Commands
- \`/migration-status\` - View current progress
- \`/migration-rollback\` - Rollback to checkpoint
- \`/migration-validate\` - Run validation suite
`;
}

function generateMigrationValidateCommand(_config: ProjectConfig): string {
  return `---
name: migration-validate
category: Migration
description: Run comprehensive migration validation tests
---

# Migration Validate

## Command
\`/migration-validate [--phase <phase-id>] [--type <validation-type>]

## Description
Runs validation tests to ensure migration integrity, including feature parity, data consistency, performance benchmarks, and API compatibility.

## Purpose
- Verify feature parity between systems
- Check data integrity
- Validate API compatibility
- Ensure performance requirements are met

## Usage
\`\`\`
# Run all validations
/migration-validate

# Validate specific phase
/migration-validate --phase infrastructure

# Run specific validation type
/migration-validate --type api-compatibility
/migration-validate --type data-integrity
/migration-validate --type performance
\`\`\`

## Validation Types

### 1. Feature Parity
\`\`\`javascript
// feature-parity-test.js
const oldSystemFeatures = require('./old-system-features.json');
const newSystemFeatures = require('./new-system-features.json');

function validateFeatureParity() {
  const results = {
    total: oldSystemFeatures.length,
    implemented: 0,
    missing: [],
    partial: []
  };
  
  oldSystemFeatures.forEach(feature => {
    const newFeature = newSystemFeatures.find(f => f.id === feature.id);
    if (!newFeature) {
      results.missing.push(feature);
    } else if (newFeature.status === 'partial') {
      results.partial.push(feature);
    } else {
      results.implemented++;
    }
  });
  
  return results;
}
\`\`\`

### 2. API Compatibility
\`\`\`bash
# api-compatibility-test.sh
#!/bin/bash

echo "Running API compatibility tests..."

# Test each endpoint
while read -r endpoint; do
  echo "Testing $endpoint..."
  
  # Get response from old system
  OLD_RESPONSE=$(curl -s "http://old-system.com$endpoint")
  
  # Get response from new system
  NEW_RESPONSE=$(curl -s "http://new-system.com$endpoint")
  
  # Compare responses
  if [ "$OLD_RESPONSE" != "$NEW_RESPONSE" ]; then
    echo "❌ Mismatch on $endpoint"
    echo "$OLD_RESPONSE" > "/tmp/old_$endpoint.json"
    echo "$NEW_RESPONSE" > "/tmp/new_$endpoint.json"
    diff "/tmp/old_$endpoint.json" "/tmp/new_$endpoint.json"
  else
    echo "✅ $endpoint matches"
  fi
done < api-endpoints.txt
\`\`\`

### 3. Data Integrity
\`\`\`sql
-- data-integrity-check.sql
-- Compare row counts
SELECT 
  'users' as table_name,
  (SELECT COUNT(*) FROM old_db.users) as old_count,
  (SELECT COUNT(*) FROM new_db.users) as new_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM old_db.users) = (SELECT COUNT(*) FROM new_db.users)
    THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
UNION ALL
SELECT 
  'orders' as table_name,
  (SELECT COUNT(*) FROM old_db.orders) as old_count,
  (SELECT COUNT(*) FROM new_db.orders) as new_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM old_db.orders) = (SELECT COUNT(*) FROM new_db.orders)
    THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status;

-- Check data consistency
SELECT COUNT(*) as orphaned_records
FROM new_db.order_items oi
LEFT JOIN new_db.orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
\`\`\`

### 4. Performance Benchmarks
\`\`\`javascript
// performance-test.js
const autocannon = require('autocannon');

async function runPerformanceTest() {
  const scenarios = [
    { url: 'http://old-system.com/api/users', title: 'Old System - Users API' },
    { url: 'http://new-system.com/api/users', title: 'New System - Users API' }
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    const result = await autocannon({
      url: scenario.url,
      connections: 10,
      duration: 30,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    results.push({
      title: scenario.title,
      requests: result.requests,
      latency: result.latency,
      throughput: result.throughput
    });
  }
  
  return comparePerformance(results);
}
\`\`\`

## Validation Report Template
\`\`\`markdown
# Migration Validation Report

**Date**: {date}
**Phase**: {phase}
**Overall Status**: {status}

## Feature Parity
- Total Features: {totalFeatures}
- Implemented: {implemented} ({implementedPercent}%)
- Partial: {partial}
- Missing: {missing}

### Missing Features
{missingFeatures.map(f => '- ' + f.name + ' (' + f.priority + ')').join('\\n')}

## API Compatibility
- Endpoints Tested: {endpointCount}
- Matching: {matching} ({matchingPercent}%)
- Mismatches: {mismatches}

### API Mismatches
{apiMismatches.map(m => '- ' + m.endpoint + ': ' + m.issue).join('\\n')}

## Data Integrity
- Tables Verified: {tableCount}
- Row Count Matches: {rowMatches}
- Data Consistency: {consistency}
- Orphaned Records: {orphaned}

## Performance Comparison
| Metric | Old System | New System | Difference |
|--------|------------|------------|------------|
| Avg Response Time | {oldAvgResponse} | {newAvgResponse} | {responseDiff} |
| Requests/sec | {oldRPS} | {newRPS} | {rpsDiff} |
| 95th Percentile | {oldP95} | {newP95} | {p95Diff} |
| Error Rate | {oldErrors} | {newErrors} | {errorDiff} |

## Recommendations
{recommendations.map(r => '- ' + r).join('\\n')}

## Next Steps
{nextSteps.map(s => '1. ' + s).join('\\n')}
\`\`\`

## Error Handling
- Connection failures: Check service availability
- Authentication errors: Verify shared credentials
- Timeout errors: Increase test duration or reduce load

## Related Commands
- \`/migration-status\` - Check overall progress
- \`/migration-checkpoint\` - Create recovery point
- \`/migration-compare\` - Detailed system comparison
`;
}

function generateMigrationCompareCommand(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `---
name: migration-compare
category: Migration
description: Compare old and new systems side-by-side
---

# Migration Compare

## Command
\`/migration-compare [--aspect <aspect>] [--output <format>]\`

## Description
Performs detailed comparison between the old and new systems, including features, performance, data, and behavior.

## Purpose
- Identify differences between systems
- Validate migration completeness
- Detect regression issues
- Generate comparison reports

## Usage
\`\`\`
# Full system comparison
/migration-compare

# Compare specific aspect
/migration-compare --aspect features
/migration-compare --aspect performance
/migration-compare --aspect api

# Output format
/migration-compare --output json
/migration-compare --output html
\`\`\`

## Comparison Aspects

### System Architecture
\`\`\`yaml
Old System:
  Stack: ${migration.sourceStack.name}
  Database: PostgreSQL
  Cache: Redis
  Auth: JWT

New System:
  Stack: ${migration.targetStack.name}
  Database: PostgreSQL (shared)
  Cache: Redis (shared)
  Auth: JWT (compatible)
\`\`\`

### Feature Comparison
\`\`\`javascript
const featureComparison = {
  authentication: {
    old: ['email-login', 'oauth', 'two-factor'],
    new: ['email-login', 'oauth', 'two-factor', 'biometric'],
    status: 'enhanced'
  },
  api: {
    old: ['rest', 'webhooks'],
    new: ['rest', 'graphql', 'webhooks', 'websocket'],
    status: 'enhanced'
  },
  // ... more features
};
\`\`\`

### Performance Metrics
\`\`\`javascript
async function comparePerformance() {
  const metrics = await Promise.all([
    getMetrics('http://old-system.com'),
    getMetrics('http://new-system.com')
  ]);
  
  return {
    responseTime: {
      old: metrics[0].avgResponseTime,
      new: metrics[1].avgResponseTime,
      improvement: calculateImprovement(metrics[0].avgResponseTime, metrics[1].avgResponseTime)
    },
    throughput: {
      old: metrics[0].requestsPerSecond,
      new: metrics[1].requestsPerSecond,
      improvement: calculateImprovement(metrics[0].requestsPerSecond, metrics[1].requestsPerSecond)
    },
    errorRate: {
      old: metrics[0].errorRate,
      new: metrics[1].errorRate,
      improvement: calculateImprovement(metrics[0].errorRate, metrics[1].errorRate)
    }
  };
}
\`\`\`

### Data Comparison
\`\`\`sql
-- Record count comparison
WITH comparisons AS (
  SELECT 
    table_name,
    old_count,
    new_count,
    new_count - old_count as difference,
    ROUND((new_count - old_count) * 100.0 / old_count, 2) as percent_change
  FROM (
    SELECT 
      t.table_name,
      (SELECT COUNT(*) FROM old_db.t.table_name) as old_count,
      (SELECT COUNT(*) FROM new_db.t.table_name) as new_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
  ) counts
)
SELECT * FROM comparisons
ORDER BY ABS(percent_change) DESC;
\`\`\`

## Comparison Report Template
\`\`\`markdown
# System Comparison Report

**Generated**: {timestamp}
**Migration Strategy**: ${migration.strategy}

## Executive Summary
- **Overall Compatibility**: {compatibilityScore}%
- **Performance Impact**: {performanceImpact}
- **Feature Coverage**: {featureCoverage}%
- **Risk Assessment**: {riskLevel}

## Detailed Comparison

### 🏗️ Architecture Changes
| Component | Old System | New System | Impact |
|-----------|------------|------------|---------|
| Framework | ${migration.sourceStack.name} | ${migration.targetStack.name} | Major |
| Database | {oldDb} | {newDb} | {dbImpact} |
| Caching | {oldCache} | {newCache} | {cacheImpact} |

### 📊 Performance Comparison
| Metric | Old | New | Change |
|--------|-----|-----|--------|
| Avg Response Time | {oldResponse}ms | {newResponse}ms | {responseChange} |
| Throughput | {oldThroughput} req/s | {newThroughput} req/s | {throughputChange} |
| Memory Usage | {oldMemory}MB | {newMemory}MB | {memoryChange} |
| CPU Usage | {oldCpu}% | {newCpu}% | {cpuChange} |

### 🔧 Feature Comparison
| Feature | Old | New | Status |
|---------|-----|-----|---------|
{features.map(f => '| ' + f.name + ' | ' + f.oldStatus + ' | ' + f.newStatus + ' | ' + f.comparison + ' |').join('\\n')}

### 🔌 API Compatibility
- **Endpoints Analyzed**: {endpointCount}
- **Fully Compatible**: {compatible} ({compatiblePercent}%)
- **Modified**: {modified}
- **New**: {new}
- **Deprecated**: {deprecated}

### 💾 Data Integrity
- **Tables Compared**: {tableCount}
- **Matching Records**: {matchingRecords}%
- **Data Consistency**: {consistency}
- **Schema Changes**: {schemaChanges}

## Risk Analysis
${migration.rollbackStrategy.triggers
  .map(
    (risk) => `
### ${risk.condition}
- **Severity**: ${risk.severity}
- **Action**: ${risk.action}
`
  )
  .join('\\n')}

## Recommendations
1. {recommendation1}
2. {recommendation2}
3. {recommendation3}

## Appendix
- Full API diff: \`/tmp/api-diff-{timestamp}.json\`
- Performance traces: \`/tmp/perf-traces-{timestamp}/\`
- Query analysis: \`/tmp/query-analysis-{timestamp}.sql\`
\`\`\`

## Error Handling
- Service unreachable: Verify both systems are running
- Authentication mismatch: Check shared credentials
- Timeout during comparison: Reduce scope or increase limits

## Related Commands
- \`/migration-validate\` - Run validation tests
- \`/migration-status\` - Check migration progress
- \`/migration-report\` - Generate executive report
`;
}

function generateMigrationRollbackCommand(config: ProjectConfig): string {
  const migration = config.migrationConfig!;

  return `---
name: migration-rollback
category: Migration
description: Execute rollback to a previous migration state
---

# Migration Rollback

## Command
\`/migration-rollback [checkpoint-id] [--phase <phase-id>] [--force]\`

## Description
Safely rollback the migration to a previous checkpoint or phase. This command handles service restoration, data rollback, and configuration recovery.

## Purpose
- Recover from migration failures
- Restore system to known good state
- Minimize downtime during issues
- Preserve data integrity

## Usage
\`\`\`
# Rollback to latest checkpoint
/migration-rollback

# Rollback to specific checkpoint
/migration-rollback 20240117_143022

# Rollback specific phase
/migration-rollback --phase infrastructure

# Force rollback (skip confirmations)
/migration-rollback --force
\`\`\`

## Rollback Strategy
${migration.rollbackStrategy.automatic ? '**Automatic Rollback**: Enabled' : '**Manual Rollback**: Confirmation required'}
**Estimated Time**: ${migration.rollbackStrategy.estimatedTime}
**Data Backup Required**: ${migration.rollbackStrategy.dataBackupRequired ? 'Yes' : 'No'}

## Rollback Triggers
${migration.rollbackStrategy.triggers
  .map(
    (trigger) => `
### ${trigger.condition}
- **Severity**: ${trigger.severity}
- **Action**: ${trigger.action}
`
  )
  .join('\\n')}

## Rollback Procedures

${migration.rollbackStrategy.procedures
  .map(
    (proc) => `
### Phase: ${proc.phase}
**Estimated Duration**: ${proc.estimatedDuration}

#### Steps
${proc.steps.map((step, i) => `${i + 1}. ${step}`).join('\\n')}

#### Verification
${proc.verificationPoints.map((point) => `- [ ] ${point}`).join('\\n')}
`
  )
  .join('\\n')}

## Implementation

### Pre-Rollback Checks
\`\`\`bash
#!/bin/bash
# pre-rollback-checks.sh

echo "🔍 Running pre-rollback checks..."

# 1. Verify checkpoint exists
if [ ! -d ".migration/checkpoints/$CHECKPOINT_ID" ]; then
  echo "❌ Checkpoint $CHECKPOINT_ID not found"
  exit 1
fi

# 2. Check current system state
CURRENT_STATE=$(curl -s http://localhost:3000/health)
if [ "$CURRENT_STATE" == "healthy" ]; then
  echo "⚠️  Current system is healthy. Are you sure you want to rollback?"
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. Verify rollback capability
${
  migration.rollbackStrategy.dataBackupRequired
    ? `
if ! npm run db:can-rollback -- --checkpoint "$CHECKPOINT_ID"; then
  echo "❌ Database rollback not possible from this checkpoint"
  exit 1
fi
`
    : '# No database rollback required'
}

echo "✅ Pre-rollback checks passed"
\`\`\`

### Rollback Execution
\`\`\`bash
#!/bin/bash
# execute-rollback.sh

CHECKPOINT_ID=$1
CHECKPOINT_DIR=".migration/checkpoints/$CHECKPOINT_ID"

echo "🔄 Starting rollback to checkpoint $CHECKPOINT_ID..."

# 1. Stop services
echo "Stopping services..."
npm run migration:stop-services

# 2. Restore configuration
echo "Restoring configuration..."
cp -r "$CHECKPOINT_DIR/config/"* config/
cp "$CHECKPOINT_DIR/.env" .env

${
  migration.rollbackStrategy.dataBackupRequired
    ? `
# 3. Restore database
echo "Restoring database state..."
npm run db:restore -- --checkpoint "$CHECKPOINT_ID"
`
    : '# 3. No database restoration needed'
}

# 4. Switch traffic routing
echo "Switching traffic to old system..."
npm run migration:switch-traffic -- --target old

# 5. Restart services
echo "Restarting services..."
npm run migration:start-services -- --config old

# 6. Verify rollback
echo "Verifying rollback..."
npm run migration:verify-rollback -- --checkpoint "$CHECKPOINT_ID"

echo "✅ Rollback completed successfully"
\`\`\`

### Post-Rollback Verification
\`\`\`javascript
// verify-rollback.js
async function verifyRollback(checkpointId) {
  const checks = {
    servicesRunning: false,
    configurationRestored: false,
    databaseConsistent: false,
    apiResponding: false,
    dataIntegrity: false
  };
  
  // Check services
  checks.servicesRunning = await checkServices(['web', 'api', 'worker']);
  
  // Verify configuration
  const currentConfig = await loadConfig();
  const checkpointConfig = await loadCheckpointConfig(checkpointId);
  checks.configurationRestored = deepEqual(currentConfig, checkpointConfig);
  
  // Database consistency
  if (${migration.rollbackStrategy.dataBackupRequired}) {
    checks.databaseConsistent = await verifyDatabaseState(checkpointId);
  } else {
    checks.databaseConsistent = true;
  }
  
  // API health
  checks.apiResponding = await checkApiHealth();
  
  // Data integrity
  checks.dataIntegrity = await runDataIntegrityChecks();
  
  return checks;
}
\`\`\`

## Rollback Report Template
\`\`\`markdown
# Rollback Report

**Initiated**: {timestamp}
**Checkpoint**: {checkpointId}
**Reason**: {rollbackReason}
**Duration**: {duration}

## Pre-Rollback State
- System Health: {preHealth}
- Active Users: {preUsers}
- Error Rate: {preErrors}

## Rollback Actions
✅ Services stopped
✅ Configuration restored from checkpoint
${migration.rollbackStrategy.dataBackupRequired ? '✅ Database restored' : '✓ Database unchanged (shared resource)'}
✅ Traffic routed to old system
✅ Services restarted

## Post-Rollback Verification
- [ ] All services operational
- [ ] Configuration matches checkpoint
- [ ] Database integrity verified
- [ ] API responses normal
- [ ] No data loss detected

## Impact Analysis
- **Downtime**: {downtime}
- **Users Affected**: {affectedUsers}
- **Data Loss**: {dataLoss}
- **Features Reverted**: {revertedFeatures}

## Root Cause
{rootCause}

## Lessons Learned
1. {lesson1}
2. {lesson2}
3. {lesson3}

## Next Steps
1. Address root cause
2. Update migration plan
3. Strengthen validation tests
4. Schedule retry with fixes

## Commands for Recovery
\`\`\`bash
# View detailed logs
/migration-logs --from {rollbackStart} --to {rollbackEnd}

# Check system health
/migration-health

# Plan next attempt
/migration-plan --incorporate-learnings
\`\`\`
\`\`\`

## Error Handling
- Checkpoint not found: List available checkpoints
- Rollback failed: Try previous checkpoint
- Data corruption: Restore from external backup
- Service won't start: Check logs and configuration

## Related Commands
- \`/migration-status\` - Check current state
- \`/migration-checkpoint\` - List checkpoints
- \`/migration-health\` - System health check
- \`/migration-logs\` - View detailed logs
`;
}

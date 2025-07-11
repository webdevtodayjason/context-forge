import { ProjectConfig, CheckpointCommand, CheckpointTrigger } from '../types';

export function generateCheckpointCommands(config: ProjectConfig): CheckpointCommand[] {
  if (!config.extras.checkpoints || !config.checkpointConfig?.enabled) {
    return [];
  }

  const commands: CheckpointCommand[] = [];

  // Core checkpoint commands
  commands.push({
    name: 'checkpoint',
    category: 'Development',
    description: 'Request human verification at critical milestones',
    template: generateCheckpointTemplate(config),
    triggers: config.checkpointConfig.triggers || [],
  });

  commands.push({
    name: 'should-checkpoint',
    category: 'Development',
    description: 'Self-assess if checkpoint is needed',
    template: generateShouldCheckpointTemplate(config),
    triggers: [],
  });

  commands.push({
    name: 'milestone-gate',
    category: 'Development',
    description: 'Automated checkpoint trigger at milestones',
    template: generateMilestoneGateTemplate(config),
    triggers: config.checkpointConfig.triggers.filter((t) => t.autoTrigger),
  });

  // Custom milestone commands
  if (config.checkpointConfig.customMilestones) {
    config.checkpointConfig.customMilestones.forEach((milestone) => {
      commands.push({
        name: `checkpoint-${milestone.name.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'Milestones',
        description: `Checkpoint for ${milestone.name}`,
        template: generateCustomMilestoneTemplate(milestone),
        triggers: [],
      });
    });
  }

  return commands;
}

function generateCheckpointTemplate(config: ProjectConfig): string {
  const projectType = config.projectType;
  const isDataSensitive = ['api', 'fullstack'].includes(projectType);

  return `# Checkpoint - Human Verification Required

Request human verification for critical milestone: \$ARGUMENTS

## Checkpoint Process

<Task>
<Agent role="checkpoint-coordinator">
When reaching a critical milestone or completing a significant feature:

1. **Summarize What Was Done**
   - List completed tasks with specific details
   - Show key files created/modified
   - Highlight important decisions made
   - Note any deviations from plan

2. **Request Human Verification**
   \`\`\`
   🛑 CHECKPOINT: Human Verification Required
   
   ${config.projectName} - I've completed [\$ARGUMENTS] and need your verification:
   
   ✅ What I've Accomplished:
   - [Specific task 1 with details]
   - [Specific task 2 with details]
   - [Specific task 3 with details]
   
   🧪 Please Test These Steps:
   1. [Specific test instruction with commands]
   2. [Another specific test with expected outcome]
   3. [Third verification step]
   
   📋 Critical Verification Points:
   - [ ] [Specific checkpoint 1]
   - [ ] [Specific checkpoint 2]
   - [ ] [Specific checkpoint 3]
   ${isDataSensitive ? '- [ ] Data integrity maintained\n   - [ ] No breaking changes to existing functionality' : ''}
   
   ⚠️ Important Notes:
   - [Any critical information about the implementation]
   - [Potential risks or considerations]
   
   Please respond:
   - ✅ "Approved" - Continue to next task
   - ❌ "Issues: [description]" - Fix issues before proceeding  
   - ❓ "Question: [question]" - Answer then wait for approval
   \`\`\`

3. **Wait for Human Response**
   - Don't proceed until explicit approval
   - Be ready to fix any issues identified
   - Answer questions thoroughly
   - Adjust approach based on feedback

4. **Document Verification**
   Update Implementation.md with:
   - Checkpoint timestamp and milestone
   - What was verified and approved
   - Any issues found and resolved
   - Human approval confirmation
   - Next steps agreed upon
</Agent>
</Task>

Remember: Critical milestones require human oversight for ${config.projectName} success.`;
}

function generateShouldCheckpointTemplate(config: ProjectConfig): string {
  const criticalTriggers =
    config.checkpointConfig?.triggers
      .filter((t) => t.category === 'critical')
      .map((t) => `- ${t.description}`)
      .join('\n') ||
    '- Database schema changes\n- Authentication modifications\n- Security implementations';

  return `# Should Checkpoint? - Self-Assessment

Determine if current progress warrants human verification for ${config.projectName}.

## Self-Assessment Criteria

<Task>
<Agent role="checkpoint-assessor">
Evaluate current work against these criteria and decide if checkpoint is needed:

### 🔴 CRITICAL - Immediate Checkpoint Required
${criticalTriggers}
- Any code that could affect production systems
- Security-related implementations
- Breaking changes to existing functionality

### 🟡 IMPORTANT - Checkpoint Recommended  
- Multiple features completed in one session (3+)
- Significant architectural changes
- New dependencies or integrations added
- Complex business logic implementation
- Performance-critical code changes

### 🟢 NORMAL - Continue Working
- Small UI/UX improvements
- Component refactoring without logic changes
- Documentation updates
- Type definitions and interfaces
- Minor bug fixes
- Code cleanup and formatting

### Decision Logic:
\`\`\`
IF (touching critical systems OR security OR data)
  → CHECKPOINT REQUIRED - Call /checkpoint immediately

ELSE IF (3+ major tasks completed OR session > 2 hours OR complex changes)
  → CHECKPOINT RECOMMENDED - Consider calling /checkpoint

ELSE IF (user specifically requested verification)
  → CHECKPOINT ALWAYS - Honor user request

ELSE 
  → CONTINUE WORKING - Safe to proceed
\`\`\`

### Auto-Trigger Examples:
- "Database connection established" → CHECKPOINT REQUIRED
- "Authentication system working" → CHECKPOINT REQUIRED  
- "API endpoints created" → CHECKPOINT RECOMMENDED
- "5 components refactored" → CHECKPOINT RECOMMENDED
- "Fixed typo in documentation" → CONTINUE

Return assessment:
- **CHECKPOINT_NOW**: [specific reason and what to verify]
- **CHECKPOINT_SOON**: [when to checkpoint and why]
- **CONTINUE**: [safe to proceed because...]
</Agent>
</Task>

Use this before making any significant changes to ${config.projectName}!`;
}

function generateMilestoneGateTemplate(config: ProjectConfig): string {
  const autoTriggers =
    config.checkpointConfig?.triggers
      .filter((t) => t.autoTrigger)
      .map((t) => `- **${t.name}**: ${t.description}`)
      .join('\n') ||
    '- **Database Setup**: Connection and schema established\n- **Authentication**: Login system functional\n- **API Endpoints**: Core CRUD operations working';

  return `# Milestone Gate - Automated Checkpoint Detection

Monitor for critical milestones in ${config.projectName} and trigger human verification.

## Auto-Checkpoint Milestones

<Task>
<Agent role="milestone-monitor">
Continuously monitor for these critical milestones and automatically call /checkpoint:

### Automatic Triggers
${autoTriggers}

### Detection Logic
When any milestone condition is met, automatically execute:
\`\`\`
/checkpoint [milestone name]

🛑 MILESTONE ACHIEVED: [Milestone Name]

I've reached a critical milestone in ${config.projectName} and need verification before proceeding...
\`\`\`

### Milestone Categories

#### 🔴 Critical Infrastructure
- Database connections and schema changes
- Authentication and authorization systems
- Security implementations
- Production deployment configurations

#### 🟡 Major Features
- Core business logic completion
- Integration with external services
- Complex algorithms or calculations
- User-facing feature completion

#### 🟢 Quality Gates
- Test coverage milestones
- Performance benchmarks achieved
- Security scans completed
- Documentation milestones

### Custom Milestone Detection
${
  config.checkpointConfig?.customMilestones
    ?.map((m) => `- **${m.name}**: ${m.description}`)
    .join('\n') || 'No custom milestones configured'
}

When triggered, include specific verification instructions for each milestone type.
</Agent>
</Task>

Remember: Never proceed past a critical milestone without human verification!`;
}

function generateCustomMilestoneTemplate(milestone: any): string {
  return `# ${milestone.name} - Milestone Checkpoint

Specific checkpoint for ${milestone.name} milestone.

## Milestone Details

${milestone.description}

## Verification Required

<Task>
<Agent role="milestone-verifier">
This milestone has been reached and requires human verification:

### Test Instructions
${milestone.testInstructions
  .map((instruction: string, index: number) => `${index + 1}. ${instruction}`)
  .join('\n')}

### Verification Points
${milestone.verificationPoints.map((point: string) => `- [ ] ${point}`).join('\n')}

### Before Proceeding
${
  milestone.blocksUntilApproved
    ? '⚠️ **BLOCKING**: This milestone MUST be approved before continuing.'
    : '💡 **RECOMMENDED**: Verification recommended but not blocking.'
}

Execute checkpoint process and wait for approval.
</Agent>
</Task>

This checkpoint ensures ${milestone.name} is properly verified before continuing.`;
}

export function getDefaultCheckpointTriggers(projectType: string): CheckpointTrigger[] {
  const baseTriggers: CheckpointTrigger[] = [
    {
      id: 'database-connection',
      name: 'Database Connection',
      description: 'Database connection established or schema modified',
      category: 'critical',
      autoTrigger: true,
      conditions: ['database', 'schema', 'migration', 'connection'],
    },
    {
      id: 'authentication-setup',
      name: 'Authentication System',
      description: 'Authentication or authorization system changes',
      category: 'critical',
      autoTrigger: true,
      conditions: ['auth', 'login', 'jwt', 'session', 'security'],
    },
    {
      id: 'api-endpoints',
      name: 'API Endpoints',
      description: 'API endpoints that modify data created',
      category: 'important',
      autoTrigger: true,
      conditions: ['api', 'endpoint', 'post', 'put', 'delete'],
    },
    {
      id: 'integration-setup',
      name: 'External Integrations',
      description: 'Third-party service integrations configured',
      category: 'important',
      autoTrigger: true,
      conditions: ['integration', 'webhook', 'external', 'api-key'],
    },
    {
      id: 'production-deployment',
      name: 'Production Deployment',
      description: 'Production deployment configuration or release',
      category: 'critical',
      autoTrigger: true,
      conditions: ['deploy', 'production', 'release', 'build'],
    },
  ];

  // Add project-specific triggers
  if (projectType === 'fullstack' || projectType === 'api') {
    baseTriggers.push({
      id: 'data-migration',
      name: 'Data Migration',
      description: 'Database migrations or data transformations',
      category: 'critical',
      autoTrigger: true,
      conditions: ['migrate', 'transform', 'import', 'export'],
    });
  }

  return baseTriggers;
}

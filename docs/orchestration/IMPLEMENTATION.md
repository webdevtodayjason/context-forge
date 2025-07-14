# Orchestration System Implementation

## Overview

The orchestration system enables autonomous AI agent teams to work on projects 24/7 without human intervention. This document details the implementation of this powerful feature.

## Architecture

### Core Components

1. **OrchestrationService** (`src/services/orchestrationService.ts`)
   - Central coordinator for all orchestration activities
   - Manages agent deployment, monitoring, and coordination
   - Handles error recovery and reporting

2. **TmuxManager** (`src/services/tmuxManager.ts`)
   - Manages tmux sessions and windows for agent isolation
   - Handles Claude CLI interaction through tmux
   - Provides window monitoring and content capture

3. **AgentCommunicationService** (`src/services/agentCommunication.ts`)
   - Implements hub-and-spoke communication model
   - Routes messages between agents based on hierarchy
   - Tracks communication metrics and response times

4. **SelfSchedulingService** (`src/services/selfScheduler.ts`)
   - Enables agents to schedule their own check-ins
   - Implements adaptive scheduling based on workload
   - Handles recovery from agent failures

5. **GitDisciplineService** (`src/services/gitDiscipline.ts`)
   - Enforces automatic commits every 30 minutes
   - Manages feature branches and tags
   - Tracks git compliance metrics

### Type System

The orchestration system uses comprehensive TypeScript types defined in `src/types/orchestration.ts`:

- **AgentRole**: Defines available agent types (orchestrator, project-manager, developer, etc.)
- **OrchestrationConfig**: Configuration for the entire orchestration
- **AgentSession**: Runtime state of each agent
- **AgentMessage**: Structured communication between agents

## Implementation Details

### Agent Deployment

```typescript
// Deploy all agents at once (big-bang strategy)
private async deployAllAgents(sessionName: string): Promise<void> {
  const team = this.config.teamStructure;
  
  // Deploy orchestrator first
  await this.deployAgent(sessionName, team.orchestrator, 0);
  
  // Deploy other roles in order
  // Project managers, developers, QA, etc.
}
```

### Communication Model

The hub-and-spoke model enforces communication hierarchy:

```typescript
// Hub-and-spoke validation
if (this.communicationModel === 'hub-and-spoke') {
  // Only PMs can communicate with orchestrator
  // Developers must go through their PM
  if (!this.isValidCommunicationPath(fromAgent, toAgent)) {
    this.stats.blockedMessages++;
    throw new Error('Communication blocked');
  }
}
```

### Self-Scheduling

Agents schedule their own check-ins with adaptive intervals:

```typescript
// Adaptive scheduling based on workload
if (this.config.adaptiveScheduling) {
  const workload = this.calculateWorkload(agentId);
  const interval = this.calculateAdaptiveInterval(workload);
  await this.scheduleNextCheckIn(agentId, interval);
}
```

### Git Discipline

Automatic commits prevent work loss:

```typescript
// Auto-commit every 30 minutes
setInterval(async () => {
  await this.performAutoCommit(agentId, agentRole, sessionId);
}, this.config.autoCommitInterval * 60 * 1000);
```

## Slash Commands

The orchestration system adds powerful slash commands:

1. **`/orchestrate-project [size]`** - Deploy full team
   - Small: 1 PM, 2 developers
   - Medium: 1 PM, 2 developers, 1 QA (default)
   - Large: 2 PMs, 4 developers, 2 QA, 1 DevOps, 1 reviewer

2. **`/orchestrate-feature "feature-name" [size]`** - Deploy feature team
   - Focused team for specific feature implementation
   - Automatic PR creation when complete

3. **`/orchestrate-status [detailed]`** - Check team status
   - View active agents and their current tasks
   - Monitor git compliance and productivity metrics
   - Identify blockers and issues

## Templates

Handlebars templates structure agent interactions:

1. **`agent-briefing.hbs`** - Initial agent instructions
2. **`task-assignment.hbs`** - Task delegation format
3. **`status-report.hbs`** - Progress reporting template
4. **`git-commit.hbs`** - Commit message template

## Error Handling

The system includes comprehensive error handling:

- **Agent crashes**: Automatic recovery with configurable strategies
- **Communication failures**: Message queuing and retry
- **Git conflicts**: Escalation to human intervention
- **Scheduling failures**: Fallback to default intervals

## Performance Optimizations

1. **Lazy Loading**: Services only initialized when needed
2. **Message Batching**: Reduces tmux command overhead
3. **Adaptive Scheduling**: Reduces unnecessary check-ins
4. **Content Capture Limits**: Prevents memory issues with large outputs

## Security Considerations

1. **Isolated Sessions**: Each agent runs in separate tmux window
2. **Communication Validation**: Messages validated against hierarchy
3. **Git Credentials**: Uses system git configuration
4. **No Direct Execution**: Agents can't execute arbitrary commands

## Future Enhancements

1. **Cloud Deployment**: Support for remote orchestration
2. **Multi-Repository**: Coordinate across multiple repos
3. **Custom Agent Types**: Plugin system for specialized agents
4. **Visual Dashboard**: Web UI for real-time monitoring
5. **ML-Based Scheduling**: Learn optimal check-in patterns

## Usage Example

```bash
# Deploy orchestration for a project
context-forge orchestrate medium

# Monitor in real-time
tmux attach -t cf-myproject

# Check status via CLI
context-forge orchestrate-status
```

## Best Practices

1. **Start Small**: Begin with small team size and scale up
2. **Clear PRPs**: Agents work best with detailed PRPs
3. **Regular Monitoring**: Check status at least daily
4. **Git Reviews**: Review auto-commits regularly
5. **Blocker Resolution**: Address blocked agents quickly

## Troubleshooting

### Common Issues

1. **tmux not found**: Install tmux via package manager
2. **Claude not available**: Ensure Claude CLI is in PATH
3. **Git failures**: Check repository permissions
4. **Communication blocks**: Review hierarchy configuration

### Debug Mode

Enable debug logging:

```bash
DEBUG=orchestration:* context-forge orchestrate
```

## Conclusion

The orchestration system transforms Context Forge into a powerful autonomous development platform. By combining AI agents with structured communication, git discipline, and self-scheduling, teams can achieve 24/7 development velocity while maintaining code quality and project coherence.
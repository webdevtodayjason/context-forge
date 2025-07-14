# Orchestration Tutorial: Getting Started with Autonomous AI Teams

## Prerequisites

Before starting, ensure you have:

1. **tmux installed**: 
   ```bash
   # macOS
   brew install tmux
   
   # Ubuntu/Debian
   sudo apt-get install tmux
   
   # Verify installation
   tmux -V
   ```

2. **Claude CLI configured**: The `claude` command should be available in your PATH

3. **Git repository**: Your project must be a git repository

4. **Context Forge installed**: 
   ```bash
   npm install -g context-forge
   ```

## Step 1: Prepare Your Project

### Initialize Context Forge

```bash
cd your-project
context-forge init
```

### Create PRPs for Your Features

Orchestration works best with clear PRPs (Project Requirement Proposals):

```bash
# In Claude Code
/prp-create user-authentication
/prp-create payment-integration
/prp-create api-endpoints
```

## Step 2: Deploy Your First Orchestration

### Basic Deployment

Start with a small team to test the system:

```bash
# Deploy a small team (1 PM, 2 developers)
context-forge orchestrate small
```

### What Happens Next

1. **Session Creation**: A tmux session named `cf-yourproject` is created
2. **Agent Deployment**: Each agent gets its own tmux window
3. **Briefing**: Agents receive their roles and responsibilities
4. **Self-Scheduling**: Agents schedule their first check-ins
5. **Git Setup**: Auto-commit is initialized

## Step 3: Monitor Your Team

### Real-Time Monitoring

Watch your agents work in real-time:

```bash
# Attach to the tmux session
tmux attach -t cf-yourproject

# Navigate between agents
# Ctrl+b, n - Next window
# Ctrl+b, p - Previous window
# Ctrl+b, 0-9 - Jump to specific window
# Ctrl+b, d - Detach (agents keep running)
```

### Status Checks

Use the slash command in Claude Code:

```
/orchestrate-status
```

Or via CLI:

```bash
context-forge orchestrate-status
```

## Step 4: Manage Your Team

### Handling Blockers

When agents get blocked:

1. **Check Status**: Identify which agents are blocked
2. **Review Context**: Read their recent messages
3. **Provide Guidance**: Send clarification through the PM
4. **Resume Work**: Agents will automatically continue

### Review Git Commits

Agents commit every 30 minutes. Review their work:

```bash
# See recent commits
git log --oneline -20

# Review specific agent's commits
git log --author="orchestrator@context-forge.ai"
```

## Step 5: Feature-Focused Teams

For specific features, use targeted orchestration:

```bash
# Deploy a team for authentication feature
context-forge orchestrate-feature "user authentication"

# Deploy larger team for complex feature
context-forge orchestrate-feature "payment integration" large
```

## Advanced Usage

### Custom Team Configurations

Create a custom orchestration config:

```javascript
// orchestration.config.js
module.exports = {
  projectName: 'MyProject',
  strategy: 'phased',
  communicationModel: 'hub-and-spoke',
  teamStructure: {
    orchestrator: {
      id: 'orch-001',
      name: 'Chief Orchestrator',
      briefing: 'Oversee MVP development'
    },
    projectManagers: [
      {
        id: 'pm-001',
        name: 'Frontend PM',
        briefing: 'Manage UI/UX implementation'
      },
      {
        id: 'pm-002', 
        name: 'Backend PM',
        briefing: 'Manage API and database work'
      }
    ],
    developers: [
      // Custom developer configurations
    ]
  }
};
```

### Communication Patterns

Understanding agent communication:

```
Orchestrator
    ├── Project Manager 1
    │   ├── Developer 1
    │   └── Developer 2
    └── Project Manager 2
        ├── Developer 3
        └── QA Engineer
```

### Scheduling Strategies

Agents adapt their check-in frequency:

- **High workload**: Check in every 15 minutes
- **Normal workload**: Check in every 30 minutes  
- **Low workload**: Check in every 60 minutes

## Best Practices

### 1. Start Small

Begin with a small team and scale up:

```bash
# Day 1: Small team
context-forge orchestrate small

# Day 3: Scale to medium
context-forge orchestrate medium

# Week 2: Full team if needed
context-forge orchestrate large
```

### 2. Clear Requirements

Provide detailed PRPs before deployment:

- Clear acceptance criteria
- Technical specifications
- Example code patterns
- Known constraints

### 3. Regular Check-ins

Monitor your team at least twice daily:

- Morning: Review overnight progress
- Evening: Address any blockers

### 4. Git Hygiene

Review and consolidate commits:

```bash
# Create feature branch from agent work
git checkout -b feature/consolidated-work

# Squash agent commits
git rebase -i main
```

## Troubleshooting

### Agent Not Responding

```bash
# Check if tmux session exists
tmux ls

# Check specific agent window
tmux capture-pane -t cf-project:2 -p
```

### Git Conflicts

Agents will escalate on conflicts. Resolve manually:

```bash
# See conflict status
git status

# Resolve conflicts
git mergetool

# Continue agent work
git commit
```

### Communication Issues

Check message routing:

```
/orchestrate-status detailed
```

## Example Workflow

Here's a complete example of orchestrating a new feature:

```bash
# 1. Create feature PRP
# In Claude Code:
/prp-create user-notifications

# 2. Deploy feature team
context-forge orchestrate-feature "user notifications"

# 3. Monitor progress
tmux attach -t cf-project

# 4. Check status after 2 hours
/orchestrate-status

# 5. Review generated code
git diff --name-only

# 6. Run tests
npm test

# 7. Create PR when complete
/create-pr
```

## Tips and Tricks

1. **Window Naming**: Agents are named by role for easy identification
2. **Persistent Sessions**: Agents continue working even when detached
3. **Automatic Recovery**: Failed agents automatically restart
4. **Branch Strategy**: Each feature team works on its own branch
5. **PR Automation**: Feature teams can auto-create PRs when done

## Conclusion

Orchestration transforms your development workflow by enabling 24/7 autonomous progress. Start small, monitor regularly, and scale up as you gain confidence in your AI team's capabilities.

Remember: Orchestration amplifies your productivity but requires clear direction. The better your PRPs and project structure, the more effective your AI team will be.
# Orchestration System Test Plan

## Overview

This document outlines the comprehensive test plan for the Context Forge orchestration system. The tests validate that autonomous AI agents can be deployed and managed effectively.

## Test Environment

- **OS**: macOS/Linux with tmux installed
- **Node.js**: v18+ 
- **Git**: Initialized repository
- **Claude CLI**: Available in PATH

## Test Categories

### 1. Unit Tests

Located in `src/services/__tests__/`:

#### OrchestrationService Tests
- **Deployment validation**: Ensures agents deploy correctly
- **Status management**: Verifies status tracking works
- **Error handling**: Tests graceful failure recovery
- **Monitoring**: Validates agent health checks
- **Cleanup**: Tests proper shutdown procedures

#### TmuxManager Tests
- **Session management**: Create, check, kill sessions
- **Window management**: Create, rename, list windows
- **Content interaction**: Send keys, capture content
- **Claude integration**: Message sending with timing
- **Error scenarios**: Handle missing tmux gracefully

#### Command Tests
- **Argument parsing**: Size and option validation
- **Configuration building**: Team structure creation
- **Output formatting**: User feedback messages
- **Error reporting**: Helpful error messages

### 2. Integration Tests

#### Deployment Flow
1. **Initialize project**: Create test repository
2. **Deploy agents**: Run orchestration command
3. **Verify deployment**: Check tmux sessions/windows
4. **Monitor activity**: Watch for agent actions
5. **Check outputs**: Validate git commits, logs

#### Communication Flow
1. **Send messages**: Test agent-to-agent messaging
2. **Verify routing**: Check hub-and-spoke model
3. **Test escalation**: Validate issue reporting
4. **Monitor responses**: Track response times

### 3. System Tests

#### Full Orchestration Test
The `test-orchestration.js` script performs:

1. **Tmux Availability**: Verifies tmux is installed
2. **Deployment Test**: Deploys small team
3. **Session Verification**: Checks tmux session exists
4. **Agent Windows**: Validates window creation
5. **Git Auto-Commit**: Waits for automatic commits
6. **Status Check**: Retrieves orchestration status

## Test Scenarios

### Scenario 1: Basic Deployment
**Goal**: Deploy a small team successfully

**Steps**:
1. Create test project with git
2. Run `context-forge orchestrate small`
3. Verify 3 agents deployed
4. Check tmux windows created

**Expected Results**:
- Session named `cf-test-project`
- Windows: orchestrator, project-manager, 2 developers
- All agents show as active

### Scenario 2: Git Discipline
**Goal**: Validate automatic commits

**Steps**:
1. Deploy agents
2. Wait 35 minutes
3. Check git log

**Expected Results**:
- At least 1 auto-commit
- Commit message follows format
- No merge conflicts

### Scenario 3: Self-Scheduling
**Goal**: Verify agents schedule check-ins

**Steps**:
1. Deploy agents
2. Monitor agent activity
3. Check schedule adjustments

**Expected Results**:
- Agents check in regularly
- Intervals adapt to workload
- No missed check-ins

### Scenario 4: Communication
**Goal**: Test agent messaging

**Steps**:
1. Deploy with hub-and-spoke model
2. Monitor message routing
3. Test blocked paths

**Expected Results**:
- Developers can't message orchestrator directly
- Messages route through PM
- Escalations reach orchestrator

### Scenario 5: Error Recovery
**Goal**: Test failure handling

**Steps**:
1. Deploy agents
2. Simulate agent crash
3. Monitor recovery

**Expected Results**:
- Failed agent restarts
- Work continues on other agents
- Error logged appropriately

## Performance Benchmarks

### Deployment Time
- Small team: < 30 seconds
- Medium team: < 45 seconds
- Large team: < 60 seconds

### Resource Usage
- Memory per agent: ~50-100MB
- CPU usage: < 5% idle, < 20% active
- Disk I/O: Minimal except during commits

### Communication Latency
- Message delivery: < 1 second
- Response time: < 5 seconds average
- Queue processing: < 100ms

## Success Criteria

### Critical Requirements
- [ ] All agents deploy without errors
- [ ] Tmux sessions remain stable
- [ ] Git commits happen automatically
- [ ] Agents communicate successfully
- [ ] Status can be retrieved

### Quality Metrics
- [ ] 90%+ test coverage
- [ ] No critical errors in 30 minutes
- [ ] All unit tests pass
- [ ] Integration tests complete
- [ ] Performance within benchmarks

## Known Limitations

1. **Tmux Dependency**: Requires tmux installation
2. **Platform Support**: Best on macOS/Linux
3. **Claude CLI**: Must be configured
4. **Resource Usage**: Scales with team size
5. **Network Latency**: Affects AI responses

## Test Automation

### Continuous Integration
```yaml
# .github/workflows/orchestration-tests.yml
name: Orchestration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: sudo apt-get install tmux
      - run: npm install
      - run: npm test
      - run: node test-orchestration.js
```

### Local Testing
```bash
# Run all tests
npm test

# Run orchestration tests only
npm test -- orchestration

# Run integration test
node test-orchestration.js
```

## Debugging Guide

### Common Issues

1. **"tmux: command not found"**
   - Install tmux: `brew install tmux` or `apt-get install tmux`

2. **"Claude not available"**
   - Ensure Claude CLI is in PATH
   - Check Claude is authenticated

3. **"Session already exists"**
   - Kill existing: `tmux kill-session -t cf-project`

4. **"Git commit failed"**
   - Check git config is set
   - Ensure write permissions

5. **"Agent not responding"**
   - Check tmux window: `tmux attach -t session:window`
   - Review agent logs

### Debug Commands

```bash
# List all tmux sessions
tmux ls

# Attach to orchestration session
tmux attach -t cf-project

# View specific agent
tmux select-window -t cf-project:1

# Capture agent output
tmux capture-pane -t cf-project:0 -p

# Check orchestration status
context-forge orchestrate-status
```

## Conclusion

The orchestration system test plan ensures comprehensive validation of all features. By following these tests, we can verify that autonomous AI agents work reliably in production environments.
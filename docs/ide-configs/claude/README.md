# Claude Code Configuration

Claude Code is Anthropic's official CLI for AI-assisted development. Context Forge provides the most comprehensive support for Claude Code with full PRP (Product Requirement Prompt) integration, migration intelligence, and advanced automation features.

## Generated File Structure

```
project-root/
├── CLAUDE.md                         # Main context file
├── .claude/                          # Claude-specific configuration (gitignored)
│   ├── commands/                     # 20+ slash commands
│   │   ├── development/              # Development commands
│   │   │   ├── prime-context.md      # Load project context
│   │   │   ├── analyze-stack.md      # Tech stack analysis
│   │   │   └── implement-feature.md  # Feature implementation
│   │   ├── migration/                # Migration commands
│   │   │   ├── migration-status.md   # Check migration progress
│   │   │   ├── migration-checkpoint.md # Trigger checkpoints
│   │   │   └── migration-validate.md # Run validation suite
│   │   ├── prp/                      # PRP management
│   │   │   ├── create-prp.md         # Generate new PRPs
│   │   │   ├── run-prp.md            # Execute PRP workflow
│   │   │   └── validate-prp.md       # Validate implementation
│   │   └── checkpoint/               # Human-in-the-Loop
│   │       ├── checkpoint-review.md  # Manual checkpoint
│   │       └── validate-milestone.md # Milestone validation
│   ├── hooks/                        # Claude hooks for automation
│   │   ├── PreCompact.py            # Context preservation
│   │   ├── ContextRotation.py        # Context management
│   │   ├── PreSubmit.py             # Pre-submission validation
│   │   └── PRPTracking.py           # PRP progress tracking
│   ├── project.md                    # Project-specific configuration
│   └── .dart                         # Dart integration file
├── Docs/                             # Documentation structure
│   ├── Implementation.md             # Staged development plan
│   ├── project_structure.md          # Project organization
│   ├── current-sprint.md             # Active development context
│   ├── framework-patterns.md         # Framework detection patterns
│   ├── breaking-changes-catalog.md   # Breaking change database
│   └── dependency-mappings.md        # Package migration mappings
├── PRPs/                             # Product Requirement Prompts
│   ├── base-enhanced.md              # Enhanced implementation PRP
│   ├── planning.md                   # Architecture planning
│   ├── spec.md                       # Technical specifications
│   ├── task.md                       # Task-specific PRP
│   ├── migration-overview.md         # Migration strategy PRP
│   └── phase-*.md                    # Migration phase PRPs
└── .context-forge/                   # Configuration metadata
    └── config.json
```

## Major Features (v3.1.4+)

### 🚀 Migration Intelligence System

**Comprehensive migration assistance with AI-powered analysis:**

- **Framework Detection**: Automatically detects 10+ frameworks with confidence scoring
- **Breaking Change Analysis**: Identifies version-specific breaking changes with automation potential
- **Dependency Intelligence**: Analyzes package incompatibilities and suggests replacements
- **Migration Phases**: Generates step-by-step migration plans with checkpoints
- **Risk Assessment**: Comprehensive risk analysis with mitigation strategies

### 🎯 20+ Slash Commands

**Powerful slash commands for development workflow:**

#### Development Commands
- `/prime-context` - Load essential project knowledge
- `/analyze-stack` - Analyze current technology stack
- `/implement-feature` - Feature implementation workflow
- `/code-review` - Structured code review process
- `/debug-session` - Debugging assistance
- `/refactor-guide` - Code refactoring guidance

#### Migration Commands  
- `/migration-status` - Check migration progress
- `/migration-checkpoint` - Trigger manual checkpoints
- `/migration-validate` - Run validation suite
- `/migration-rollback` - Execute rollback procedures
- `/compare-frameworks` - Framework comparison analysis
- `/breaking-changes` - Show breaking changes for migration

#### PRP Management
- `/create-prp` - Generate new Product Requirement Prompts
- `/run-prp` - Execute PRP workflow
- `/validate-prp` - Validate PRP implementation
- `/prp-status` - Check PRP completion status

#### Checkpoint System
- `/checkpoint-review` - Manual milestone review
- `/validate-milestone` - Validate critical checkpoints
- `/approve-phase` - Approve migration phase completion

### 🔗 Human-in-the-Loop Checkpoints

**Critical milestone validation system:**

- **Automated Triggers**: System pauses at critical points
- **Manual Reviews**: Human validation for important decisions
- **Rollback Points**: Safe rollback at any checkpoint
- **Progress Tracking**: Visual progress through migration phases
- **Approval Gates**: Require human approval for risky operations

### 🎣 Claude Code Hooks

**Automated context management and workflow enhancement:**

#### PreCompact Hook
- Preserves critical project context during conversation compaction
- Ensures migration state and progress are maintained
- Automatically includes essential files in context

#### ContextRotation Hook  
- Manages context switching between different development areas
- Maintains focus on current migration phase
- Optimizes context usage for large projects

#### PreSubmit Hook
- Validates code quality before submissions
- Runs migration-specific validation
- Ensures checkpoints are properly documented

#### PRPTracking Hook
- Tracks PRP completion and progress
- Updates migration status automatically  
- Maintains consistency between PRPs and implementation

### 📋 Enhanced PRP Templates

**Sophisticated templates for one-pass implementation:**

- **Base Enhanced**: Comprehensive implementation template
- **Planning**: Architecture and strategy planning
- **Specification**: Detailed technical specifications  
- **Task**: Focused task implementation
- **Migration**: Migration-specific PRPs with phases

## Migration System Usage

### 1. Analyze Current Project

```bash
# Comprehensive migration analysis
context-forge migrate --analyze-only

# Target-specific analysis
context-forge migrate --target "React 18" --analyze-only

# Quick analysis
context-forge migrate --quick --target "Next.js"
```

### 2. Generate Migration Plan

```bash
# Full migration with all artifacts
context-forge migrate --target "React 18" --ide claude

# Include checkpoints and hooks
context-forge migrate --target "Vue 3" --ide claude --checkpoints --hooks
```

### 3. Use Slash Commands in Claude

```
/migration-status
Shows current migration progress and next steps

/prime-context  
Loads project context for migration work

/migration-checkpoint setup
Triggers manual checkpoint for setup phase

/breaking-changes
Lists breaking changes for current migration
```

## Example: Enhanced CLAUDE.md

```markdown
# MyProject - Claude Code Context

## Project Overview

A modern web application migrating from React 17 to React 18 with comprehensive migration intelligence.

## Current Development Context

### Migration Status
- **Source**: React 17 + Create React App  
- **Target**: React 18 + Vite
- **Phase**: 2/5 - Breaking Changes Resolution
- **Progress**: 60% complete
- **Next Checkpoint**: Breaking changes validation

### Active Sprint
- Resolving React 18 breaking changes
- Migrating from ReactDOM.render to createRoot
- Updating testing library dependencies

## Migration Intelligence

### Framework Detection
- **Primary**: React 17.0.4 (95% confidence)
- **Variant**: Create React App
- **Dependencies**: 23 total, 4 incompatible

### Breaking Changes
- **Total**: 8 changes detected
- **Critical**: 2 (ReactDOM.render, Enzyme deprecation)
- **Automatable**: 6 changes
- **Manual**: 2 changes requiring code review

### Risk Assessment
- **Level**: Medium
- **Key Risks**: Testing framework migration, build tool changes
- **Mitigation**: Phased approach with rollback points

## Context Engineering Setup

This project uses advanced context engineering with migration intelligence.

### Key Files:
- `/CLAUDE.md` - Main project context (this file)
- `/.claude/project.md` - Active development status  
- `/Docs/Implementation.md` - Staged development plan
- `/PRPs/migration-overview.md` - Migration strategy
- `/MIGRATION_PLAN.md` - Comprehensive migration plan
- `/BREAKING_CHANGES.md` - Breaking changes documentation

### Slash Commands Available:
- `/migration-status` - Check current progress
- `/prime-context` - Load migration context
- `/breaking-changes` - Review breaking changes
- `/migration-checkpoint [phase]` - Trigger validation

## Migration Phases

### ✅ Phase 1: Setup and Planning (Completed)
- Environment setup with shared resources
- Migration tooling configured
- Rollback strategies documented

### 🔄 Phase 2: Breaking Changes (In Progress)  
- **Current Focus**: ReactDOM.render → createRoot migration
- **Status**: 3/8 changes completed
- **Next**: Enzyme → Testing Library migration

### 📅 Phase 3: Dependency Migration (Planned)
- CRA → Vite migration
- Testing framework updates
- Build configuration changes

### 📅 Phase 4: Feature Migration (Planned)
- Component-by-component migration
- State management updates
- Route configuration changes

### 📅 Phase 5: Validation and Cutover (Planned)
- Full regression testing
- Performance validation
- Production deployment

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design.

### YAGNI (You Aren't Gonna Need It)  
Avoid building functionality on speculation.

### Migration-First Approach
- All changes consider migration compatibility
- Backward compatibility maintained during transition
- Rollback capability at every step

## Code Structure & Modularity

- Never create a file longer than 500 lines
- Functions should be short and focused
- Components/Classes should have single responsibility
- Migration changes clearly documented

## Tech Stack

### Current (Source)
- **Frontend**: React 17.0.4 + Create React App
- **Testing**: Enzyme + Jest  
- **Build**: Webpack (via CRA)
- **State**: Redux with connect()

### Target  
- **Frontend**: React 18.2.0 + Vite
- **Testing**: React Testing Library + Vitest
- **Build**: Vite
- **State**: Redux Toolkit with hooks

## Migration Checkpoints

### Critical Checkpoints
- **Setup Complete**: Environment and tooling ready
- **Breaking Changes**: All critical changes resolved
- **Dependency Migration**: New packages installed and tested
- **Feature Parity**: All features working in new stack
- **Go Live**: Production cutover approved

### Validation Criteria
- All tests passing (minimum 85% coverage)
- No console errors in development
- Build completes successfully  
- Performance within 10% of baseline
- All features manually tested

## Commands and Automation

### Migration Commands
```bash
# Check current status
/migration-status

# Review breaking changes  
/breaking-changes

# Trigger checkpoint
/migration-checkpoint breaking-changes

# Validate current phase
/migration-validate

# Compare old vs new  
/compare-frameworks react-17 react-18
```

### Validation Commands
```bash
# Run full validation suite
context-forge validate

# Migration-specific validation
/migration-validate

# Performance comparison
/performance-check
```

## Rollback Strategy

### Automatic Rollback Triggers
- Critical error in production
- Data integrity check failed  
- Performance degradation > 50%

### Manual Rollback Points
- After each phase completion
- Before production deployment
- At any checkpoint failure

### Rollback Procedures
1. Stop all services for current phase
2. Restore previous configuration
3. Execute database rollback script (if needed)
4. Restart services with old configuration
5. Verify system functionality

## Resources

### Migration Documentation
- [Migration Plan](./MIGRATION_PLAN.md) - Complete strategy
- [Breaking Changes](./BREAKING_CHANGES.md) - Detailed change list
- [Dependency Migration](./DEPENDENCY_MIGRATION.md) - Package changes

### Generated Scripts
- [Auto Migration](./scripts/auto-migrate.sh) - Automated changes
- [Install Replacements](./scripts/install-replacements.sh) - Dependency updates
- [Validation Suite](./scripts/validate-migration.sh) - Comprehensive testing

### Framework Resources
- [React 18 Upgrade Guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
- [Vite Migration Guide](https://vitejs.dev/guide/migration.html)
- [Testing Library Migration](https://testing-library.com/docs/react-testing-library/migrate-from-enzyme)
```

## Advanced Configuration

### Custom Migration Patterns

Add custom framework patterns to `.claude/Docs/framework-patterns.md`:

```typescript
{
  framework: 'custom-framework',
  files: ['custom.config.js'],
  dependencies: ['custom-lib'],
  content: [
    { file: '**/*.custom', pattern: /customPattern/, weight: 20 }
  ],
  priority: 95
}
```

### Custom Breaking Changes

Extend breaking changes in `.claude/Docs/breaking-changes-catalog.md`:

```typescript
{
  from: { framework: 'custom', version: '1.0' },
  to: { framework: 'custom', version: '2.0' },
  changes: [
    {
      id: 'custom-breaking-change',
      category: 'api',
      severity: 'high',
      description: 'Custom API change',
      automatable: true,
      effort: 'small'
    }
  ]
}
```

### Custom Dependency Mappings

Add package mappings to dependency analyzer:

```typescript
{
  from: { name: 'old-package' },
  to: [{ name: 'new-package' }],
  migrationNotes: 'Migration guidance',
  compatible: false
}
```

## Integration with Other Tools

### Dart Task Management
- Automatic task creation for migration phases
- Progress tracking in Dart boards
- Checkpoint notifications to team

### GitHub Integration  
- Automatic PR creation for migration phases
- Issue tracking for breaking changes
- Milestone management

### CI/CD Integration
- Migration validation in CI pipeline
- Automated rollback on test failures
- Performance monitoring during migration

## Troubleshooting

### Common Issues

**Framework Detection Fails**
- Ensure package.json exists
- Check for standard framework files
- Verify dependency declarations

**Breaking Changes Not Detected**
- Check source/target framework versions
- Verify framework pattern matching
- Review breaking change catalog

**Migration Phases Not Generated**
- Ensure migration analysis completed
- Check for dependency analysis results
- Verify configuration file generation

**Hooks Not Working**
- Check hook file permissions (755)
- Verify Python installation
- Check Claude Code hooks configuration

### Debug Commands

```bash
# Verbose migration analysis
context-forge migrate --analyze-only --verbose

# Debug framework detection
/analyze-stack --debug

# Test hooks manually
python .claude/hooks/PreCompact.py

# Validate configuration
context-forge validate --migration
```

## Best Practices

### Migration Workflow
1. **Always start with analysis**: Use `--analyze-only` first
2. **Review generated plans**: Check migration phases and risks
3. **Use checkpoints**: Don't skip human validation points
4. **Test incrementally**: Validate after each phase
5. **Maintain rollback capability**: Keep rollback procedures ready

### Context Management
1. **Use /prime-context**: Load context before migration work
2. **Update project.md**: Keep current status accurate
3. **Document decisions**: Record checkpoint approvals
4. **Leverage hooks**: Let automation handle routine tasks

### Code Quality
1. **Follow migration phases**: Don't skip ahead
2. **Validate continuously**: Use migration validation commands
3. **Test thoroughly**: Maintain test coverage during migration
4. **Document changes**: Update documentation as you go

## Version History

- **v3.1.4** (Jul 2025): Migration intelligence, 20+ slash commands, checkpoints, hooks
- **v3.1.3** (Jun 2025): Enhanced PRP templates, validation system
- **v3.1.2** (May 2025): Multi-IDE support, orchestration workflow
- **v3.1.1** (Apr 2025): Core PRP system, basic templates

Context Forge with Claude Code provides the most advanced AI-assisted development experience available, with comprehensive migration intelligence and automation capabilities.
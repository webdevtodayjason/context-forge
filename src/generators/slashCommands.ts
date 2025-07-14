import { ProjectConfig } from '../types';
import { generateCheckpointCommands } from './checkpointCommands';

interface SlashCommand {
  name: string;
  category: string;
  content: string;
  description: string;
}

export async function generateSlashCommands(config: ProjectConfig): Promise<SlashCommand[]> {
  const commands: SlashCommand[] = [];

  // PRP Commands
  commands.push({
    name: 'prp-create',
    category: 'PRPs',
    description: 'Generate a comprehensive PRP with deep research',
    content: `# Create PRP for Feature: $ARGUMENTS

Generate a complete PRP for feature implementation with deep and thorough research. Ensure rich context is passed to the AI through the PRP to enable one-pass implementation success.

## Research Process

1. **Codebase Analysis**
   - Search for similar features/patterns in the codebase
   - Identify all necessary files to reference
   - Note existing conventions to follow
   - Check test patterns for validation approach

2. **External Research**
   - Find relevant documentation (include URLs)
   - Search for implementation examples
   - Document best practices and common pitfalls
   - Add critical docs to PRPs/ai_docs/ if needed

3. **User Clarification**
   - Ask for any missing requirements

## PRP Generation

Using the PRP template, include:
- All necessary context (docs, examples, gotchas)
- Implementation blueprint with pseudocode
- Executable validation gates
- Clear task breakdown

## Output

Save as: \`PRPs/{feature-name}-prp.md\`

Remember: The goal is one-pass implementation success through comprehensive context.`,
  });

  commands.push({
    name: 'prp-execute',
    category: 'PRPs',
    description: 'Execute a PRP against the codebase',
    content: `# Execute PRP: $ARGUMENTS

Load and execute the specified PRP file.

## Workflow

1. **Load PRP**: Read PRPs/$ARGUMENTS.md
2. **Plan**: Create comprehensive implementation plan
3. **Execute**: Implement following the blueprint
4. **Validate**: Run all validation gates
5. **Complete**: Ensure all checklist items done

## Execution Guidelines

- Follow existing code patterns
- Implement incrementally with validation
- Use TodoWrite tool to track progress
- Run validation gates after each component
- Fix any failures before proceeding

When complete, all validation gates should pass.`,
  });

  commands.push({
    name: 'prime-context',
    category: 'development',
    description: 'Prime Claude with project context',
    content: `# Prime Context for ${config.projectName}

Load core project knowledge to understand the codebase.

## Context Loading

1. Read CLAUDE.md for project guidelines
2. Read README.md for project overview
3. Examine project structure with \`tree\`
4. Read key source files
5. Review package.json/requirements for dependencies

## Report Back

Explain your understanding of:
- Project structure and organization
- Main purpose and functionality
- Key technologies and patterns
- Important configuration
- Development workflow`,
  });

  commands.push({
    name: 'validate-prp',
    category: 'PRPs',
    description: 'Validate a PRP for completeness',
    content: `# Validate PRP: $ARGUMENTS

Check if the PRP contains all necessary elements for one-pass success.

## Validation Checklist

### Required Sections
- [ ] Clear Goal statement
- [ ] Why (business value)
- [ ] What (requirements)
- [ ] All Needed Context section
- [ ] Implementation Blueprint
- [ ] Validation Gates (4 levels)
- [ ] Task Breakdown

### Context Quality
- [ ] Documentation URLs included
- [ ] Code examples referenced
- [ ] Known gotchas documented
- [ ] Patterns identified

### Validation Gates
- [ ] Level 1: Syntax/Style commands
- [ ] Level 2: Unit test patterns
- [ ] Level 3: Integration tests
- [ ] Level 4: Creative validation

## Score

Rate the PRP 1-10 for likelihood of one-pass success.`,
  });

  // Development Commands
  commands.push({
    name: 'debug-issue',
    category: 'development',
    description: 'Debug and find root cause of an issue',
    content: `# Debug Issue: $ARGUMENTS

Systematically debug and resolve the specified issue.

## Debug Process

1. **Reproduce**: Understand how to trigger the issue
2. **Investigate**: 
   - Check error logs and stack traces
   - Examine relevant code paths
   - Review recent changes
3. **Root Cause**: Identify the underlying problem
4. **Fix**: Implement and test the solution
5. **Verify**: Ensure the issue is resolved

Report findings and implemented fix.`,
  });

  // Code Quality Commands
  commands.push({
    name: 'review-code',
    category: 'quality',
    description: 'Review code for quality and best practices',
    content: `# Code Review: $ARGUMENTS

Review the specified code for quality, security, and best practices.

## Review Areas

1. **Code Quality**
   - Readability and maintainability
   - Proper error handling
   - Performance considerations
   - Security vulnerabilities

2. **Best Practices**
   - Follows project conventions
   - Appropriate abstractions
   - Test coverage
   - Documentation

3. **Suggestions**
   - Specific improvements
   - Refactoring opportunities
   - Additional test cases

Provide actionable feedback with examples.`,
  });

  commands.push({
    name: 'refactor-code',
    category: 'quality',
    description: 'Refactor code for better structure',
    content: `# Refactor: $ARGUMENTS

Refactor the specified code while maintaining functionality.

## Refactoring Process

1. **Understand**: Analyze current implementation
2. **Plan**: Identify refactoring opportunities
3. **Test**: Ensure existing tests pass
4. **Refactor**: Apply improvements incrementally
5. **Validate**: Verify no regressions

## Focus Areas
- Extract reusable functions
- Improve naming and clarity
- Reduce complexity
- Enhance type safety
- Follow SOLID principles

Maintain all existing functionality.`,
  });

  // Add rapid development commands
  commands.push({
    name: 'parallel-prp-create',
    category: 'rapid',
    description: 'Create multiple PRPs in parallel using subagents',
    content: `# Parallel PRP Creation: $ARGUMENTS

Create multiple PRPs simultaneously using batch tools and subagents.

## Process

1. **Parse Requirements**: Break down into independent features
2. **Spawn Subagents**: Create parallel research tasks
3. **Deep Research**: Each agent researches their feature
4. **Generate PRPs**: Create comprehensive PRPs
5. **Validate**: Ensure all PRPs meet quality standards

## Subagent Instructions

Each subagent should:
- Research existing patterns thoroughly
- Find external documentation
- Document gotchas and pitfalls
- Create executable validation gates
- Score PRP confidence (1-10)

Use batch tools to maximize efficiency.`,
  });

  commands.push({
    name: 'smart-commit',
    category: 'git',
    description: 'Create intelligent git commits',
    content: `# Smart Commit

Analyze changes and create a well-structured commit.

## Process

1. **Analyze Changes**: Review all modified files
2. **Group Changes**: Organize by feature/fix
3. **Generate Message**: Create conventional commit message
4. **Validate**: Ensure message follows standards

## Commit Format

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

Types: feat, fix, docs, style, refactor, test, chore`,
  });

  commands.push({
    name: 'create-pr',
    category: 'git',
    description: 'Create comprehensive pull request',
    content: `# Create Pull Request

Generate a detailed PR with all necessary context.

## PR Structure

1. **Title**: Clear, concise description
2. **Summary**: What and why
3. **Changes**: Detailed list of modifications
4. **Testing**: How to verify changes
5. **Screenshots**: If UI changes
6. **Checklist**: Required validations

## Template

### Summary
Brief description of changes and motivation

### Changes
- Change 1: Description
- Change 2: Description

### Testing
Steps to test the changes

### Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No regressions`,
  });

  // Checkpoint Commands (if enabled)
  if (config.extras.checkpoints) {
    const checkpointCommands = generateCheckpointCommands(config);
    checkpointCommands.forEach((cmd) => {
      commands.push({
        name: cmd.name,
        category: cmd.category,
        description: cmd.description,
        content: cmd.template,
      });
    });
  }

  // Orchestration Commands
  commands.push({
    name: 'orchestrate-project',
    category: 'orchestration',
    description: 'Deploy autonomous AI team for 24/7 development',
    content: generateOrchestratorCommand(config),
  });

  commands.push({
    name: 'orchestrate-feature',
    category: 'orchestration',
    description: 'Deploy focused team for specific feature',
    content: generateFeatureOrchestratorCommand(config),
  });

  commands.push({
    name: 'orchestrate-status',
    category: 'orchestration',
    description: 'Check orchestration team status',
    content: generateOrchestratorStatusCommand(),
  });

  commands.push({
    name: 'feature-status',
    category: 'development',
    description: 'Check feature implementation progress',
    content: `# Check Feature Status: $ARGUMENTS

View progress on a specific feature implementation.

## Usage

\`/feature-status "authentication"\` - Status of auth feature
\`/feature-status all\` - Status of all features

## Information Displayed

### Feature Overview
- Feature name and description
- Assigned team members
- Current phase
- Overall progress percentage

### Task Breakdown
- Completed tasks ✅
- In-progress tasks 🔄
- Blocked tasks 🚫
- Pending tasks ⏳

### Quality Metrics
- Test coverage
- Code review status
- Documentation status
- Performance benchmarks

### Timeline
- Start date
- Expected completion
- Actual vs planned progress
- Blocker impact on timeline

### Recent Activity
- Last 5 commits related to feature
- Recent PR activity
- Test results
- Key decisions made

## Quick Actions

Based on status:
1. Unblock team members
2. Adjust timeline
3. Add resources
4. Review completed work

Use this to keep features on track!`,
  });

  return commands;
}

export function generateSlashCommandFiles(commands: SlashCommand[]): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const command of commands) {
    files.push({
      path: path.join('.claude', 'commands', command.category, `${command.name}.md`),
      content: command.content,
      description: command.description,
    });
  }

  // Add README for commands
  files.push({
    path: path.join('.claude', 'commands', 'README.md'),
    content: generateCommandsReadme(commands),
    description: 'Slash commands documentation',
  });

  // Add PRPs/ai_docs directory with README
  files.push({
    path: path.join('PRPs', 'ai_docs', 'README.md'),
    content: generateAiDocsReadme(),
    description: 'AI documentation curation guide',
  });

  return files;
}

function generateCommandsReadme(commands: SlashCommand[]): string {
  const commandsByCategory = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, SlashCommand[]>
  );

  let content = `# Context Forge Slash Commands

Custom slash commands for Claude Code to enhance your development workflow.

## Usage

In Claude Code, type \`/\` followed by the command name:
- \`/prp-create feature-name\` - Create a new PRP
- \`/prp-execute feature-name\` - Execute an existing PRP
- \`/prime-context\` - Load project context

## Available Commands

`;

  for (const [category, cmds] of Object.entries(commandsByCategory)) {
    content += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    for (const cmd of cmds) {
      content += `- **/${cmd.name}** - ${cmd.description}\n`;
    }
  }

  content += `\n## Creating Custom Commands

Add your own commands by creating markdown files in the appropriate category folder:
- \`.claude/commands/PRPs/\` - PRP-related commands
- \`.claude/commands/development/\` - Development utilities
- \`.claude/commands/quality/\` - Code quality tools
- \`.claude/commands/rapid/\` - Rapid development tools
- \`.claude/commands/git/\` - Git operations

Use \`$ARGUMENTS\` placeholder for dynamic input.

## Tips

- Commands are automatically discovered by Claude Code
- Use descriptive names for easy discovery
- Include clear instructions in command content
- Reference existing patterns in the codebase
- Commands can call other commands`;

  return content;
}

function generateAiDocsReadme(): string {
  return `# AI Documentation Curation

This directory contains curated documentation for AI-assisted development. These docs are referenced in PRPs to provide comprehensive context.

## Purpose

When creating PRPs, you may need to include specific documentation that isn't easily accessible via URLs or is critical for implementation success. This directory serves as a repository for such documentation.

## Usage in PRPs

Reference documents in your PRPs using:

\`\`\`yaml
- docfile: PRPs/ai_docs/library-guide.md
  why: Specific implementation patterns and gotchas
\`\`\`

## What to Include

1. **Library Documentation** - Key sections from official docs
2. **Implementation Patterns** - Common patterns and best practices
3. **API References** - Detailed API documentation for complex integrations
4. **Migration Guides** - When upgrading versions or switching libraries
5. **Internal Standards** - Team-specific coding standards and practices

## File Naming Convention

- Use descriptive names: \`react-hooks-guide.md\`, \`fastapi-async-patterns.md\`
- Include version if relevant: \`nextjs-15-app-router.md\`
- Use lowercase with hyphens

## Example Structure

\`\`\`
PRPs/ai_docs/
├── README.md (this file)
├── react-hooks-guide.md
├── fastapi-async-patterns.md
├── postgres-optimization.md
└── aws-lambda-best-practices.md
\`\`\`

Remember: The goal is to provide AI with all necessary context for one-pass implementation success.`;
}

// Re-export for use in adapters
import { GeneratedFile } from '../adapters/base';
import path from 'path';

function generateOrchestratorCommand(config: ProjectConfig): string {
  return `# Deploy Autonomous Orchestration: $ARGUMENTS

Deploy a full AI orchestration team to work on your project autonomously.

## What This Does

1. **Creates AI Team**: Deploys orchestrator, project managers, and developers
2. **Self-Managing**: Agents schedule their own check-ins and manage workload
3. **Git Discipline**: Auto-commits every 30 minutes to prevent work loss
4. **24/7 Operation**: Can run continuously without human intervention

## Usage

\`/orchestrate-project\` - Deploy with default team structure
\`/orchestrate-project small\` - Small team (1 PM, 2 devs)
\`/orchestrate-project large\` - Large team (2 PMs, 4 devs, QA, DevOps)

## Team Structure

### Default Team
- 1 Orchestrator (oversees everything)
- 1 Project Manager (coordinates work)
- 2 Developers (implement features)
- 1 QA Engineer (ensures quality)

### Small Team
- 1 Orchestrator
- 1 Project Manager
- 2 Developers

### Large Team
- 1 Orchestrator
- 2 Project Managers
- 4 Developers
- 2 QA Engineers
- 1 DevOps Engineer
- 1 Code Reviewer

## Prerequisites

1. **tmux installed**: Required for agent management
2. **Git initialized**: Project must be a git repository
3. **Claude access**: Each agent needs Claude access
4. **PRPs created**: Agents work best with clear PRPs

## Deployment Process

1. Check tmux availability
2. Create orchestration session
3. Deploy agents with specific roles
4. Initialize git auto-commit
5. Set up self-scheduling
6. Brief each agent on their responsibilities

## Monitoring

Use \`/orchestrate-status\` to check on your team
Use \`tmux attach -t cf-${config.projectName}\` to view agents

## Important Notes

- Agents commit automatically - review commits regularly
- Each agent has specific responsibilities and constraints
- Communication follows hub-and-spoke model through PM
- Orchestrator handles high-level decisions only

Ready to deploy your AI team!`;
}

function generateFeatureOrchestratorCommand(_config: ProjectConfig): string {
  return `# Deploy Feature-Focused Orchestration: $ARGUMENTS

Deploy a focused AI team to implement a specific feature.

## Usage

\`/orchestrate-feature "user authentication"\` - Deploy team for auth feature
\`/orchestrate-feature "payment integration" large\` - Large team for complex feature

## What This Does

1. **Focused Team**: Smaller team dedicated to one feature
2. **Feature PRP**: Generates feature-specific PRP if needed
3. **Auto PR**: Creates pull request when feature is complete
4. **Progress Tracking**: Regular updates on feature progress

## Team Composition

### Default Feature Team
- 1 Lead Developer (owns the feature)
- 1 Supporting Developer (assists and reviews)
- 1 QA Engineer (tests the feature)

### Large Feature Team
- 1 Feature Lead
- 2 Developers
- 1 QA Engineer
- 1 Code Reviewer

## Process

1. Analyze feature requirements
2. Generate or load feature PRP
3. Deploy specialized team
4. Implement with test-driven development
5. Create PR when complete

## Feature Workflow

1. **Planning**: Team reviews requirements
2. **Implementation**: TDD approach
3. **Testing**: Comprehensive test coverage
4. **Review**: Internal code review
5. **PR Creation**: Automated PR with details

## Success Criteria

- All acceptance criteria met
- Tests passing with >80% coverage
- Code review approved
- No regressions in existing features
- Documentation updated

## Monitoring

Check progress with:
- \`/feature-status [feature-name]\`
- \`/orchestrate-status\`

Feature-focused orchestration ensures dedicated attention to critical features!`;
}

function generateOrchestratorStatusCommand(): string {
  return `# Check Orchestration Status

View the current status of your AI orchestration team.

## Usage

\`/orchestrate-status\` - Show current team status
\`/orchestrate-status detailed\` - Include agent performance metrics
\`/orchestrate-status logs\` - Show recent agent activity

## Status Information

### Team Overview
- Active agents and their roles
- Current tasks being worked on
- Blocked agents needing attention
- Overall progress metrics

### Git Activity
- Recent commits by agents
- Current branch structure
- Pending changes

### Performance Metrics
- Tasks completed per agent
- Average task completion time
- Code quality scores
- Communication efficiency

### Health Indicators
- Agent uptime
- Error rates
- Blocker frequency
- Recovery success rate

## Status Codes

- 🟢 **Active**: Agent working normally
- 🟡 **Idle**: No activity for 30+ minutes
- 🔴 **Blocked**: Agent needs help
- ⚫ **Offline**: Agent not responding

## Quick Actions

Based on status, you might:
1. Unblock agents with additional context
2. Adjust team size for workload
3. Review and merge completed work
4. Address quality issues

## Dashboard View

For real-time monitoring:
\`tmux attach -t cf-[project-name]\`

This lets you watch agents work in real-time!`;
}

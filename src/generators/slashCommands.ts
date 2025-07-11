import { ProjectConfig } from '../types';

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

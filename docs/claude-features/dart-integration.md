# Dart Integration - Context Forge

## Overview

Context Forge v3.2.1 introduces comprehensive Dart task management integration through intelligent hooks that automatically track progress, document changes, and maintain task-file relationships throughout your development workflow.

## Features

### 🎯 Automatic Task Progress Tracking
- **File-based detection**: Automatically identifies tasks from file paths and patterns
- **Git integration**: Tracks commit messages for task completion signals
- **Progress history**: Maintains detailed logs of task progression
- **Smart suggestions**: AI-powered task status recommendations

### 📋 Intelligent Task Documentation
- **Code analysis**: Analyzes code structure, complexity, and changes
- **Automated comments**: Creates detailed task comments with development progress
- **Milestone tracking**: Documents significant events (builds, tests, commits)
- **Change categorization**: Organizes changes by project area (auth, API, UI, etc.)

### 🔗 File-Task Mapping
- **Pattern recognition**: Learns project-specific file organization patterns
- **Confidence scoring**: Provides reliability scores for task assignments
- **Category inference**: Automatically categorizes files and suggests appropriate tasks
- **Relationship maintenance**: Keeps track of which files belong to which tasks

## Generated Hooks

When Dart integration is enabled, Context Forge generates three additional hooks:

### 1. DartProgressUpdater.py
**Purpose**: Automatically updates task progress based on code changes and git commits

**Triggers**:
- File creation (`Write` tool)
- File modification (`Edit`, `MultiEdit` tools)
- Git commits (`Bash` tool with `git commit`)

**Outputs**:
- `.claude/dart_progress.json` - Progress tracking data
- `.claude/task_suggestions.json` - AI-generated status suggestions

### 2. AutoTaskCommenter.py
**Purpose**: Adds detailed comments to tasks with code change analysis

**Analysis Features**:
- Function and line count tracking
- Code complexity assessment
- File categorization (authentication, API, UI, database, etc.)
- Change impact analysis

**Outputs**:
- `.claude/task_comments.json` - Automated task comments
- `.claude/milestone_comments.json` - Build/test/commit milestones

### 3. TaskCodeMapper.py
**Purpose**: Maintains intelligent mapping between tasks and code files

**Detection Patterns**:
- Explicit task patterns: `task-123`, `feature-login`, `bug-fix`
- Category inference: `auth/`, `api/`, `ui/`, `database/`
- Project-specific keywords: authentication, user management, integration

**Outputs**:
- `.claude/task_mapping.json` - File-to-task relationships
- `.claude/task_assignments.json` - Assignment suggestions

## Configuration

### Enabling Dart Integration

During project initialization:
```bash
context-forge init
```

Select "Yes" when prompted:
```
? Enable Dart task integration? Yes
```

Or enable in existing projects by adding to your project config:
```json
{
  "extras": {
    "dartIntegration": true
  }
}
```

### Project-Specific Categories

The hooks automatically recognize common project categories:

- **Authentication**: `auth`, `login`, `register`, `user`, `session`
- **User Management**: `user`, `profile`, `account`, `member`, `team`
- **API Development**: `api`, `route`, `endpoint`, `handler`, `service`
- **UI Components**: `component`, `ui`, `interface`, `layout`, `style`
- **Database**: `model`, `schema`, `migration`, `seed`, `db`
- **Integration**: `integration`, `webhook`, `external`, `third-party`
- **Testing**: `test`, `spec`, `e2e`, `integration`

## Generated Files

### `.claude/dart_progress.json`
Tracks task progress updates:
```json
{
  "updates": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "session_id": "abc123",
      "file_path": "src/auth/login.ts",
      "change_type": "modified",
      "task_id": "auth-login",
      "status": "in_progress"
    }
  ]
}
```

### `.claude/task_comments.json`
Automated task documentation:
```json
{
  "comments": [
    {
      "task_id": "auth-login",
      "timestamp": "2024-01-15T10:30:00Z",
      "file_path": "src/auth/login.ts",
      "action": "Edit",
      "comment": "## 🔧 Code Change - 2024-01-15 10:30 UTC\n**File**: src/auth/login.ts\n**Action**: Edit\n**Category**: Authentication\n**Complexity**: Medium\n\n✅ **Functions Modified**: 2\n📊 **Lines Added**: 15\n\n**Development Progress**:\n- Code structure implemented\n- Ready for testing and validation"
    }
  ]
}
```

### `.claude/task_mapping.json`
File-to-task relationships:
```json
{
  "mappings": [
    {
      "file_path": "src/auth/login.ts",
      "task_id": "auth_login",
      "task_category": "auth",
      "confidence": 0.9,
      "action": "Edit",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### `.claude/task_suggestions.json`
AI-generated task recommendations:
```json
{
  "suggestions": [
    {
      "task_id": "auth_login",
      "suggested_status": "in_progress",
      "reason": "File src/auth/login.ts was modified",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Best Practices

### 1. Consistent File Naming
Use descriptive file names that include task categories:
- `auth-login.ts` instead of `component1.ts`
- `api-user-handler.ts` instead of `handler.ts`
- `ui-dashboard-layout.tsx` instead of `layout.tsx`

### 2. Meaningful Commit Messages
Include task references in commit messages:
- `feat: implement user authentication (task-auth-123)`
- `fix: resolve login validation issue (bug-456)`
- `refactor: optimize API endpoints (task-api-789)`

### 3. Project Structure
Organize files by category to improve detection:
```
src/
├── auth/           # Authentication-related files
├── api/            # API handlers and services
├── ui/             # UI components and layouts
├── database/       # Models and migrations
└── integration/    # Third-party integrations
```

### 4. Regular Review
Periodically review generated files to ensure accuracy:
- Check task assignments in `.claude/task_assignments.json`
- Verify progress tracking in `.claude/dart_progress.json`
- Review automated comments for relevance

## Troubleshooting

### Hook Not Executing
1. Verify hooks are enabled in Claude Code settings
2. Check file permissions: `chmod +x .claude/hooks/*.py`
3. Ensure Python 3.6+ is available

### Incorrect Task Detection
1. Review file naming conventions
2. Check project structure organization
3. Adjust category keywords in hook configuration

### Missing Progress Updates
1. Verify file changes are being saved
2. Check git commit message format
3. Review session ID consistency

## Integration with Dart

The hooks generate data in formats compatible with Dart task management systems:

### Task Status Updates
```python
# Hook automatically suggests status changes
suggestion = {
    'task_id': 'auth_login',
    'suggested_status': 'completed',
    'reason': 'Task committed with comprehensive changes'
}
```

### Progress Tracking
```python
# Hook maintains detailed progress history
progress = {
    'task_id': 'auth_login',
    'files_modified': ['src/auth/login.ts', 'src/auth/types.ts'],
    'complexity_score': 'medium',
    'completion_confidence': 0.85
}
```

## Advanced Configuration

### Custom Category Patterns
Extend the hook configuration for project-specific patterns:

```python
# In TaskCodeMapper.py
project_patterns = {
    'custom_category': {
        'keywords': ['custom', 'special', 'unique'],
        'task_prefix': 'custom'
    }
}
```

### Confidence Thresholds
Adjust confidence levels for task assignment:

```python
# Higher confidence required for automatic assignment
if inferred_task['confidence'] > 0.8:  # Default: 0.7
    suggest_task_assignment(inferred_task, file_path)
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review generated log files in `.claude/`
3. Open an issue on [GitHub](https://github.com/webdevtodayjason/context-forge)
4. Join our community discussions

---

*This documentation covers Context Forge v3.2.1 Dart integration features. For general Context Forge usage, see the main README.*
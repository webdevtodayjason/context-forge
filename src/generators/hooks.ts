import path from 'path';
import fs from 'fs-extra';
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

export interface HooksConfig {
  sourceRepo?: string;
  customHooks?: string[];
  enabledHooks?: string[];
}

export async function generateHooks(config: ProjectConfig): Promise<GeneratedFile[]> {
  if (!config.extras.hooks) {
    return [];
  }

  const files: GeneratedFile[] = [];

  // Add hooks configuration directory structure
  files.push({
    path: path.join('.claude', 'hooks', 'README.md'),
    content: generateHooksReadme(config),
    description: 'Claude Code hooks documentation',
  });

  // Add common hooks based on project type
  const commonHooks = getCommonHooks(config);

  for (const hook of commonHooks) {
    files.push({
      path: path.join('.claude', 'hooks', hook.filename),
      content: hook.content,
      description: hook.description,
    });
  }

  return files;
}

export async function copyHooksFromRepo(
  hooksRepoPath: string,
  targetPath: string,
  selectedHooks?: string[]
): Promise<void> {
  // Check if hooks repo exists
  if (!(await fs.pathExists(hooksRepoPath))) {
    throw new Error(`Hooks repository not found at: ${hooksRepoPath}`);
  }

  const hooksDir = path.join(hooksRepoPath, 'hooks');
  if (!(await fs.pathExists(hooksDir))) {
    throw new Error(`Hooks directory not found in repository: ${hooksDir}`);
  }

  // Ensure target hooks directory exists
  const targetHooksDir = path.join(targetPath, '.claude', 'hooks');
  await fs.ensureDir(targetHooksDir);

  // Get list of available hooks
  const availableHooks = await fs.readdir(hooksDir);
  const hooksToProcess = selectedHooks || availableHooks;

  // Copy selected hooks
  for (const hookFile of hooksToProcess) {
    const sourcePath = path.join(hooksDir, hookFile);
    const targetFilePath = path.join(targetHooksDir, hookFile);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetFilePath);
    }
  }
}

function generateHooksReadme(config: ProjectConfig): string {
  return `# Claude Code Hooks

This directory contains Claude Code hooks that enhance your development workflow with automated context management and project-specific behaviors.

## About Hooks

Claude Code hooks are scripts that run at specific points during development:
- **PreCompact**: Runs before context is compacted to preserve important information
- **PostMessage**: Runs after each message to maintain project state
- **PreSubmit**: Runs before submitting code to validate quality

## Project Configuration

Project: ${config.projectName}
Type: ${config.projectType}
Tech Stack: ${Object.values(config.techStack).filter(Boolean).join(', ')}

## Available Hooks

### Context Management
- **PreCompact**: Preserves project context, CLAUDE.md, and recent changes
- **ContextRotation**: Manages context window by preserving critical information

### Quality Gates
- **PreSubmit**: Validates code quality before submission
- **LintAndTest**: Runs linting and testing before commits

### Project Specific
- **ProjectStatePreservation**: Maintains project-specific state information
- **FeatureTracking**: Tracks feature implementation progress

## Hook Configuration

Hooks are automatically detected by Claude Code. To customize hook behavior:

1. Edit hook files directly in this directory
2. Add project-specific logic based on your needs
3. Configure hook triggers in Claude settings

## Usage Tips

- Hooks run automatically based on their triggers
- Check Claude Code logs if hooks aren't working as expected
- Hooks can access project files and context
- Use hooks to maintain context across long development sessions

## Troubleshooting

If hooks aren't working:
1. Check file permissions (hooks need to be executable)
2. Verify Claude Code settings have hooks enabled
3. Review hook logs for error messages
4. Ensure required dependencies are installed

For more information, see: https://docs.anthropic.com/claude-code/hooks
`;
}

interface HookTemplate {
  filename: string;
  content: string;
  description: string;
}

function getCommonHooks(config: ProjectConfig): HookTemplate[] {
  const hooks: HookTemplate[] = [];

  // PreCompact hook - essential for context preservation
  hooks.push({
    filename: 'PreCompact.py',
    content: generatePreCompactHook(config),
    description: 'Preserves project context before compaction',
  });

  // Context rotation hook for long sessions
  hooks.push({
    filename: 'ContextRotation.py',
    content: generateContextRotationHook(config),
    description: 'Manages context window for long development sessions',
  });

  // Quality gate hook
  if (config.extras.testing || config.extras.linting) {
    hooks.push({
      filename: 'PreSubmit.py',
      content: generatePreSubmitHook(config),
      description: 'Validates code quality before submission',
    });
  }

  // PRP tracking hook
  if (config.extras.prp) {
    hooks.push({
      filename: 'PRPTracking.py',
      content: generatePRPTrackingHook(config),
      description: 'Tracks PRP implementation progress',
    });
  }

  // Dart integration hooks
  if (config.extras.dartIntegration) {
    hooks.push({
      filename: 'DartProgressUpdater.py',
      content: generateDartProgressUpdaterHook(config),
      description: 'Updates Dart task progress based on code changes',
    });
    
    hooks.push({
      filename: 'AutoTaskCommenter.py',
      content: generateAutoTaskCommenterHook(config),
      description: 'Adds detailed comments to Dart tasks',
    });
    
    hooks.push({
      filename: 'TaskCodeMapper.py',
      content: generateTaskCodeMapperHook(config),
      description: 'Maps Dart tasks to code files intelligently',
    });
  }

  return hooks;
}

function generatePreCompactHook(config: ProjectConfig): string {
  const criticalFiles = [
    'CLAUDE.md',
    'README.md',
    'package.json',
    'requirements.txt',
    '.env.example',
    'PRPs/**/*.md',
    'Docs/**/*.md',
    'docs/**/*.md',
  ];

  if (config.extras.prp) {
    criticalFiles.push('PRPs/**/*.md');
    criticalFiles.push('.claude/commands/**/*.md');
    criticalFiles.push('CONTEXT-FORGE-FILE-MAPPING.md');
    criticalFiles.push('PRIME-CONTEXT-ENHANCEMENT.md');
  }

  if (config.extras.aiDocs) {
    criticalFiles.push('ai_docs/**/*.md');
  }

  // Add Dart integration status files
  if (config.extras.dartIntegration) {
    criticalFiles.push('.claude/rotation_context.json');
    criticalFiles.push('.claude/checkpoint_status.json');
    criticalFiles.push('.claude/dart_progress.json');
    criticalFiles.push('.claude/task_mapping.json');
    criticalFiles.push('.claude/phase_progress.json');
  }

  return `#!/usr/bin/env python3
"""
PreCompact Hook for ${config.projectName}

Preserves critical project information before context is compacted.
This ensures important context is maintained across development sessions.
"""

import os
import json
import glob
from datetime import datetime
from pathlib import Path

def main():
    """
    Preserve critical project context before compaction.
    """
    try:
        project_info = {
            "project_name": "${config.projectName}",
            "project_type": "${config.projectType}",
            "tech_stack": ${JSON.stringify(config.techStack)},
            "last_preserved": datetime.now().isoformat(),
            "critical_files": []
        }
        
        # Critical files to preserve
        critical_patterns = ${JSON.stringify(criticalFiles)}
        
        for pattern in critical_patterns:
            files = glob.glob(pattern, recursive=True)
            for file_path in files:
                if os.path.exists(file_path):
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        project_info["critical_files"].append({
                            "path": file_path,
                            "size": len(content),
                            "last_modified": os.path.getmtime(file_path),
                            "preview": content[:500] + "..." if len(content) > 500 else content
                        })
                    except Exception as e:
                        print(f"Warning: Could not read {file_path}: {e}")
        
        # Save context summary
        context_file = ".claude/context_summary.json"
        os.makedirs(os.path.dirname(context_file), exist_ok=True)
        
        with open(context_file, 'w', encoding='utf-8') as f:
            json.dump(project_info, f, indent=2)
        
        print(f"✅ PreCompact: Preserved context for {len(project_info['critical_files'])} files")
        
        # Generate context prompt for next session
        generate_context_prompt(project_info)
        
    except Exception as e:
        print(f"❌ PreCompact hook failed: {e}")

def generate_context_prompt(project_info):
    """Generate a comprehensive context restoration prompt for PRD/PRP workflow."""
    
    # Categorize files by type
    prp_files = []
    doc_files = []
    command_files = []
    status_files = []
    
    for file_info in project_info["critical_files"]:
        path = file_info["path"]
        if "/PRPs/" in path or path.startswith("PRPs/"):
            prp_files.append(file_info)
        elif "/commands/" in path or path.startswith(".claude/commands/"):
            command_files.append(file_info)
        elif path.endswith(".json") and any(status in path for status in ["dart_progress", "task_mapping", "phase_progress", "checkpoint_status"]):
            status_files.append(file_info)
        elif path.endswith(".md"):
            doc_files.append(file_info)
    
    prompt = f"""# Context Restoration for ${config.projectName}

## Project Overview
- **Name**: ${config.projectName}
- **Type**: ${config.projectType}
- **Tech Stack**: {', '.join([f"{k}: {v}" for k, v in project_info["tech_stack"].items() if v])}

## Recent Context
- **Last Preserved**: {project_info["last_preserved"]}
- **Files Tracked**: {len(project_info["critical_files"])} critical files
- **PRPs Tracked**: {len(prp_files)} PRP files
- **Commands Available**: {len(command_files)} slash commands
- **Status Files**: {len(status_files)} status tracking files

## PRD/PRP Workflow Files
"""
    
    if prp_files:
        prompt += "### Product Requirement Profiles (PRPs)\\n"
        for file_info in prp_files:
            prompt += f"- **{file_info['path']}** ({file_info['size']} chars)\\n"
        prompt += "\\n"
    
    if command_files:
        prompt += "### Available Slash Commands\\n"
        for file_info in command_files:
            command_name = file_info['path'].split('/')[-1].replace('.md', '')
            prompt += f"- **/{command_name}** - {file_info['path']}\\n"
        prompt += "\\n"
    
    if status_files:
        prompt += "### Task & Progress Tracking\\n"
        for file_info in status_files:
            status_type = file_info['path'].split('/')[-1].replace('.json', '')
            prompt += f"- **{status_type}** - {file_info['size']} chars of status data\\n"
        prompt += "\\n"
    
    prompt += f"""## Quick Start Commands
- \`/prime-context\` - Load full project understanding
- \`/prp-create [feature]\` - Create new feature PRP
- \`/prp-execute [prp-file]\` - Execute specific PRP
- \`/checkpoint [milestone]\` - Request human verification
- \`/orchestrate-status\` - Check project orchestration status
- \`/validate-prp [prp-file]\` - Validate PRP completeness

## Critical Documentation Files
"""
    
    for file_info in doc_files[:10]:  # Top 10 documentation files
        prompt += f"- **{file_info['path']}** ({file_info['size']} chars)\\n"
    
    prompt += f"""
## Context Restoration Instructions
1. Review the current task from Implementation.md
2. Check active PRPs and their execution status
3. Use \`/prime-context\` to load comprehensive project context
4. Continue with PRP workflow or create new PRPs as needed
5. Verify Dart integration status if available
6. Use \`/checkpoint\` before major milestone transitions

## PRD/PRP Workflow Best Practices
- Always validate PRPs before execution with \`/validate-prp\`
- Use \`/orchestrate-status\` to check overall project health
- Maintain checkpoint verification for major milestones
- Keep PRPs focused and executable
- Document all changes in appropriate PRP files

---
*This context was automatically preserved by Claude Code PreCompact Hook*
"""
    
    # Save restoration prompt
    with open(".claude/context_restoration.md", 'w', encoding='utf-8') as f:
        f.write(prompt)

if __name__ == "__main__":
    main()
`;
}

function generateContextRotationHook(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""
Context Rotation Hook for ${config.projectName}

Manages context window during long development sessions by preserving
essential PRD/PRP information when context approaches limits.
"""

import os
import json
from datetime import datetime

def main():
    """
    Manage context rotation for long development sessions.
    """
    try:
        # Check if we're approaching context limits
        # This is a placeholder - actual implementation would check with Claude API
        
        rotation_info = {
            "project": "${config.projectName}",
            "rotation_time": datetime.now().isoformat(),
            "preserved_context": {
                "current_task": "Check CLAUDE.md for current focus",
                "recent_changes": "Check git log --oneline -10",
                "active_prps": "List of currently active PRPs",
                "checkpoint_status": "Last checkpoint verification status"
            }
        }
        
        # Save rotation context
        os.makedirs(".claude", exist_ok=True)
        with open(".claude/rotation_context.json", 'w') as f:
            json.dump(rotation_info, f, indent=2)
            
        print("🔄 Context rotation: Essential information preserved")
        
    except Exception as e:
        print(f"❌ Context rotation hook failed: {e}")

if __name__ == "__main__":
    main()
`;
}

function generatePreSubmitHook(config: ProjectConfig): string {
  const lintCommand = config.techStack.frontend === 'nextjs' ? 'npm run lint' : 'eslint .';
  const testCommand = config.techStack.frontend === 'nextjs' ? 'npm test' : 'npm run test';

  return `#!/usr/bin/env python3
"""
PreSubmit Hook for ${config.projectName}

Validates code quality before submission by running linting and tests.
"""

import subprocess
import sys
import os

def main():
    """
    Run quality checks before code submission.
    """
    try:
        print("🔍 Running pre-submit quality checks...")
        
        checks_passed = True
        
        ${
          config.extras.linting
            ? `
        # Run linting
        print("📋 Running linting...")
        result = subprocess.run("${lintCommand}", shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Linting failed:\\n{result.stdout}\\n{result.stderr}")
            checks_passed = False
        else:
            print("✅ Linting passed")
        `
            : '# Linting disabled'
        }
        
        ${
          config.extras.testing
            ? `
        # Run tests
        print("🧪 Running tests...")
        result = subprocess.run("${testCommand}", shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Tests failed:\\n{result.stdout}\\n{result.stderr}")
            checks_passed = False
        else:
            print("✅ Tests passed")
        `
            : '# Testing disabled'
        }
        
        # Check for critical patterns
        print("🔍 Checking for critical patterns...")
        critical_patterns = [
            "TODO:",
            "FIXME:",
            "console.log(",
            "debugger;",
            "import pdb"
        ]
        
        for pattern in critical_patterns:
            result = subprocess.run(f"grep -r '{pattern}' src/ || true", shell=True, capture_output=True, text=True)
            if result.stdout.strip():
                print(f"⚠️  Found {pattern} in code:")
                print(result.stdout)
        
        if checks_passed:
            print("✅ All pre-submit checks passed!")
            return 0
        else:
            print("❌ Pre-submit checks failed!")
            return 1
            
    except Exception as e:
        print(f"❌ Pre-submit hook failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
`;
}

function generatePRPTrackingHook(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""
PRP Tracking Hook for ${config.projectName}

Tracks PRP implementation progress and provides status updates.
"""

import os
import json
import glob
from datetime import datetime

def main():
    """
    Track PRP implementation progress.
    """
    try:
        prp_status = {
            "project": "${config.projectName}",
            "updated": datetime.now().isoformat(),
            "prps": []
        }
        
        # Find all PRP files
        prp_files = glob.glob("PRPs/*.md")
        
        for prp_file in prp_files:
            if os.path.exists(prp_file):
                with open(prp_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Basic PRP analysis
                prp_info = {
                    "file": prp_file,
                    "name": os.path.basename(prp_file).replace('.md', ''),
                    "size": len(content),
                    "has_validation": "## Validation Gates" in content,
                    "has_tasks": "## Task Breakdown" in content,
                    "completion_indicators": content.count("- [x]"),
                    "pending_tasks": content.count("- [ ]"),
                    "last_modified": os.path.getmtime(prp_file)
                }
                
                prp_status["prps"].append(prp_info)
        
        # Save PRP status
        os.makedirs(".claude", exist_ok=True)
        with open(".claude/prp_status.json", 'w') as f:
            json.dump(prp_status, f, indent=2)
        
        print(f"📋 PRP Tracking: {len(prp_status['prps'])} PRPs tracked")
        
        # Print summary
        for prp in prp_status["prps"]:
            completion = prp["completion_indicators"] / max(1, prp["completion_indicators"] + prp["pending_tasks"]) * 100
            print(f"  - {prp['name']}: {completion:.0f}% complete")
        
    except Exception as e:
        print(f"❌ PRP tracking hook failed: {e}")

if __name__ == "__main__":
    main()
`;
}

function generateDartProgressUpdaterHook(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""
Dart Progress Updater Hook for ${config.projectName}

Automatically updates Dart task progress based on code changes and git commits.
"""

import json
import os
import sys
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

def main():
    """Main entry point for the Dart progress updater hook."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract relevant information
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_response = input_data.get('tool_response', {})
        session_id = input_data.get('session_id', 'unknown')
        
        # Process based on tool type
        if tool_name == 'Write':
            file_path = tool_input.get('file_path', '')
            if file_path and tool_response.get('success'):
                update_progress_for_file_change(file_path, 'created', session_id)
        
        elif tool_name in ['Edit', 'MultiEdit']:
            file_path = tool_input.get('file_path', '')
            if file_path and tool_response.get('success'):
                update_progress_for_file_change(file_path, 'modified', session_id)
        
        elif tool_name == 'Bash':
            command = tool_input.get('command', '')
            if 'git commit' in command and tool_response.get('success'):
                update_progress_for_git_commit(command, session_id)
        
        print("✅ Dart progress updated successfully")
        
    except json.JSONDecodeError:
        print("❌ Invalid JSON input", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Dart progress updater failed: {e}", file=sys.stderr)
        sys.exit(1)

def update_progress_for_file_change(file_path, change_type, session_id):
    """Update task progress based on file changes."""
    try:
        # Extract task ID from file path or commit messages
        task_id = detect_task_from_file_changes(file_path)
        
        if task_id:
            progress_entry = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'session_id': session_id,
                'file_path': file_path,
                'change_type': change_type,
                'task_id': task_id,
                'status': 'in_progress'
            }
            
            # Save progress update
            save_progress_update(progress_entry)
            
            # Suggest task status update
            suggest_task_status_update(task_id, file_path, change_type)
    
    except Exception as e:
        print(f"Warning: Could not update progress for file {file_path}: {e}")

def detect_task_from_file_changes(file_path):
    """Detect task ID from file path patterns."""
    # Common patterns for task detection
    patterns = [
        r'task[-_](\w+)',
        r'feature[-_](\w+)',
        r'bug[-_](\w+)',
        r'issue[-_](\w+)',
        r'prp[-_](\w+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, file_path, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def save_progress_update(progress_entry):
    """Save progress update to file."""
    progress_file = Path('.claude/dart_progress.json')
    progress_file.parent.mkdir(exist_ok=True)
    
    # Load existing progress
    progress_data = {'updates': []}
    if progress_file.exists():
        try:
            with open(progress_file, 'r') as f:
                progress_data = json.load(f)
        except:
            pass
    
    # Add new entry
    progress_data['updates'].append(progress_entry)
    
    # Keep only recent entries (last 100)
    progress_data['updates'] = progress_data['updates'][-100:]
    
    # Save updated progress
    with open(progress_file, 'w') as f:
        json.dump(progress_data, f, indent=2)

def suggest_task_status_update(task_id, file_path, change_type):
    """Suggest task status update based on changes."""
    suggestion = {
        'task_id': task_id,
        'suggested_status': 'in_progress',
        'reason': f"File {file_path} was {change_type}",
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    # Save suggestion
    suggestions_file = Path('.claude/task_suggestions.json')
    suggestions_file.parent.mkdir(exist_ok=True)
    
    suggestions_data = {'suggestions': []}
    if suggestions_file.exists():
        try:
            with open(suggestions_file, 'r') as f:
                suggestions_data = json.load(f)
        except:
            pass
    
    suggestions_data['suggestions'].append(suggestion)
    suggestions_data['suggestions'] = suggestions_data['suggestions'][-50:]
    
    with open(suggestions_file, 'w') as f:
        json.dump(suggestions_data, f, indent=2)

if __name__ == "__main__":
    main()
`;
}
function generateAutoTaskCommenterHook(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""
Auto Task Commenter Hook for ${config.projectName}

Adds detailed comments to Dart tasks with code change summaries.
"""

import json
import os
import sys
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

def main():
    """Main entry point for the auto task commenter hook."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract relevant information
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_response = input_data.get('tool_response', {})
        session_id = input_data.get('session_id', 'unknown')
        
        # Process based on tool type
        if tool_name in ['Write', 'Edit', 'MultiEdit']:
            file_path = tool_input.get('file_path', '')
            if file_path and tool_response.get('success'):
                create_task_comment(file_path, tool_name, tool_input, session_id)
        
        elif tool_name == 'Bash':
            command = tool_input.get('command', '')
            if any(cmd in command for cmd in ['npm run build', 'npm run test', 'git commit']):
                create_milestone_comment(command, tool_response, session_id)
        
        print("✅ Task comments updated successfully")
        
    except json.JSONDecodeError:
        print("❌ Invalid JSON input", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Auto task commenter failed: {e}", file=sys.stderr)
        sys.exit(1)

def create_task_comment(file_path, tool_name, tool_input, session_id):
    """Create detailed task comment based on file changes."""
    try:
        # Detect task from file path
        task_id = detect_task_from_file_path(file_path)
        
        if task_id:
            # Analyze the code change
            change_analysis = analyze_code_structure(file_path, tool_name, tool_input)
            
            # Generate comment text
            comment_text = generate_comment_text(file_path, tool_name, change_analysis)
            
            if should_create_comment(change_analysis):
                comment_entry = {
                    'task_id': task_id,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'session_id': session_id,
                    'file_path': file_path,
                    'action': tool_name,
                    'comment': comment_text,
                    'analysis': change_analysis
                }
                
                save_task_comment(comment_entry)
    
    except Exception as e:
        print(f"Warning: Could not create task comment for {file_path}: {e}")

def detect_task_from_file_path(file_path):
    """Detect task ID from file path patterns."""
    # First try explicit task patterns
    patterns = [
        r'task[-_](\w+)',
        r'feature[-_](\w+)',
        r'bug[-_](\w+)',
        r'issue[-_](\w+)',
        r'prp[-_](\w+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, file_path, re.IGNORECASE)
        if match:
            return match.group(1)
    
    # Infer from file category
    return infer_task_from_file_category(file_path)

def analyze_code_structure(file_path, tool_name, tool_input):
    """Analyze code structure to understand the change."""
    analysis = {
        'file_type': get_file_type(file_path),
        'change_type': tool_name,
        'estimated_complexity': 'medium',
        'functions_added': 0,
        'functions_modified': 0,
        'imports_added': 0,
        'lines_added': 0,
        'category': categorize_file_change(file_path)
    }
    
    try:
        # Analyze the content if available
        if tool_name == 'Write' and 'content' in tool_input:
            content = tool_input['content']
            analysis.update(analyze_content_structure(content, analysis['file_type']))
        
        elif tool_name in ['Edit', 'MultiEdit']:
            # For edits, we can analyze the change patterns
            if 'old_string' in tool_input and 'new_string' in tool_input:
                analysis.update(analyze_edit_changes(
                    tool_input['old_string'], 
                    tool_input['new_string'],
                    analysis['file_type']
                ))
    
    except Exception as e:
        print(f"Warning: Could not analyze code structure: {e}")
    
    return analysis

def generate_comment_text(file_path, tool_name, analysis):
    """Generate detailed comment text for the task."""
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    
    comment_parts = [
        f"## 🔧 Code Change - {timestamp}",
        f"**File**: {file_path}",
        f"**Action**: {tool_name}",
        f"**Category**: {analysis['category'].replace('_', ' ').title()}",
        f"**Complexity**: {analysis['estimated_complexity'].title()}",
        ""
    ]
    
    # Add specific details based on analysis
    if analysis.get('functions_added', 0) > 0:
        comment_parts.append(f"✅ **Functions Added**: {analysis['functions_added']}")
    
    if analysis.get('functions_modified', 0) > 0:
        comment_parts.append(f"🔄 **Functions Modified**: {analysis['functions_modified']}")
    
    if analysis.get('lines_added', 0) > 0:
        comment_parts.append(f"📊 **Lines Added**: {analysis['lines_added']}")
    
    if analysis.get('net_change', 0) != 0:
        change_type = "increased" if analysis['net_change'] > 0 else "decreased"
        comment_parts.append(f"📈 **Net Change**: {abs(analysis['net_change'])} lines {change_type}")
    
    comment_parts.extend([
        "",
        "**Development Progress**:",
        "- Code structure implemented",
        "- Ready for testing and validation",
        "",
        "---",
        "*This update was automatically generated by Claude Code task tracker*"
    ])
    
    return '\\n'.join(comment_parts)

def should_create_comment(analysis):
    """Determine if a comment should be created based on analysis."""
    # Create comments for significant changes
    if analysis.get('functions_added', 0) > 0:
        return True
    
    if analysis.get('lines_added', 0) > 20:
        return True
    
    if analysis.get('estimated_complexity') in ['medium', 'high']:
        return True
    
    if analysis.get('category') in ['authentication', 'api_development', 'database']:
        return True
    
    return False

def save_task_comment(comment_entry):
    """Save task comment to file."""
    comments_file = Path('.claude/task_comments.json')
    comments_file.parent.mkdir(exist_ok=True)
    
    comments_data = {'comments': []}
    if comments_file.exists():
        try:
            with open(comments_file, 'r') as f:
                comments_data = json.load(f)
        except:
            pass
    
    comments_data['comments'].append(comment_entry)
    comments_data['comments'] = comments_data['comments'][-100:]  # Keep last 100
    
    with open(comments_file, 'w') as f:
        json.dump(comments_data, f, indent=2)

if __name__ == "__main__":
    main()
`;
}

function generateTaskCodeMapperHook(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""
Task Code Mapper Hook for ${config.projectName}

Maintains intelligent mapping between Dart tasks and code files.
"""

import json
import os
import sys
import re
from datetime import datetime, timezone
from pathlib import Path

def main():
    """Main entry point for the task code mapper hook."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract relevant information
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_response = input_data.get('tool_response', {})
        session_id = input_data.get('session_id', 'unknown')
        
        # Process file changes
        if tool_name in ['Write', 'Edit', 'MultiEdit']:
            file_path = tool_input.get('file_path', '')
            if file_path and tool_response.get('success'):
                update_task_mapping(file_path, tool_name, session_id)
        
        print("✅ Task mapping updated successfully")
        
    except json.JSONDecodeError:
        print("❌ Invalid JSON input", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Task code mapper failed: {e}", file=sys.stderr)
        sys.exit(1)

def update_task_mapping(file_path, action, session_id):
    """Update the mapping between tasks and code files."""
    try:
        # Infer task from file path
        inferred_task = infer_task_from_file_path(file_path)
        
        if inferred_task:
            # Create mapping entry
            mapping_entry = {
                'file_path': file_path,
                'task_id': inferred_task['task_id'],
                'task_category': inferred_task['category'],
                'confidence': inferred_task['confidence'],
                'action': action,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'session_id': session_id
            }
            
            # Save mapping
            save_task_mapping(mapping_entry)
            
            # Suggest task assignment if confidence is high
            if inferred_task['confidence'] > 0.7:
                suggest_task_assignment(inferred_task, file_path)
    
    except Exception as e:
        print(f"Warning: Could not update task mapping for {file_path}: {e}")

def infer_task_from_file_path(file_path):
    """Infer task information from file path."""
    # Project-specific patterns for ${config.projectName}
    project_patterns = {
        'auth': {
            'keywords': ['auth', 'login', 'register', 'user', 'session', 'jwt', 'token'],
            'task_prefix': 'auth'
        },
        'user_management': {
            'keywords': ['user', 'profile', 'account', 'member', 'team'],
            'task_prefix': 'user'
        },
        'api': {
            'keywords': ['api', 'route', 'endpoint', 'handler', 'service', 'controller'],
            'task_prefix': 'api'
        },
        'ui': {
            'keywords': ['component', 'ui', 'interface', 'layout', 'style', 'theme'],
            'task_prefix': 'ui'
        },
        'database': {
            'keywords': ['model', 'schema', 'migration', 'seed', 'db', 'entity'],
            'task_prefix': 'db'
        },
        'integration': {
            'keywords': ['integration', 'webhook', 'external', 'third-party', 'slack'],
            'task_prefix': 'integration'
        },
        'testing': {
            'keywords': ['test', 'spec', '__tests__', 'e2e', 'integration'],
            'task_prefix': 'test'
        }
    }
    
    file_lower = file_path.lower()
    best_match = None
    highest_confidence = 0
    
    for category, config in project_patterns.items():
        confidence = 0
        matched_keywords = []
        
        # Check keywords in file path
        for keyword in config['keywords']:
            if keyword in file_lower:
                confidence += 0.2
                matched_keywords.append(keyword)
        
        # Boost confidence for specific file patterns
        if category == 'auth' and any(pattern in file_lower for pattern in ['login', 'register', 'auth']):
            confidence += 0.3
        
        elif category == 'api' and any(pattern in file_lower for pattern in ['route', 'handler', 'controller']):
            confidence += 0.3
        
        elif category == 'ui' and any(pattern in file_lower for pattern in ['component', 'layout', 'page']):
            confidence += 0.3
        
        elif category == 'database' and any(pattern in file_lower for pattern in ['model', 'schema', 'migration']):
            confidence += 0.3
        
        # Check file location patterns
        if f'/{category}/' in file_lower or f'\\\\{category}\\\\' in file_lower:
            confidence += 0.2
        
        # Update best match
        if confidence > highest_confidence:
            highest_confidence = confidence
            best_match = {
                'category': category,
                'task_id': f"{config['task_prefix']}_{generate_task_id(file_path)}",
                'confidence': confidence,
                'matched_keywords': matched_keywords
            }
    
    return best_match

def save_task_mapping(mapping_entry):
    """Save task mapping to file."""
    mapping_file = Path('.claude/task_mapping.json')
    mapping_file.parent.mkdir(exist_ok=True)
    
    mapping_data = {'mappings': []}
    if mapping_file.exists():
        try:
            with open(mapping_file, 'r') as f:
                mapping_data = json.load(f)
        except:
            pass
    
    mapping_data['mappings'].append(mapping_entry)
    mapping_data['mappings'] = mapping_data['mappings'][-200:]  # Keep last 200
    
    with open(mapping_file, 'w') as f:
        json.dump(mapping_data, f, indent=2)

if __name__ == "__main__":
    main()
`;
}
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
    'docs/**/*.md',
  ];

  if (config.extras.prp) {
    criticalFiles.push('PRPs/**/*.md');
  }

  if (config.extras.aiDocs) {
    criticalFiles.push('ai_docs/**/*.md');
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
    """Generate a context restoration prompt."""
    prompt = f"""# Context Restoration for ${config.projectName}

## Project Overview
- **Name**: ${config.projectName}
- **Type**: ${config.projectType}
- **Tech Stack**: {', '.join([f"{k}: {v}" for k, v in project_info["tech_stack"].items() if v])}

## Recent Context
- **Last Preserved**: {project_info["last_preserved"]}
- **Files Tracked**: {len(project_info["critical_files"])} critical files

## Quick Start Commands
- \`/prime-context\` - Load project understanding
- \`/prp-create [feature]\` - Create new feature PRP
- \`/checkpoint [milestone]\` - Request human verification

## Critical Files Summary
"""
    
    for file_info in project_info["critical_files"][:10]:  # Top 10 files
        prompt += f"- **{file_info['path']}**: {file_info['size']} chars\\n"
    
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
essential information when context approaches limits.
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

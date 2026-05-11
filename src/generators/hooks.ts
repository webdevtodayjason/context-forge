/**
 * Hooks generator — emits .claude/hooks/*.sh (and a few legacy .py kept where
 * portable bash isn't a fit) plus a `getHooksFragment(config)` that W2
 * (`claudeSettings.ts`) merges into `.claude/settings.json` under `hooks`.
 *
 * 2026 Claude Code lifecycle events handled here:
 *   - PreCompact          — pre-compact.sh
 *   - UserPromptSubmit    — pre-submit.sh
 *   - PostToolUse         — lint-on-edit.sh (matcher: Edit|Write)
 *   - SessionStart        — session-start.sh
 *   - Stop                — stop.sh
 *
 * Hook scripts are emitted as `GeneratedFile` objects with an extra optional
 * `mode` field (0o755). The base `GeneratedFile` interface in
 * `src/adapters/base.ts` does NOT yet declare a `mode` field — see
 * `HookFile` below and the orchestrator note in the worker report.
 */
import path from 'path';
import fs from 'fs-extra';
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import { getEnhancementHooksFragment, generateEnhancementHooks } from './enhancementHooks';
import { getMigrationHooksFragment, generateMigrationHooks } from './migrationHooks';

// ---------------------------------------------------------------------------
// Public hook-fragment contract — mirrors the shapes in
// `src/generators/claudeSettings.ts` (W2). They are structurally identical;
// re-exporting here so any consumer can import either canonical source.
// ---------------------------------------------------------------------------

export interface HookRule {
  matcher?: string;
  hooks: { type: 'command'; command: string }[];
}

export interface SettingsHooksFragment {
  PreToolUse?: HookRule[];
  PostToolUse?: HookRule[];
  PreCompact?: HookRule[];
  SessionStart?: HookRule[];
  UserPromptSubmit?: HookRule[];
  Stop?: HookRule[];
  SubagentStop?: HookRule[];
  Notification?: HookRule[];
}

// Local extension of `GeneratedFile` so we can carry the unix mode bit through
// to the writer. Once the orchestrator extends GeneratedFile, this can be
// inlined.
export interface HookFile extends GeneratedFile {
  mode?: number;
}

export interface HooksConfig {
  sourceRepo?: string;
  customHooks?: string[];
  enabledHooks?: string[];
}

// ---------------------------------------------------------------------------
// Fragment merge helper
// ---------------------------------------------------------------------------

const LIFECYCLE_KEYS: (keyof SettingsHooksFragment)[] = [
  'PreToolUse',
  'PostToolUse',
  'PreCompact',
  'SessionStart',
  'UserPromptSubmit',
  'Stop',
  'SubagentStop',
  'Notification',
];

function mergeFragments(...frags: SettingsHooksFragment[]): SettingsHooksFragment {
  const out: SettingsHooksFragment = {};
  for (const frag of frags) {
    if (!frag) continue;
    for (const key of LIFECYCLE_KEYS) {
      const rules = frag[key];
      if (!rules || rules.length === 0) continue;
      out[key] = [...(out[key] ?? []), ...rules];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fragment builder — the public W2 contract entry point.
// ---------------------------------------------------------------------------

/**
 * Returns the hooks fragment that W2 will splice into `.claude/settings.json`.
 * Aggregates the base lifecycle hooks plus enhancement/migration fragments
 * when those configs are present. Returns `{}` when hooks are disabled in
 * `config.extras`.
 */
export function getHooksFragment(config: ProjectConfig): SettingsHooksFragment {
  if (!config?.extras?.hooks) {
    return {};
  }

  const base = buildBaseFragment(config);
  const enh = config.enhancementConfig ? getEnhancementHooksFragment(config) : {};
  const mig = config.migrationConfig ? getMigrationHooksFragment(config) : {};

  return mergeFragments(base, enh, mig);
}

function buildBaseFragment(config: ProjectConfig): SettingsHooksFragment {
  const fragment: SettingsHooksFragment = {
    PreCompact: [{ hooks: [{ type: 'command', command: './.claude/hooks/pre-compact.sh' }] }],
    UserPromptSubmit: [{ hooks: [{ type: 'command', command: './.claude/hooks/pre-submit.sh' }] }],
    SessionStart: [{ hooks: [{ type: 'command', command: './.claude/hooks/session-start.sh' }] }],
    Stop: [{ hooks: [{ type: 'command', command: './.claude/hooks/stop.sh' }] }],
  };

  // lint-on-edit only when linting/testing was requested
  if (config.extras?.linting || config.extras?.testing) {
    fragment.PostToolUse = [
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command', command: './.claude/hooks/lint-on-edit.sh' }],
      },
    ];
  }

  // PRP tracking — runs after Edit/Write so we can see PRP file mutations
  if (config.extras?.prp) {
    fragment.PostToolUse = [
      ...(fragment.PostToolUse ?? []),
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command', command: './.claude/hooks/prp-tracking.py' }],
      },
    ];
  }

  // Dart integration hooks — Python kept because the JSON wire-format parsing
  // and complex categorisation are awkward in pure bash.
  if (config.extras?.dartIntegration) {
    fragment.PostToolUse = [
      ...(fragment.PostToolUse ?? []),
      {
        matcher: 'Edit|Write|Bash',
        hooks: [
          { type: 'command', command: './.claude/hooks/dart-progress-updater.py' },
          { type: 'command', command: './.claude/hooks/auto-task-commenter.py' },
          { type: 'command', command: './.claude/hooks/task-code-mapper.py' },
        ],
      },
    ];
  }

  return fragment;
}

// ---------------------------------------------------------------------------
// File generation — emits the actual hook scripts.
// ---------------------------------------------------------------------------

export async function generateHooks(config: ProjectConfig): Promise<GeneratedFile[]> {
  if (!config.extras?.hooks) {
    return [];
  }

  const files: HookFile[] = [];

  files.push({
    path: path.join('.claude', 'hooks', 'README.md'),
    content: generateHooksReadme(config),
    description: 'Claude Code hooks documentation',
  });

  // Always-on lifecycle scripts
  files.push(
    executable(
      '.claude/hooks/pre-compact.sh',
      preCompactScript(config),
      'Snapshots branch + critical files before compaction (PreCompact)'
    )
  );
  files.push(
    executable(
      '.claude/hooks/pre-submit.sh',
      preSubmitScript(config),
      "Lints the user's most recent file change (UserPromptSubmit)"
    )
  );
  files.push(
    executable(
      '.claude/hooks/session-start.sh',
      sessionStartScript(config),
      'Prints orientation on session boot (SessionStart)'
    )
  );
  files.push(
    executable(
      '.claude/hooks/stop.sh',
      stopScript(config),
      'Appends a session-summary line to .claude/logs/sessions.jsonl (Stop)'
    )
  );

  if (config.extras?.linting || config.extras?.testing) {
    files.push(
      executable(
        '.claude/hooks/lint-on-edit.sh',
        lintOnEditScript(config),
        'Runs the project linter on a just-edited file (PostToolUse: Edit|Write)'
      )
    );
  }

  // PRP tracking — Python retained: scans many .md files and analyses checkbox
  // counts in a way much terser in Python.
  if (config.extras?.prp) {
    files.push(
      executable(
        '.claude/hooks/prp-tracking.py',
        prpTrackingPyScript(config),
        'Analyses PRP completion checkboxes (Python — complex md scanning)'
      )
    );
  }

  // Dart integration — Python retained for stdin-JSON parsing and pattern matching.
  if (config.extras?.dartIntegration) {
    files.push(
      executable(
        '.claude/hooks/dart-progress-updater.py',
        dartProgressUpdaterPy(config),
        'Updates Dart task progress (Python — needs stdin JSON)'
      )
    );
    files.push(
      executable(
        '.claude/hooks/auto-task-commenter.py',
        autoTaskCommenterPy(config),
        'Generates task comments from code analysis (Python)'
      )
    );
    files.push(
      executable(
        '.claude/hooks/task-code-mapper.py',
        taskCodeMapperPy(config),
        'Maps Dart tasks to changed files (Python)'
      )
    );
  }

  return files as GeneratedFile[];
}

function executable(filePath: string, content: string, description: string): HookFile {
  return { path: filePath, content, description, mode: 0o755 };
}

// ---------------------------------------------------------------------------
// Re-export helpers from sibling generators so a single import surface works.
// ---------------------------------------------------------------------------

export {
  generateEnhancementHooks,
  getEnhancementHooksFragment,
  generateMigrationHooks,
  getMigrationHooksFragment,
};

// ---------------------------------------------------------------------------
// Existing copy-from-repo helper (untouched behaviour).
// ---------------------------------------------------------------------------

export async function copyHooksFromRepo(
  hooksRepoPath: string,
  targetPath: string,
  selectedHooks?: string[]
): Promise<void> {
  if (!(await fs.pathExists(hooksRepoPath))) {
    throw new Error(`Hooks repository not found at: ${hooksRepoPath}`);
  }

  const hooksDir = path.join(hooksRepoPath, 'hooks');
  if (!(await fs.pathExists(hooksDir))) {
    throw new Error(`Hooks directory not found in repository: ${hooksDir}`);
  }

  const targetHooksDir = path.join(targetPath, '.claude', 'hooks');
  await fs.ensureDir(targetHooksDir);

  const availableHooks = await fs.readdir(hooksDir);
  const hooksToProcess = selectedHooks || availableHooks;

  for (const hookFile of hooksToProcess) {
    const sourcePath = path.join(hooksDir, hookFile);
    const targetFilePath = path.join(targetHooksDir, hookFile);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetFilePath);
    }
  }
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

function generateHooksReadme(config: ProjectConfig): string {
  return `# Claude Code Hooks

This directory contains shell-script hooks that Claude Code invokes at lifecycle
events. They are registered through \`.claude/settings.json\` (see the
\`hooks\` block) — file names alone do not auto-register hooks in 2026.

## Lifecycle map

| Event              | Script                            |
|--------------------|-----------------------------------|
| PreCompact         | \`pre-compact.sh\`                |
| UserPromptSubmit   | \`pre-submit.sh\`                 |
| PostToolUse (Edit|Write) | \`lint-on-edit.sh\`         |
| SessionStart       | \`session-start.sh\`              |
| Stop               | \`stop.sh\`                       |

## Project context

- **Project**: ${config.projectName}
- **Type**: ${config.projectType}
- **Stack**: ${Object.values(config.techStack).filter(Boolean).join(', ')}

## Customisation

Edit any script in this directory. Each one is a regular bash script with
\`set -euo pipefail\` and a clear single responsibility. Add new hooks by
dropping a new script here and adding an entry under
\`.claude/settings.json\` → \`hooks\`.

## Troubleshooting

1. Scripts must be executable (\`chmod +x .claude/hooks/*.sh\`).
2. Check Claude Code logs if a hook isn't firing.
3. Use \`bash -n <script>\` to syntax-check.

Docs: https://docs.anthropic.com/claude-code/hooks
`;
}

// ---------------------------------------------------------------------------
// Bash hook scripts
// ---------------------------------------------------------------------------

function preCompactScript(config: ProjectConfig): string {
  return `#!/usr/bin/env bash
# pre-compact.sh — snapshot critical context before compaction.
# Project: ${config.projectName}
set -euo pipefail

SNAP=".claude/.precompact-snapshot"
mkdir -p "$(dirname "$SNAP")"

{
  echo "# precompact snapshot — $(date -u +%FT%TZ)"
  echo "## branch"
  git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-git"
  echo "## last commit"
  git log -1 --oneline 2>/dev/null || echo "no-git"
  echo "## modified files"
  git status --porcelain 2>/dev/null || true
  echo "## critical files"
  for f in CLAUDE.md README.md package.json requirements.txt PRPs Docs docs ai_docs; do
    [[ -e "$f" ]] && echo "  - $f"
  done
} > "$SNAP"

echo "✅ pre-compact: snapshot written to $SNAP"
`;
}

function preSubmitScript(config: ProjectConfig): string {
  const lintHint = config.extras?.linting ? 'npm run lint' : '(no linter configured)';
  return `#!/usr/bin/env bash
# pre-submit.sh — UserPromptSubmit hook.
# Quick sanity-lint of the most-recently-modified source file.
# Project: ${config.projectName}
set -euo pipefail

LATEST="$(git ls-files -m 2>/dev/null | head -n 1 || true)"
if [[ -z "\${LATEST:-}" ]]; then
  exit 0
fi

case "$LATEST" in
  *.ts|*.tsx|*.js|*.jsx)
    if [[ -f package.json ]] && command -v npx >/dev/null 2>&1; then
      npx --no-install eslint "$LATEST" 2>&1 | tail -n 20 || true
    else
      echo "pre-submit: skipping lint (${lintHint})"
    fi
    ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      ruff check "$LATEST" 2>&1 | tail -n 20 || true
    fi
    ;;
  *) : ;;
esac

exit 0
`;
}

function lintOnEditScript(config: ProjectConfig): string {
  const cmd = config.techStack?.frontend === 'nextjs' ? 'npm run lint' : 'npm run lint';
  return `#!/usr/bin/env bash
# lint-on-edit.sh — PostToolUse(Edit|Write) hook.
# Lint the file Claude just touched, when we can identify it.
# Project: ${config.projectName}
set -euo pipefail

# Claude Code passes a JSON envelope on stdin for tool hooks. We try the env
# var first (newer surface) and fall back to parsing JSON.
FILE="\${CLAUDE_TOOL_FILE_PATH:-}"
if [[ -z "$FILE" && ! -t 0 ]]; then
  if command -v jq >/dev/null 2>&1; then
    FILE="$(jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || true)"
  fi
fi

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  exit 0
fi

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    if [[ -f package.json ]] && grep -q '"lint"' package.json; then
      ${cmd} -- "$FILE" 2>&1 | tail -n 30 || true
    fi
    ;;
  *.py)
    command -v ruff >/dev/null 2>&1 && ruff check "$FILE" 2>&1 | tail -n 30 || true
    ;;
  *) : ;;
esac

exit 0
`;
}

function sessionStartScript(config: ProjectConfig): string {
  const tech =
    Object.values(config.techStack ?? {})
      .filter(Boolean)
      .join(', ') || 'n/a';
  return `#!/usr/bin/env bash
# session-start.sh — SessionStart hook.
# Print orientation so Claude lands with current state.
# Project: ${config.projectName}
set -euo pipefail

echo "👋 Welcome back to ${config.projectName}"
echo "   Type: ${config.projectType ?? 'unknown'}"
echo "   Stack: ${tech}"

if [[ -d .git ]]; then
  echo "   Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  echo "   Last commit: $(git log -1 --oneline 2>/dev/null || echo 'none')"
fi

if [[ -f .claude/state.json ]]; then
  echo "--- .claude/state.json ---"
  cat .claude/state.json
fi

if [[ -f .claude/.precompact-snapshot ]]; then
  echo "--- pre-compact snapshot (head) ---"
  head -n 30 .claude/.precompact-snapshot
fi

exit 0
`;
}

function stopScript(config: ProjectConfig): string {
  return `#!/usr/bin/env bash
# stop.sh — Stop hook. Append one JSON line summarising the session.
# Project: ${config.projectName}
set -euo pipefail

LOG=".claude/logs/sessions.jsonl"
mkdir -p "$(dirname "$LOG")"

TS="$(date -u +%FT%TZ)"
SUMMARY="\${CLAUDE_STOP_SUMMARY:-stopped}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
LAST="$(git log -1 --oneline 2>/dev/null || echo none)"

# Escape any embedded double quotes in the summary.
ESC_SUMMARY="\${SUMMARY//\\"/\\\\\\"}"
printf '{"date":"%s","project":"%s","branch":"%s","last_commit":"%s","summary":"%s"}\\n' \\
  "$TS" "${config.projectName}" "$BRANCH" "$LAST" "$ESC_SUMMARY" >> "$LOG"

exit 0
`;
}

// ---------------------------------------------------------------------------
// Python hook scripts retained where Python is genuinely a better fit.
// ---------------------------------------------------------------------------

function prpTrackingPyScript(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""prp-tracking.py — PostToolUse hook. Scan PRPs/ for checkbox completion."""

import glob
import json
import os
from datetime import datetime


def main() -> None:
    status = {
        "project": "${config.projectName}",
        "updated": datetime.utcnow().isoformat() + "Z",
        "prps": [],
    }

    for prp_file in glob.glob("PRPs/**/*.md", recursive=True):
        try:
            with open(prp_file, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError:
            continue

        done = content.count("- [x]") + content.count("- [X]")
        todo = content.count("- [ ]")
        status["prps"].append(
            {
                "file": prp_file,
                "name": os.path.basename(prp_file).replace(".md", ""),
                "completed": done,
                "pending": todo,
                "percent": round(done / max(1, done + todo) * 100, 1),
            }
        )

    os.makedirs(".claude", exist_ok=True)
    with open(".claude/prp_status.json", "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)

    print(f"📋 prp-tracking: {len(status['prps'])} PRPs scanned")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"prp-tracking: non-fatal error: {exc}")
`;
}

function dartProgressUpdaterPy(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""dart-progress-updater.py — PostToolUse hook. Reads Claude's tool_response
JSON envelope from stdin and records progress entries for Dart tasks."""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT = "${config.projectName}"
PATTERNS = [
    r"task[-_](\\w+)",
    r"feature[-_](\\w+)",
    r"bug[-_](\\w+)",
    r"issue[-_](\\w+)",
    r"prp[-_](\\w+)",
]


def detect_task(file_path: str) -> str | None:
    for p in PATTERNS:
        m = re.search(p, file_path, re.IGNORECASE)
        if m:
            return m.group(1)
    return None


def append(entry: dict, target: Path, key: str, cap: int) -> None:
    target.parent.mkdir(exist_ok=True)
    data: dict = {key: []}
    if target.exists():
        try:
            with open(target, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError):
            pass
    data.setdefault(key, []).append(entry)
    data[key] = data[key][-cap:]
    with open(target, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def main() -> None:
    raw = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    try:
        payload = json.loads(raw or "{}")
    except ValueError:
        payload = {}

    tool_input = payload.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path") or tool_input.get("path") or ""
    task_id = detect_task(file_path)
    if not task_id:
        return

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "project": PROJECT,
        "session_id": payload.get("session_id", "unknown"),
        "file_path": file_path,
        "tool": payload.get("tool_name", "unknown"),
        "task_id": task_id,
    }
    append(entry, Path(".claude/dart_progress.json"), "updates", 100)
    print(f"dart-progress-updater: recorded {task_id}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"dart-progress-updater: non-fatal error: {exc}", file=sys.stderr)
`;
}

function autoTaskCommenterPy(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""auto-task-commenter.py — PostToolUse hook. Generates a structured task
comment summarising the most recent code change for downstream Dart sync."""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT = "${config.projectName}"


def categorise(path: str) -> str:
    p = path.lower()
    if any(k in p for k in ("auth", "login", "session")):
        return "auth"
    if any(k in p for k in ("/api/", "route", "controller")):
        return "api"
    if any(k in p for k in ("component", "page", ".tsx", ".jsx")):
        return "ui"
    if any(k in p for k in ("model", "schema", "migration")):
        return "database"
    if any(k in p for k in ("test", "spec", "__tests__")):
        return "testing"
    return "other"


def main() -> None:
    raw = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    try:
        payload = json.loads(raw or "{}")
    except ValueError:
        payload = {}

    tool_input = payload.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path") or tool_input.get("path") or ""
    if not file_path:
        return

    content = tool_input.get("content") or tool_input.get("new_string") or ""
    lines = content.count("\\n") if content else 0

    comment = {
        "project": PROJECT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "file_path": file_path,
        "category": categorise(file_path),
        "tool": payload.get("tool_name", "unknown"),
        "added_lines": lines,
        "session_id": payload.get("session_id", "unknown"),
    }

    out = Path(".claude/task_comments.json")
    out.parent.mkdir(exist_ok=True)
    data = {"comments": []}
    if out.exists():
        try:
            with open(out, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError):
            pass
    data.setdefault("comments", []).append(comment)
    data["comments"] = data["comments"][-100:]
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"auto-task-commenter: logged {Path(file_path).name}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"auto-task-commenter: non-fatal error: {exc}", file=sys.stderr)
`;
}

function taskCodeMapperPy(config: ProjectConfig): string {
  return `#!/usr/bin/env python3
"""task-code-mapper.py — PostToolUse hook. Maintains a rolling map of file
paths to inferred task IDs based on lightweight pattern matching."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT = "${config.projectName}"

CATEGORY_KEYWORDS = {
    "auth": ["auth", "login", "session", "jwt", "token"],
    "user": ["user", "profile", "account", "member"],
    "api": ["api", "route", "endpoint", "handler", "controller"],
    "ui": ["component", "page", "layout", "style"],
    "database": ["model", "schema", "migration", "seed"],
    "integration": ["webhook", "integration", "third-party"],
    "testing": ["test", "spec", "__tests__"],
}


def infer(path: str) -> dict | None:
    lower = path.lower()
    best: dict | None = None
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(0.2 for kw in keywords if kw in lower)
        if f"/{category}/" in lower:
            score += 0.2
        if score == 0:
            continue
        candidate = {
            "category": category,
            "task_id": f"{category}_{abs(hash(path)) % 10000:04d}",
            "confidence": round(min(score, 1.0), 2),
        }
        if best is None or candidate["confidence"] > best["confidence"]:
            best = candidate
    return best


def main() -> None:
    raw = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    try:
        payload = json.loads(raw or "{}")
    except ValueError:
        payload = {}

    tool_input = payload.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path") or tool_input.get("path") or ""
    if not file_path:
        return

    inferred = infer(file_path)
    if inferred is None:
        return

    entry = {
        "project": PROJECT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "file_path": file_path,
        "tool": payload.get("tool_name", "unknown"),
        "session_id": payload.get("session_id", "unknown"),
        **inferred,
    }

    out = Path(".claude/task_mapping.json")
    out.parent.mkdir(exist_ok=True)
    data = {"mappings": []}
    if out.exists():
        try:
            with open(out, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError):
            pass
    data.setdefault("mappings", []).append(entry)
    data["mappings"] = data["mappings"][-200:]
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"task-code-mapper: mapped {entry['task_id']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"task-code-mapper: non-fatal error: {exc}", file=sys.stderr)
`;
}

/**
 * Enhancement hooks generator — emits .claude/hooks/*.sh for the enhancement
 * lifecycle and exports `getEnhancementHooksFragment(config)` so the parent
 * `getHooksFragment` can splice them into `.claude/settings.json`.
 *
 * Lifecycle map:
 *   - PreToolUse(Edit|Write)   — pre-implementation.sh
 *   - PostToolUse(Edit|Write)  — feature-validation.sh
 *   - Stop                     — integration-test.sh
 *   - Notification             — progress-tracker.sh
 *   - SubagentStop             — phase-completion.sh
 */
import { ProjectConfig, EnhancementConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

// Shape mirrors W2 / hooks.ts. Local re-declaration keeps this file
// importable in isolation.
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

export interface HookFile extends GeneratedFile {
  mode?: number;
}

// ---------------------------------------------------------------------------
// Fragment
// ---------------------------------------------------------------------------

export function getEnhancementHooksFragment(config: ProjectConfig): SettingsHooksFragment {
  if (!config?.extras?.hooks || !config.enhancementConfig) {
    return {};
  }

  return {
    PreToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command', command: './.claude/hooks/pre-implementation.sh' }],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command', command: './.claude/hooks/feature-validation.sh' }],
      },
    ],
    Stop: [
      {
        hooks: [{ type: 'command', command: './.claude/hooks/integration-test.sh' }],
      },
    ],
    Notification: [
      {
        hooks: [{ type: 'command', command: './.claude/hooks/progress-tracker.sh' }],
      },
    ],
    SubagentStop: [
      {
        hooks: [{ type: 'command', command: './.claude/hooks/phase-completion.sh' }],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// File generation
// ---------------------------------------------------------------------------

export async function generateEnhancementHooks(config: ProjectConfig): Promise<GeneratedFile[]> {
  const enhancement = config.enhancementConfig;
  if (!enhancement || !config.extras?.hooks) {
    return [];
  }

  const files: HookFile[] = [
    exec(
      '.claude/hooks/pre-implementation.sh',
      preImplementationScript(enhancement),
      'Pre-implementation environment + dependency check (PreToolUse: Edit|Write)'
    ),
    exec(
      '.claude/hooks/feature-validation.sh',
      featureValidationScript(enhancement),
      'Per-edit feature validation (PostToolUse: Edit|Write)'
    ),
    exec(
      '.claude/hooks/integration-test.sh',
      integrationTestScript(enhancement),
      'Runs integration tests when assistant stops (Stop)'
    ),
    exec(
      '.claude/hooks/progress-tracker.sh',
      progressTrackerScript(enhancement),
      'Snapshots feature progress on notifications (Notification)'
    ),
    exec(
      '.claude/hooks/phase-completion.sh',
      phaseCompletionScript(enhancement),
      'Validates phase completion when a subagent stops (SubagentStop)'
    ),
  ];

  return files as GeneratedFile[];
}

function exec(filePath: string, content: string, description: string): HookFile {
  return { path: filePath, content, description, mode: 0o755 };
}

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

function preImplementationScript(enhancement: EnhancementConfig): string {
  const projectName = enhancement.projectName ?? 'project';
  return `#!/usr/bin/env bash
# pre-implementation.sh — PreToolUse(Edit|Write) hook.
# Verifies env + uncommitted-state guardrails before Claude edits files.
# Project: ${projectName}
set -euo pipefail

ISSUES=()

command -v node >/dev/null 2>&1 || ISSUES+=("node not in PATH")
command -v npm  >/dev/null 2>&1 || command -v pnpm >/dev/null 2>&1 \\
  || command -v yarn >/dev/null 2>&1 \\
  || ISSUES+=("no package manager (npm/yarn/pnpm) found")

if [[ -d .git ]]; then
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    echo "pre-implementation: ⚠️  uncommitted changes present" >&2
  fi
fi

if (( \${#ISSUES[@]} > 0 )); then
  printf 'pre-implementation: blocked\\n'
  for i in "\${ISSUES[@]}"; do printf '  - %s\\n' "$i"; done
  exit 1
fi

mkdir -p .claude
printf '{"status":"ready","timestamp":"%s","feature":"%s"}\\n' \\
  "$(date -u +%FT%TZ)" "\${ENHANCEMENT_FEATURE_ID:-unknown}" \\
  > .claude/.enhancement-status.json

echo "✅ pre-implementation: ready"
`;
}

function featureValidationScript(enhancement: EnhancementConfig): string {
  const projectName = enhancement.projectName ?? 'project';
  return `#!/usr/bin/env bash
# feature-validation.sh — PostToolUse(Edit|Write) hook.
# Light validation after each edit: lint just-touched file, count tests.
# Project: ${projectName}
set -euo pipefail

FEATURE="\${ENHANCEMENT_FEATURE_ID:-}"
FILE="\${CLAUDE_TOOL_FILE_PATH:-}"

if [[ -z "$FILE" && ! -t 0 ]] && command -v jq >/dev/null 2>&1; then
  FILE="$(jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || true)"
fi

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  exit 0
fi

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    if [[ -f package.json ]] && command -v npx >/dev/null 2>&1; then
      npx --no-install eslint "$FILE" 2>&1 | tail -n 20 || true
    fi
    ;;
esac

if [[ -n "$FEATURE" ]]; then
  TEST_COUNT="$(find . -type f \\( -name "*\${FEATURE}*.test.*" -o -name "*\${FEATURE}*.spec.*" \\) 2>/dev/null | wc -l | tr -d ' ')"
  mkdir -p .claude
  printf '{"feature":"%s","file":"%s","test_files":%s,"timestamp":"%s"}\\n' \\
    "$FEATURE" "$FILE" "$TEST_COUNT" "$(date -u +%FT%TZ)" \\
    >> .claude/feature-validation.jsonl
fi

exit 0
`;
}

function integrationTestScript(enhancement: EnhancementConfig): string {
  const projectName = enhancement.projectName ?? 'project';
  return `#!/usr/bin/env bash
# integration-test.sh — Stop hook.
# Runs the project's integration test suite (best-effort) after the assistant stops.
# Project: ${projectName}
set -euo pipefail

if [[ ! -f package.json ]]; then
  exit 0
fi

if grep -q '"test:integration"' package.json; then
  CMD="npm run test:integration --silent"
elif grep -q '"test"' package.json; then
  CMD="npm test --silent"
else
  echo "integration-test: no test script in package.json"
  exit 0
fi

LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/integration-test-$(date -u +%Y%m%dT%H%M%SZ).log"

echo "integration-test: running $CMD"
if eval "$CMD" > "$LOG" 2>&1; then
  echo "✅ integration-test: passed (log: $LOG)"
else
  RC=$?
  echo "❌ integration-test: failed rc=$RC (log: $LOG)" >&2
  tail -n 30 "$LOG" >&2 || true
  exit "$RC"
fi
`;
}

function progressTrackerScript(enhancement: EnhancementConfig): string {
  const projectName = enhancement.projectName ?? 'project';
  return `#!/usr/bin/env bash
# progress-tracker.sh — Notification hook.
# Append a single-line progress event to .claude/enhancement-progress.jsonl.
# Project: ${projectName}
set -euo pipefail

LOG=".claude/enhancement-progress.jsonl"
mkdir -p "$(dirname "$LOG")"

TS="$(date -u +%FT%TZ)"
TASK="\${CURRENT_TASK_ID:-unknown}"
FEATURE="\${CURRENT_FEATURE_ID:-unknown}"
PHASE="\${CURRENT_PHASE_ID:-unknown}"
STATUS="\${TASK_STATUS:-update}"
NOTE="\${CLAUDE_NOTIFICATION_MESSAGE:-}"

ESC_NOTE="\${NOTE//\\"/\\\\\\"}"
printf '{"ts":"%s","project":"%s","task":"%s","feature":"%s","phase":"%s","status":"%s","note":"%s"}\\n' \\
  "$TS" "${projectName}" "$TASK" "$FEATURE" "$PHASE" "$STATUS" "$ESC_NOTE" \\
  >> "$LOG"
`;
}

function phaseCompletionScript(enhancement: EnhancementConfig): string {
  const projectName = enhancement.projectName ?? 'project';
  return `#!/usr/bin/env bash
# phase-completion.sh — SubagentStop hook.
# When a subagent stops, validate phase completion gates.
# Project: ${projectName}
set -euo pipefail

PHASE="\${ENHANCEMENT_PHASE_ID:-}"
if [[ -z "$PHASE" ]]; then
  exit 0
fi

BLOCKERS=()

# Tests must pass.
if [[ -f package.json ]] && grep -q '"test"' package.json; then
  if ! npm test --silent >/dev/null 2>&1; then
    BLOCKERS+=("tests failing")
  fi
fi

# Linter must be clean (best-effort).
if [[ -f package.json ]] && grep -q '"lint"' package.json; then
  if ! npm run lint --silent >/dev/null 2>&1; then
    BLOCKERS+=("lint failing")
  fi
fi

mkdir -p .claude
REPORT=".claude/phase-\${PHASE}-completion.json"
TS="$(date -u +%FT%TZ)"

if (( \${#BLOCKERS[@]} == 0 )); then
  printf '{"phase":"%s","timestamp":"%s","status":"ready","blockers":[]}\\n' \\
    "$PHASE" "$TS" > "$REPORT"
  echo "✅ phase-completion: phase $PHASE ready"
else
  JOINED="$(IFS=, ; echo "\${BLOCKERS[*]}")"
  printf '{"phase":"%s","timestamp":"%s","status":"blocked","blockers":"%s"}\\n' \\
    "$PHASE" "$TS" "$JOINED" > "$REPORT"
  echo "❌ phase-completion: phase $PHASE blocked: $JOINED" >&2
  exit 1
fi
`;
}

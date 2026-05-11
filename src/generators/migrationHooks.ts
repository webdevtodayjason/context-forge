/**
 * Migration hooks generator — emits .claude/hooks/*.sh for the migration
 * lifecycle and exports `getMigrationHooksFragment(config)` so the parent
 * `getHooksFragment` can splice them into `.claude/settings.json`.
 *
 * Lifecycle map:
 *   - PreToolUse(Bash)         — migration-checkpoint.sh   (snapshot before risky CLI moves)
 *   - PostToolUse(Edit|Write)  — data-integrity-check.sh   (defer-to-script after schema/data files change)
 *   - Notification             — dual-system-monitor.sh    (poll dual-system health)
 *   - Stop                     — migration-validation.sh   (sweep all validation rules at session end)
 */
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import path from 'path';

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

export function getMigrationHooksFragment(config: ProjectConfig): SettingsHooksFragment {
  if (!config?.extras?.hooks || !config.migrationConfig) {
    return {};
  }

  return {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [{ type: 'command', command: './.claude/hooks/migration-checkpoint.sh' }],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [{ type: 'command', command: './.claude/hooks/data-integrity-check.sh' }],
      },
    ],
    Notification: [
      {
        hooks: [{ type: 'command', command: './.claude/hooks/dual-system-monitor.sh' }],
      },
    ],
    Stop: [
      {
        hooks: [{ type: 'command', command: './.claude/hooks/migration-validation.sh' }],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// File generation
// ---------------------------------------------------------------------------

export async function generateMigrationHooks(config: ProjectConfig): Promise<GeneratedFile[]> {
  if (!config.migrationConfig || !config.extras?.hooks) {
    return [];
  }

  const projectName = config.projectName;
  const strategy = config.migrationConfig.strategy;

  const files: HookFile[] = [
    exec(
      path.join('.claude', 'hooks', 'migration-checkpoint.sh'),
      migrationCheckpointScript(projectName),
      'Snapshots state before risky migration commands (PreToolUse: Bash)'
    ),
    exec(
      path.join('.claude', 'hooks', 'data-integrity-check.sh'),
      dataIntegrityScript(projectName),
      'Triggers integrity check when schema/data files change (PostToolUse: Edit|Write)'
    ),
    exec(
      path.join('.claude', 'hooks', 'dual-system-monitor.sh'),
      dualSystemMonitorScript(projectName, strategy),
      'Polls old + new system health on notifications (Notification)'
    ),
    exec(
      path.join('.claude', 'hooks', 'migration-validation.sh'),
      migrationValidationScript(projectName),
      'Runs migration validation suite when session stops (Stop)'
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

function migrationCheckpointScript(projectName: string): string {
  return `#!/usr/bin/env bash
# migration-checkpoint.sh — PreToolUse(Bash) hook.
# When a Bash command looks migration-related, snapshot state to .migration/.
# Project: ${projectName}
set -euo pipefail

CMD="\${CLAUDE_TOOL_BASH_COMMAND:-}"
if [[ -z "$CMD" && ! -t 0 ]] && command -v jq >/dev/null 2>&1; then
  CMD="$(jq -r '.tool_input.command // empty' 2>/dev/null || true)"
fi

case "$CMD" in
  *migrate*|*migration*|*rollback*|*db:push*|*prisma*db*|*schema*|*pg_restore*|*psql*)
    : ;; # proceed
  *)
    exit 0 ;;
esac

mkdir -p .migration/checkpoints
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SNAP=".migration/checkpoints/auto_\${TS}.json"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
HEAD="$(git rev-parse HEAD 2>/dev/null || echo unknown)"

ESC_CMD="\${CMD//\\"/\\\\\\"}"
printf '{"id":"auto_%s","timestamp":"%s","project":"%s","branch":"%s","head":"%s","command":"%s","automatic":true}\\n' \\
  "$TS" "$(date -u +%FT%TZ)" "${projectName}" "$BRANCH" "$HEAD" "$ESC_CMD" > "$SNAP"

echo "🔄 migration-checkpoint: snapshot $SNAP"
`;
}

function dataIntegrityScript(projectName: string): string {
  return `#!/usr/bin/env bash
# data-integrity-check.sh — PostToolUse(Edit|Write) hook.
# When schema, migration, or env files change, log an integrity-check trigger.
# Real validation happens out-of-band by reading .migration/integrity-queue.jsonl.
# Project: ${projectName}
set -euo pipefail

FILE="\${CLAUDE_TOOL_FILE_PATH:-}"
if [[ -z "$FILE" && ! -t 0 ]] && command -v jq >/dev/null 2>&1; then
  FILE="$(jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || true)"
fi

if [[ -z "$FILE" ]]; then
  exit 0
fi

case "$FILE" in
  *migrations/*|*migration/*|*schema*|*.sql|*.env*|*prisma/*|*alembic/*) : ;;
  *) exit 0 ;;
esac

mkdir -p .migration
LOG=".migration/integrity-queue.jsonl"
printf '{"ts":"%s","project":"%s","file":"%s","tool":"%s"}\\n' \\
  "$(date -u +%FT%TZ)" "${projectName}" "$FILE" "\${CLAUDE_TOOL_NAME:-edit}" \\
  >> "$LOG"
echo "🔍 data-integrity-check: queued $FILE"
`;
}

function dualSystemMonitorScript(projectName: string, strategy: string): string {
  return `#!/usr/bin/env bash
# dual-system-monitor.sh — Notification hook.
# Health-check both systems when running a parallel-run migration.
# Project: ${projectName}
# Strategy: ${strategy}
set -euo pipefail

OLD_URL="\${OLD_SYSTEM_URL:-http://localhost:3000}"
NEW_URL="\${NEW_SYSTEM_URL:-http://localhost:4000}"
HEALTH_PATH="\${HEALTH_ENDPOINT:-/health}"

mkdir -p .migration/monitoring

probe() {
  local name="$1" url="$2"
  local code
  if ! command -v curl >/dev/null 2>&1; then
    echo "{\\"system\\":\\"$name\\",\\"status\\":\\"skipped\\",\\"reason\\":\\"no curl\\"}"
    return
  fi
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url$HEALTH_PATH" || echo "000")"
  if [[ "$code" == "200" ]]; then
    echo "{\\"system\\":\\"$name\\",\\"status\\":\\"healthy\\",\\"http\\":$code}"
  else
    echo "{\\"system\\":\\"$name\\",\\"status\\":\\"unhealthy\\",\\"http\\":$code}"
  fi
}

LOG=".migration/monitoring/$(date -u +%Y%m%dT%H%M%SZ).jsonl"
{
  probe old "$OLD_URL"
  probe new "$NEW_URL"
} > "$LOG"

echo "📊 dual-system-monitor: $LOG"
cat "$LOG"
`;
}

function migrationValidationScript(projectName: string): string {
  return `#!/usr/bin/env bash
# migration-validation.sh — Stop hook.
# Sweep configured migration validations at session end.
# Project: ${projectName}
set -euo pipefail

REPORT_DIR=".migration/validation-reports"
mkdir -p "$REPORT_DIR"
REPORT="$REPORT_DIR/$(date -u +%Y%m%dT%H%M%SZ).log"

run() {
  local label="$1"; shift
  echo "--- $label ---" >> "$REPORT"
  if "$@" >> "$REPORT" 2>&1; then
    echo "PASS: $label" >&2
  else
    local rc=$?
    echo "FAIL: $label (rc=$rc)" >&2
    return "$rc"
  fi
}

FAIL=0
if [[ -f package.json ]] && grep -q '"test"' package.json; then
  run "tests" npm test --silent || FAIL=1
fi
if [[ -f package.json ]] && grep -q '"db:test-connection"' package.json; then
  run "db connectivity" npm run db:test-connection --silent || FAIL=1
fi
if [[ -f package.json ]] && grep -q '"migration:verify-data"' package.json; then
  run "data verify" npm run migration:verify-data --silent || FAIL=1
fi

echo "migration-validation: report $REPORT"
exit "$FAIL"
`;
}

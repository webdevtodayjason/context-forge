/**
 * Slash command generator (W6 — refreshed 2026-05-11)
 *
 * Emits real `.claude/commands/[<subdir>/]<name>.md` files with proper YAML
 * frontmatter, replacing the previous "command-as-string-blob" approach.
 *
 * Frontmatter schema (per ORCHESTRATION.md):
 *   - allowed-tools: optional YAML array of tool names with optional Bash matchers
 *   - argument-hint:  optional single-line string shown in the picker
 *   - description:    required, single-line
 *   - model:          optional, one of the canonical lineup IDs
 *
 * Bodies use `$1`, `$2`, ... for positional arguments (legacy `$ARGUMENTS`
 * is still respected by Claude Code but new commands prefer the positional
 * form).
 */
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';
import { generateCheckpointCommands } from './checkpointCommands';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SlashCommandDef {
  /** kebab-case command name (no leading slash) */
  name: string;
  /** Required single-line description rendered to frontmatter and indexes. */
  description: string;
  /** Optional argument-hint shown in the slash-command picker. */
  argumentHint?: string;
  /** Optional restricted tool list. Accepts plain names or Bash matchers. */
  allowedTools?: string[];
  /**
   * Optional model ID. Must be one of the canonical 2026-05 lineup:
   *   - claude-opus-4-7
   *   - claude-sonnet-4-6
   *   - claude-haiku-4-5-20251001
   * If omitted the command inherits from the session.
   */
  model?: string;
  /** Markdown body. May reference $1, $2, … or $ARGUMENTS. */
  body: string;
  /** Optional grouping subdirectory (e.g. "PRPs", "orchestration"). */
  subdir?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the canonical default command set, parameterised by ProjectConfig.
 */
export function getDefaultCommands(config: ProjectConfig): SlashCommandDef[] {
  const commands: SlashCommandDef[] = [
    // ---- PRPs --------------------------------------------------------------
    prpCreate(),
    prpExecute(),
    prpValidate(),
    prpList(),
    prpUpdate(),

    // ---- Orchestration ----------------------------------------------------
    orchestrateStatus(config),
    orchestrateList(),
    orchestrateSpawn(config),
    spawnSubagents(),

    // ---- Checkpoints ------------------------------------------------------
    checkpointCreate(),
    checkpointRestore(),
    checkpointList(),

    // ---- Quality ----------------------------------------------------------
    validate(config),
    review(),
    securityScan(),

    // ---- Session ----------------------------------------------------------
    sessionSave(),
    sessionRestore(),
    primeContext(config),

    // ---- Migration --------------------------------------------------------
    migrateAnalyze(),
    migratePlan(),
    migrateExecute(),
  ];

  // Append legacy-compatibility checkpoint commands when the project opts in.
  if (config.extras?.checkpoints) {
    const legacy = generateCheckpointCommands(config);
    legacy.forEach((cmd) => {
      // Only push checkpoint extras if not already present by name.
      if (commands.some((c) => c.name === cmd.name)) return;
      commands.push({
        name: cmd.name,
        description: cmd.description,
        body: cmd.template,
        subdir: 'checkpoints',
      });
    });
  }

  return commands;
}

/**
 * Emits one GeneratedFile per command, plus a short README index.
 * The output layout is:
 *
 *     .claude/commands/<subdir>/<name>.md      (when subdir is set)
 *     .claude/commands/<name>.md               (otherwise)
 *     .claude/commands/README.md               (index)
 */
export function generateSlashCommands(config: ProjectConfig): GeneratedFile[] {
  const commands = getDefaultCommands(config);

  const files: GeneratedFile[] = commands.map((cmd) => ({
    path: cmd.subdir
      ? `.claude/commands/${cmd.subdir}/${cmd.name}.md`
      : `.claude/commands/${cmd.name}.md`,
    content: renderCommandMarkdown(cmd),
    description: cmd.description,
  }));

  files.push({
    path: '.claude/commands/README.md',
    content: renderCommandsReadme(commands),
    description: 'Slash commands index',
  });

  return files;
}

/**
 * Compatibility export consumed by `claudeMd.ts` (which embeds a slash-command
 * summary section inside the generated CLAUDE.md). Returns a markdown table
 * grouped by subdir.
 */
export function renderCommandsForClaudeMd(config: ProjectConfig): string {
  const commands = getDefaultCommands(config);
  const grouped = groupBySubdir(commands);

  let out = '## Available Slash Commands\n\n';
  out +=
    `Context Forge generates ${commands.length}+ slash commands under \`.claude/commands/\`. ` +
    'Each is a standalone Markdown file with YAML frontmatter (allowed-tools, model, ' +
    'argument-hint, description). Invoke with `/<name>` in Claude Code.\n\n';

  for (const subdir of Object.keys(grouped).sort()) {
    const heading = subdir === '' ? 'Top-level' : capitalize(subdir);
    out += `### ${heading}\n\n`;
    out += '| Command | Argument | Description |\n';
    out += '|---------|----------|-------------|\n';
    for (const cmd of grouped[subdir]) {
      const hint = cmd.argumentHint ?? '—';
      out += `| \`/${cmd.name}\` | ${hint} | ${escapePipe(cmd.description)} |\n`;
    }
    out += '\n';
  }

  return out.trimEnd() + '\n';
}

// ---------------------------------------------------------------------------
// Legacy compatibility shim
// ---------------------------------------------------------------------------
//
// The previous API exported `generateSlashCommandFiles(commands)` and the
// `generateSlashCommands` function returned an array of `{ name, category,
// content, description }` objects. claudeMd / older adapters may still call
// these signatures, so we preserve them as deprecated wrappers around the new
// implementation.

/** @deprecated Use SlashCommandDef from the new API. */
export interface SlashCommand {
  name: string;
  category: string;
  content: string;
  description: string;
}

/** @deprecated Use `generateSlashCommands(config)` which now returns
 * GeneratedFile[] directly. Accepts the legacy SlashCommand[] shape, the
 * new SlashCommandDef[] shape, or a pre-rendered GeneratedFile[] (in which
 * case it acts as a passthrough — this is how the unmodified Claude
 * adapter continues to work until the orchestrator rewires wave 2). */
export function generateSlashCommandFiles(
  commands: SlashCommand[] | SlashCommandDef[] | GeneratedFile[]
): GeneratedFile[] {
  if (commands.length === 0) return [];

  const first = commands[0] as unknown as Record<string, unknown>;

  // Already rendered (GeneratedFile shape) → passthrough.
  if ('path' in first && typeof first.path === 'string') {
    return commands as GeneratedFile[];
  }

  // New SlashCommandDef shape.
  if ('body' in first) {
    return (commands as SlashCommandDef[]).map((cmd) => ({
      path: cmd.subdir
        ? `.claude/commands/${cmd.subdir}/${cmd.name}.md`
        : `.claude/commands/${cmd.name}.md`,
      content: renderCommandMarkdown(cmd),
      description: cmd.description,
    }));
  }

  // Legacy shape: name + category + content
  return (commands as SlashCommand[]).map((cmd) => ({
    path: `.claude/commands/${cmd.category}/${cmd.name}.md`,
    content: cmd.content,
    description: cmd.description,
  }));
}

// ---------------------------------------------------------------------------
// Frontmatter / Markdown rendering
// ---------------------------------------------------------------------------

export function renderCommandMarkdown(cmd: SlashCommandDef): string {
  const fm = renderFrontmatter(cmd);
  const body = cmd.body.endsWith('\n') ? cmd.body : cmd.body + '\n';
  return `${fm}\n${body}`;
}

function renderFrontmatter(cmd: SlashCommandDef): string {
  const lines: string[] = ['---'];

  if (cmd.allowedTools && cmd.allowedTools.length > 0) {
    lines.push(`allowed-tools: ${formatYamlArray(cmd.allowedTools)}`);
  }
  if (cmd.argumentHint) {
    lines.push(`argument-hint: ${formatYamlString(cmd.argumentHint)}`);
  }
  // description is required
  lines.push(`description: ${formatYamlString(cmd.description)}`);
  if (cmd.model) {
    lines.push(`model: ${formatYamlString(cmd.model)}`);
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Render a YAML scalar string. Always quotes to avoid ambiguity around
 * colons, hash marks, leading/trailing whitespace, etc. Uses double-quoted
 * style with proper escapes.
 */
function formatYamlString(value: string): string {
  // Escape backslashes and double quotes; convert newlines to literal \n
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/** Render a YAML flow-style array of scalar strings. */
function formatYamlArray(values: string[]): string {
  return `[${values.map(formatYamlString).join(', ')}]`;
}

function renderCommandsReadme(commands: SlashCommandDef[]): string {
  const grouped = groupBySubdir(commands);
  let out = `# Slash Commands

Generated by [context-forge](https://github.com/webdevtodayjason/context-forge).

Each file in this directory is a Claude Code slash command with YAML
frontmatter. Invoke with \`/<name>\` in Claude Code; positional arguments
fill in \`$1\`, \`$2\`, … in the body.

## Frontmatter fields

- \`allowed-tools\` — restricts the command to a specific tool surface
  (e.g. \`[Read, Grep, Bash(git status:*)]\`).
- \`argument-hint\` — placeholder shown in the picker.
- \`description\` — single-line summary (required).
- \`model\` — one of \`claude-opus-4-7\`, \`claude-sonnet-4-6\`,
  \`claude-haiku-4-5-20251001\`. Inherits the session model when omitted.

## Index

`;

  for (const subdir of Object.keys(grouped).sort()) {
    const heading = subdir === '' ? 'Top-level' : capitalize(subdir);
    out += `### ${heading}\n\n`;
    for (const cmd of grouped[subdir]) {
      const hint = cmd.argumentHint ? ` ${cmd.argumentHint}` : '';
      out += `- **/${cmd.name}**${hint} — ${cmd.description}\n`;
    }
    out += '\n';
  }

  return out.trimEnd() + '\n';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function groupBySubdir(commands: SlashCommandDef[]): Record<string, SlashCommandDef[]> {
  return commands.reduce<Record<string, SlashCommandDef[]>>((acc, cmd) => {
    const key = cmd.subdir ?? '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(cmd);
    return acc;
  }, {});
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function describeTechStack(config: ProjectConfig): string {
  if (!config.techStack) return 'unknown';
  const parts = Object.entries(config.techStack)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`);
  return parts.length > 0 ? parts.join(', ') : 'unknown';
}

// ---------------------------------------------------------------------------
// Command definitions — PRPs
// ---------------------------------------------------------------------------

function prpCreate(): SlashCommandDef {
  return {
    name: 'prp-create',
    subdir: 'PRPs',
    description: 'Generate a comprehensive Product Requirement Prompt for a new feature.',
    argumentHint: '<feature-name>',
    allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch', 'Write'],
    model: 'claude-opus-4-7',
    body: `# PRP create — $1

Compose a Product Requirement Prompt for the feature **$1** with deep,
single-pass research. The goal is one-pass implementation success: the PRP
must carry enough context for the executor to ship without follow-up
clarification.

## Steps

1. **Inventory existing PRPs.** Read \`PRPs/*.md\` to absorb tone, structure,
   and validation conventions in this codebase.
2. **Codebase reconnaissance.** Use \`Grep\` and \`Glob\` to find similar
   features, conventions, and test patterns to mirror. List every file the
   executor will need to touch or reference.
3. **External research.** Pull authoritative docs (with full URLs), version
   notes, and known gotchas. Stash anything dense in \`PRPs/ai_docs/\` and
   reference by relative path.
4. **Compose the PRP** using the project's PRP template. Required sections:
   - Goal, Why, What, Success criteria
   - All Needed Context (URLs, files, gotchas)
   - Implementation Blueprint (pseudo-code for each task)
   - Validation Gates (4 levels: syntax, unit, integration, creative)
   - Task Breakdown (ordered, atomic, executable)
5. **Self-score** the PRP confidence 1–10 in a final block. Anything <8 means
   you need more context — loop back to step 2/3.

## Output

Save as: \`PRPs/$1-prp.md\`. Confirm path and word count when done.

Remember: depth and specificity here saves a 5x cost during execution.
`,
  };
}

function prpExecute(): SlashCommandDef {
  return {
    name: 'prp-execute',
    subdir: 'PRPs',
    description: 'Execute an existing PRP end-to-end against the codebase.',
    argumentHint: '<prp-name>',
    allowedTools: ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash'],
    body: `# PRP execute — $1

Load and execute the PRP at \`PRPs/$1.md\`.

## Workflow

1. **Read the PRP.** Internalise Goal, Success Criteria, and every Needed
   Context entry. Stop and ask if anything reads ambiguous.
2. **Plan.** Break the Implementation Blueprint into a TodoWrite list. Each
   item must be atomic and individually verifiable.
3. **Execute.** Implement task-by-task following the blueprint. Mirror the
   repository's existing patterns; do not invent new conventions.
4. **Validate after each task.** Run the validation gate appropriate to the
   change (lint, unit test, integration test). Do not advance past a failing
   gate — fix in place.
5. **Final pass.** Run *all* validation gates from the PRP's "Validation
   Gates" section. Every one must pass before declaring done.

## Reporting

When complete, post a short report covering:

- Files touched (with line counts)
- Validation gate results (each gate, pass/fail/skipped + why)
- Anything from the PRP that turned out to be wrong, missing, or stale
- Confidence the change is shippable (1-10)
`,
  };
}

function prpValidate(): SlashCommandDef {
  return {
    name: 'prp-validate',
    subdir: 'PRPs',
    description: 'Validate that a PRP is complete enough for one-pass execution.',
    argumentHint: '<prp-name>',
    allowedTools: ['Read', 'Grep', 'Bash(npm test:*)', 'Bash(npm run lint:*)'],
    body: `# PRP validate — $1

Audit \`PRPs/$1.md\` against the one-pass-success rubric and emit a score.

## Required sections (each must be non-empty and specific)

- [ ] Goal — single sentence, outcome-oriented
- [ ] Why — business or technical motivation
- [ ] What — observable requirements
- [ ] All Needed Context — URLs, files, gotchas, version notes
- [ ] Implementation Blueprint — pseudo-code per task
- [ ] Validation Gates — Levels 1–4 with concrete commands
- [ ] Task Breakdown — atomic, ordered, individually verifiable

## Context quality checks

- [ ] At least one external doc URL with anchor or version
- [ ] At least one in-repo file path under \`Needed Context\`
- [ ] Known gotchas and anti-patterns are spelled out
- [ ] Existing patterns (file paths) named for the executor to mirror

## Validation gates must include

- Level 1 (syntax/style): lint + format command
- Level 2 (unit): test runner invocation
- Level 3 (integration): cross-module/E2E command
- Level 4 (creative): qualitative check (e.g. screenshot, perf budget)

## Output

Print a final scorecard:

\`\`\`
PRP: $1
Required sections: <n/7>
Context quality:    <n/4>
Validation gates:   <n/4>
Confidence (1-10):  <score>
Verdict: SHIP / REVISE
\`\`\`

If any required section scores zero, verdict is REVISE regardless.
`,
  };
}

function prpList(): SlashCommandDef {
  return {
    name: 'prp-list',
    subdir: 'PRPs',
    description: 'List every PRP in the repo with its status and confidence.',
    allowedTools: ['Read', 'Glob', 'Grep'],
    model: 'claude-haiku-4-5-20251001',
    body: `# PRP list

Enumerate \`PRPs/*.md\` and emit a one-line summary per PRP.

## Steps

1. \`Glob\` for \`PRPs/*.md\` (skip \`PRPs/ai_docs/\` and \`PRPs/templates/\`).
2. For each, read the first ~30 lines to extract:
   - Title (first H1)
   - Goal (one-liner under "## Goal" if present)
   - Confidence score (search for "Confidence" in the file)
   - Status (search for "Status:" in the file; default "draft")

## Output

A single Markdown table:

| PRP | Goal | Status | Confidence |
|-----|------|--------|------------|
| feature-x-prp | … | draft | 7/10 |

Sort by confidence descending. Append a count summary line at the bottom.
`,
  };
}

function prpUpdate(): SlashCommandDef {
  return {
    name: 'prp-update',
    subdir: 'PRPs',
    description: 'Refresh an existing PRP with new findings or revised context.',
    argumentHint: '<prp-name>',
    allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch', 'Edit'],
    model: 'claude-opus-4-7',
    body: `# PRP update — $1

Reopen \`PRPs/$1.md\` and refresh it against current reality.

## Steps

1. Read the existing PRP top-to-bottom.
2. Re-run the codebase reconnaissance (\`Grep\`, \`Glob\`) — note anything
   that has changed since the PRP was written (file paths, conventions, deps).
3. Re-fetch external docs referenced in "Needed Context" — flag stale URLs,
   version drift, deprecated APIs.
4. Edit the PRP in place. Use a "Changelog" section at the bottom to record
   what changed and why. Bump the confidence score if reality now matches
   the PRP better, or down if new gaps surfaced.

## Constraints

- Do not delete sections silently — strike through with notes if removing.
- Preserve the original task ordering unless a dependency reordering is
  necessary; if so, explain in the Changelog.
- If the underlying feature has shipped, mark Status: shipped and stop.
`,
  };
}

// ---------------------------------------------------------------------------
// Command definitions — Orchestration
// ---------------------------------------------------------------------------

function orchestrateStatus(config: ProjectConfig): SlashCommandDef {
  return {
    name: 'orchestrate-status',
    subdir: 'orchestration',
    description: 'Show the current orchestration team status (panes, tasks, blockers).',
    allowedTools: ['Bash(tmux ls:*)', 'Bash(tmux list-windows:*)', 'Bash(git log:*)', 'Read'],
    body: `# Orchestrate status

Report the current state of the orchestration team for **${config.projectName ?? 'this project'}**.

## Steps

1. \`tmux ls\` to list active orchestration sessions. Match anything matching
   \`cf-*\` or \`orch-*\`.
2. For each match, \`tmux list-windows -t <session>\` to enumerate workers.
3. Read \`ORCHESTRATION.md\` if present — extract the Task Ledger and
   Decision Log.
4. \`git log --since="6 hours ago" --oneline\` to see recent worker commits.

## Report

Print a single status block:

\`\`\`
Session:    <name>
Workers:    <n active> / <n total>
Tasks:      <pending> / <in_progress> / <completed>
Last commit: <sha> <message> (<relative time>)
Blockers:   <list, or "none">
\`\`\`

Flag any worker idle > 30min as 🟡 IDLE; any blocked worker as 🔴 BLOCKED.
`,
  };
}

function orchestrateList(): SlashCommandDef {
  return {
    name: 'orchestrate-list',
    subdir: 'orchestration',
    description: 'List all orchestration sessions known to this machine.',
    allowedTools: ['Bash(tmux ls:*)'],
    model: 'claude-haiku-4-5-20251001',
    body: `# Orchestrate list

Enumerate every tmux session that looks like a context-forge orchestration
(prefixes \`cf-\`, \`orch-\`, or any session whose name matches a directory
containing \`ORCHESTRATION.md\`).

## Steps

1. \`tmux ls\` and parse session names + window counts.
2. Filter to candidate orchestration sessions.
3. Print a one-line summary per session:

\`\`\`
<session>  windows=<n>  attached=<yes|no>  uptime=<duration>
\`\`\`

If \`tmux\` is not installed or no sessions exist, say so explicitly and
exit cleanly.
`,
  };
}

function orchestrateSpawn(config: ProjectConfig): SlashCommandDef {
  return {
    name: 'orchestrate-spawn',
    subdir: 'orchestration',
    description: 'Spawn a new orchestration team for a focused feature or audit.',
    argumentHint: '<feature-or-task>',
    allowedTools: ['Bash(tmux new-session:*)', 'Bash(tmux send-keys:*)', 'Read', 'Write'],
    model: 'claude-opus-4-7',
    body: `# Orchestrate spawn — $1

Stand up a new orchestrator + worker team focused on **$1**.

Project: ${config.projectName ?? '(unset)'}
Stack:   ${describeTechStack(config)}

## Plan first

Before spawning anything, emit a one-screen plan covering:

- GOAL — what "done" looks like for this team
- UNKNOWNS — what still needs investigation
- WORK BREAKDOWN — 3–7 worker subjects with explicit file scopes
- SERIALIZATION — which workers can run in parallel vs which are blocked
- DONE WHEN — the verifiable exit criteria

**Wait for explicit operator approval** before continuing.

## Then spawn

1. \`tmux new-session -d -s cf-$1\` — create the session.
2. Launch the orchestrator pane on the left, worker panes stacked on the right.
3. Brief each worker with a self-contained prompt (file scopes, deliverable,
   verification commands).
4. Append the team to \`ORCHESTRATION.md\` task ledger.

## Verify

Run \`/orchestrate-status\` immediately after spawn to confirm every worker
came up.
`,
  };
}

function spawnSubagents(): SlashCommandDef {
  return {
    name: 'spawn-subagents',
    subdir: 'orchestration',
    description: 'Fan out parallel research subagents for an open question.',
    argumentHint: '<question>',
    allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'],
    body: `# Spawn subagents — $1

Run independent research subagents in parallel against question: **$1**.

## Decomposition

1. Split $1 into 3–5 *independent* sub-questions whose answers can be
   gathered without depending on each other.
2. For each sub-question, dispatch a subagent with:
   - Crisp scope (one question, one report)
   - The exact tool surface it needs (Read+Grep for codebase, WebFetch+
     WebSearch for external)
   - A 200-word reporting cap
3. Wait for all subagents to return.

## Synthesis

Once every subagent reports:

- Compile findings into a single brief (max 1 page).
- Note conflicts between subagent reports — these are signal, not noise.
- Surface the *next* concrete action this enables.

Do not delegate the synthesis itself — you must read every subagent's report
yourself before composing the brief.
`,
  };
}

// ---------------------------------------------------------------------------
// Command definitions — Checkpoints
// ---------------------------------------------------------------------------

function checkpointCreate(): SlashCommandDef {
  return {
    name: 'checkpoint-create',
    subdir: 'checkpoints',
    description: 'Create a named checkpoint of the current working state.',
    argumentHint: '<checkpoint-name>',
    allowedTools: ['Bash(git status:*)', 'Bash(git stash:*)', 'Bash(git tag:*)', 'Read', 'Write'],
    body: `# Checkpoint create — $1

Snapshot the current working state under name **$1**.

## Steps

1. \`git status\` — record clean/dirty.
2. If dirty: \`git stash push -u -m "checkpoint:$1"\` to preserve uncommitted
   work without losing it.
3. Tag the current HEAD: \`git tag -a checkpoint/$1 -m "checkpoint $1"\`.
4. Append a row to \`.claude/checkpoints/log.md\` with: timestamp, sha,
   branch, dirty status, summary.

## Output

\`\`\`
Checkpoint: $1
Branch:     <branch>
SHA:        <sha>
Stash:      <ref or "none">
\`\`\`

If a checkpoint with this name already exists, abort and tell the operator
to choose a different name (do not overwrite).
`,
  };
}

function checkpointRestore(): SlashCommandDef {
  return {
    name: 'checkpoint-restore',
    subdir: 'checkpoints',
    description: 'Restore the working state from a named checkpoint.',
    argumentHint: '<checkpoint-name>',
    allowedTools: ['Bash(git status:*)', 'Bash(git checkout:*)', 'Bash(git stash:*)', 'Read'],
    body: `# Checkpoint restore — $1

Restore working state from checkpoint **$1**.

## Safety check first

1. \`git status\` — refuse to restore over a dirty tree without confirmation.
2. Confirm the checkpoint exists: \`git tag -l checkpoint/$1\`. If missing,
   list available checkpoints and stop.

## Restore

1. \`git checkout checkpoint/$1\` (detached HEAD).
2. If the checkpoint had an associated stash entry, surface its ref and ask
   the operator whether to \`git stash pop\` it.
3. Append a "RESTORED FROM" row to \`.claude/checkpoints/log.md\`.

Do not auto-pop the stash — leave that to the operator.
`,
  };
}

function checkpointList(): SlashCommandDef {
  return {
    name: 'checkpoint-list',
    subdir: 'checkpoints',
    description: 'List every checkpoint with its sha, branch, and timestamp.',
    allowedTools: ['Bash(git tag:*)', 'Bash(git log:*)', 'Read'],
    model: 'claude-haiku-4-5-20251001',
    body: `# Checkpoint list

Enumerate every checkpoint tag (prefix \`checkpoint/\`) with metadata.

## Steps

1. \`git tag -l 'checkpoint/*'\` to list.
2. For each: \`git log -1 --format='%h %ai %s' <tag>\` for sha, date, msg.
3. Cross-reference with \`.claude/checkpoints/log.md\` for human-written
   summaries.

## Output

| Checkpoint | SHA | Created | Summary |
|------------|-----|---------|---------|
| <name>     | <sha> | <date> | <summary> |

Sort newest-first.
`,
  };
}

// ---------------------------------------------------------------------------
// Command definitions — Quality
// ---------------------------------------------------------------------------

function validate(config: ProjectConfig): SlashCommandDef {
  const lint =
    config.techStack?.frontend === 'nextjs' || config.techStack?.frontend === 'react'
      ? 'npm run lint'
      : 'npm run lint';
  const test = 'npm test';
  return {
    name: 'validate',
    subdir: 'quality',
    description: 'Run the full validation gate (lint + tests + typecheck).',
    allowedTools: ['Bash(npm test:*)', 'Bash(npm run lint:*)', 'Bash(npx tsc:*)', 'Read'],
    body: `# Validate

Run every validation gate this project ships and report pass/fail per gate.

## Gates

| Gate | Command |
|------|---------|
| Lint | \`${lint}\` |
| Typecheck | \`npx tsc --noEmit\` |
| Tests | \`${test}\` |

## Steps

1. Run each gate sequentially. Capture stdout + stderr.
2. After each gate, print a single status line:
   - \`✅ <gate> passed (<duration>)\`
   - \`❌ <gate> FAILED — first error: <one line>\`
3. Do **not** skip subsequent gates on failure — run them all so the
   operator sees the full damage.

## Final report

Print a summary at the bottom:

\`\`\`
Validation summary
  Lint:     <pass|FAIL>
  Type:     <pass|FAIL>
  Tests:    <pass|FAIL>
Verdict: <SHIP | BLOCK>
\`\`\`
`,
  };
}

function review(): SlashCommandDef {
  return {
    name: 'review',
    subdir: 'quality',
    description: 'Comprehensive review of recent changes for quality, security, and conventions.',
    argumentHint: '[scope = HEAD]',
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash(git diff:*)', 'Bash(git log:*)'],
    model: 'claude-opus-4-7',
    body: `# Review — $1

Review the changes at scope **$1** (default \`HEAD\`) for code quality,
security, and convention adherence.

## Scope

- If $1 looks like a sha or branch: \`git diff $1\`.
- If $1 is "HEAD" or empty: \`git diff HEAD~1\`.
- If $1 is "staged": \`git diff --cached\`.

## Review axes

1. **Correctness.** Does the change do what its commit message claims?
2. **Conventions.** Matches existing patterns? Naming, layout, module
   boundaries.
3. **Security.** Any unsanitised input, missing auth checks, secret leakage,
   path traversal, SQL-injection-shaped code?
4. **Performance.** Any N+1 queries, unbounded loops, missing memoisation
   on hot paths?
5. **Tests.** Is the change tested? Are the tests asserting behaviour or
   implementation?
6. **Docs.** Does the change need a README/CHANGELOG entry?

## Output

For each axis, emit one of:
- ✅ no issues
- ⚠️ <issue> — <file:line> — <suggested fix>
- ❌ <blocker> — <file:line> — <suggested fix>

Finish with a single-line verdict: \`APPROVE\` / \`REQUEST_CHANGES\` /
\`COMMENT\`.
`,
  };
}

function securityScan(): SlashCommandDef {
  return {
    name: 'security-scan',
    subdir: 'quality',
    description: 'Scan the codebase for common security smells.',
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash(npm audit:*)'],
    body: `# Security scan

Sweep the codebase for high-signal security issues.

## Static checks (Grep)

Scan for the following patterns and report file:line for any hit:

- Hardcoded secrets: \`(api[_-]?key|secret|token|password)\\s*=\\s*["']\`
- \`eval(\` / \`Function(\` / \`new Function(\`
- \`child_process\` invocation with interpolated user input
- \`dangerouslySetInnerHTML\` (React)
- \`innerHTML\` assignment from variable
- SQL string concatenation that includes a request var
- Path joins from request input without normalisation
- \`http.\` / \`fetch(\` to non-https URLs in production code paths

## Dependency check

Run \`npm audit --omit=dev --json\` and report:
- High severity: count + first 5 advisories
- Critical severity: every one (with package + remediation)

## Output

Top of report:

\`\`\`
Security scan summary
  Hardcoded secrets: <n>
  Dynamic exec:      <n>
  XSS surface:       <n>
  SQL/path/SSRF:     <n>
  Audit critical:    <n>
  Audit high:        <n>
\`\`\`

Then per-issue detail with file:line and a one-line fix suggestion.
`,
  };
}

// ---------------------------------------------------------------------------
// Command definitions — Session
// ---------------------------------------------------------------------------

function sessionSave(): SlashCommandDef {
  return {
    name: 'session-save',
    subdir: 'session',
    description: 'Persist the current working session as a resumable handoff.',
    argumentHint: '[label]',
    allowedTools: ['Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git log:*)', 'Read', 'Write'],
    body: `# Session save — $1

Persist the current working session into \`.claude/sessions/\` for later
resumption (or for handoff to a teammate).

## Capture

Gather:

1. \`git status -s\` — uncommitted file list
2. \`git log --oneline -20\` — recent history
3. \`git diff HEAD\` (truncated to ~200 lines per file) — current dirty state
4. The active TodoWrite list
5. Any \`HANDOFF\` block from the most recent compaction summary

## Compose

Write to \`.claude/sessions/$1.md\` (or \`session-<timestamp>.md\` if $1
is empty):

\`\`\`markdown
# Session: $1
**Saved:** <iso timestamp>
**Branch:** <branch>
**HEAD:** <sha>

## Active task
<one paragraph>

## What was just done
<bulleted list, last ~5 actions>

## What's next
<numbered list, ordered by priority>

## Open questions
<list, or "none">

## Dirty state
\`\`\`diff
<truncated diff>
\`\`\`
\`\`\`

Confirm path written when done.
`,
  };
}

function sessionRestore(): SlashCommandDef {
  return {
    name: 'session-restore',
    subdir: 'session',
    description: 'Restore working context from a previously-saved session file.',
    argumentHint: '[session-name]',
    allowedTools: ['Read', 'Glob', 'Bash(git status:*)', 'Bash(git log:*)'],
    body: `# Session restore — $1

Resume from a saved session under \`.claude/sessions/\`.

## Steps

1. If $1 is empty: \`Glob\` for \`.claude/sessions/*.md\`, sort by mtime
   desc, pick the newest. Tell the operator which one was picked.
2. If $1 is provided: read \`.claude/sessions/$1.md\` (try with and without
   \`.md\` suffix).
3. Compare the saved branch + HEAD to current state. Warn if either differs.
4. Re-create the TodoWrite list from the "What's next" section.
5. Print a one-screen orientation:
   - Active task
   - What was just done (last 5 actions)
   - What's next (top 3)
   - Open questions

Do not auto-resume code edits — surface the orientation, then wait.
`,
  };
}

function primeContext(config: ProjectConfig): SlashCommandDef {
  return {
    name: 'prime-context',
    subdir: 'session',
    description: 'Load project context and switch to architect or analysis mode based on state.',
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash(ls:*)', 'Bash(find:*)'],
    body: `# Prime context — ${config.projectName ?? '(project)'}

Detect whether this is a greenfield or brownfield project, then load the
right context and adopt the right working mode.

## Phase 1: detect state

\`\`\`bash
# Source files present?
find . -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' -o -name '*.go' -o -name '*.rs' \\) \\
  -not -path './node_modules/*' -not -path './.git/*' -not -path './dist/*' | head -10

# Deps installed?
ls package.json node_modules 2>/dev/null

# Project shape
ls -la
\`\`\`

## Phase 2: choose mode

**GREENFIELD signals:** no source files, empty/minimal package.json, no
node_modules, only README/CLAUDE.md/configs.

**BROWNFIELD signals:** source code present, dependencies in
package.json, established directory structure.

## Phase 3: load context

In **both** modes, read in this order:

1. \`CLAUDE.md\` (root + any nested ones)
2. \`README.md\`
3. \`package.json\` (or equivalent manifest) — note scripts and deps
4. Top-level directory tree (depth 2)

## Phase 4: act

### Greenfield → ARCHITECT MODE

Tech stack target: ${describeTechStack(config)}

- Draft an MVP feature list from the PRD/README.
- Stand up project skeleton (package.json scripts, directory layout).
- Open a TodoWrite list of build tasks ordered by dependency.
- Start coding the first vertical slice immediately.

### Brownfield → ANALYST MODE

- Map the architecture: entry points, module boundaries, data flow.
- Identify conventions in use (naming, layering, test style).
- Surface 3–5 quick-win improvements and 1 strategic concern.
- Wait for the operator to choose a target before editing anything.

## Constraints

- **Never** add Claude Code attribution to commit messages.
- Mirror existing patterns; do not introduce new conventions silently.
`,
  };
}

// ---------------------------------------------------------------------------
// Command definitions — Migration
// ---------------------------------------------------------------------------

function migrateAnalyze(): SlashCommandDef {
  return {
    name: 'migrate-analyze',
    subdir: 'migration',
    description: 'Analyse the current stack and identify migration paths and risks.',
    argumentHint: '<target-stack>',
    allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch'],
    body: `# Migrate analyze — $1

Analyse the current codebase against target stack **$1** and produce a
migration feasibility report.

## Steps

1. **Detect current stack.** Read \`package.json\` (and lockfile, if any) to
   identify framework + version. Use \`Grep\` to confirm framework usage in
   actual source (not just declared deps).
2. **Profile coupling.** Estimate how many files reference framework-
   specific APIs (router, ORM, auth, build tooling). Bucket as low (<20),
   medium (20–100), high (>100).
3. **Pull breaking-change docs** for current → target version transition.
   Cite specific URLs.
4. **Enumerate shared resources** that survive the migration: database
   schemas, auth providers, external API integrations.

## Output

\`\`\`
Migration analysis: <current-stack> → $1

Coupling:        <low|medium|high>  (<n> files touch framework APIs)
Breaking changes: <count, with severity histogram>
Shared resources: <list>
Estimated risk:  <low|medium|high|critical>
Recommended strategy: <big-bang | incremental | parallel-run>
\`\`\`

Append a 3-paragraph rationale for the recommended strategy.
`,
  };
}

function migratePlan(): SlashCommandDef {
  return {
    name: 'migrate-plan',
    subdir: 'migration',
    description: 'Build a phased migration plan with checkpoints and rollback strategy.',
    argumentHint: '<target-stack>',
    allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch', 'Write'],
    model: 'claude-opus-4-7',
    body: `# Migrate plan — $1

Construct a phased migration plan from the current stack to **$1**, with
explicit checkpoints, validation gates, and a rollback strategy.

Prerequisite: \`/migrate-analyze $1\` must have been run; consult its
report.

## Plan structure

For each phase, specify:

- **Name + duration** (e.g. "Phase 2: Migrate routing layer — 1 week")
- **Goal** — what's done at the end
- **Tasks** — atomic, ordered, file-scope-explicit
- **Validation** — commands to run before declaring the phase complete
- **Checkpoint** — human-approval gate? automated? what triggers it?
- **Rollback point** — yes/no; if yes, the rollback procedure

## Required phases (template)

1. **Inventory & freeze** — lock current behaviour with characterisation
   tests.
2. **Foundation** — install target stack alongside current; no behavioural
   changes yet.
3. **Migrate leaves** — modules with the fewest inbound deps first.
4. **Migrate core** — the high-coupling modules.
5. **Cutover** — switch traffic / build pipeline / entrypoints.
6. **Decommission** — remove old stack.

## Output

Write the plan to \`MIGRATION-PLAN.md\` (or
\`PRPs/migration-to-$1-prp.md\` if PRP discipline is in use). Surface a
1-paragraph executive summary inline.
`,
  };
}

function migrateExecute(): SlashCommandDef {
  return {
    name: 'migrate-execute',
    subdir: 'migration',
    description: 'Execute one phase of an approved migration plan.',
    argumentHint: '<phase-id>',
    allowedTools: ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash'],
    body: `# Migrate execute — $1

Execute phase **$1** of the migration plan.

## Pre-flight

1. Read \`MIGRATION-PLAN.md\` (or the PRP) and locate phase **$1**.
2. Confirm prior phases are marked complete; if not, refuse to start and
   say which phase is the blocker.
3. \`git status\` — refuse to start with a dirty tree (the phase needs an
   atomic baseline for rollback).

## Execute

1. Open a TodoWrite list from the phase's task list.
2. Execute tasks in order, committing after each atomic task with message
   \`migrate($1): <task name>\`.
3. After every task, run the phase's validation gate. Halt on failure;
   surface the diff that broke it.

## Phase exit

1. Run **all** of the phase's validation commands.
2. If the phase has an automated checkpoint, run it; if a human checkpoint,
   pause and request approval.
3. Mark the phase complete in \`MIGRATION-PLAN.md\` with timestamp + sha.

## Rollback

If anything fails irrecoverably:

1. \`git reset --hard <pre-phase-sha>\`.
2. Annotate the plan with the failure mode and what would be needed to
   retry.
3. Surface a short post-mortem to the operator.
`,
  };
}

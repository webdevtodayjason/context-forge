# Orchestration Log — context-forge Claude-2026 refresh

**Team:** context-forge-refresh
**Orchestrator:** team-lead (left iTerm2 pane)
**Workers:** sdk-bump, settings-gen, agents-gen, skills-gen, hooks-migrate, commands-gen, dogfood (stacked right)
**Protocol start:** 2026-05-11
**Source branch:** main @ 718a137 (origin/main synced)
**WIP stashed:** `subctl-refresh-stash` (your work-in-progress preserved; restore with `git stash pop`)

---

## Mission

Refresh context-forge from v3.2.9 (Aug 2025) to be current with the **2026-05-10 Claude landscape**:

- Models: Claude Opus 4.7, Sonnet 4.6, Haiku 4.5
- Claude Code: skills, agents, plugins, settings.json (hooks lifecycle + mcpServers + statusLine + outputStyles + permissions), `.claude/commands/<name>.md` with frontmatter, statusline, output-styles
- Anthropic SDK: extended thinking, prompt caching (5-min TTL), batch API
- The tool's own dogfooding under `.claude/` must show the modern shape

Ship in two version cuts:
- **v3.3.0**: minimal SDK + model bump. Drop-in upgrade for existing users (W1 alone).
- **v4.0.0**: the new generators (settings.json, agents, skills), modernized hooks + slash commands, dogfood, updated CLAUDE.md templates, refreshed README (W2–W7 + wave 2 wire-up).

---

## Canonical contracts (shared across workers)

### `.claude/settings.json` shape v1

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "claude-opus-4-7",
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write", "hooks": [{ "type": "command", "command": "./.claude/hooks/pre-tool-use.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "./.claude/hooks/lint-on-edit.sh" }] }
    ],
    "PreCompact":   [{ "hooks": [{ "type": "command", "command": "./.claude/hooks/pre-compact.sh" }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "./.claude/hooks/session-start.sh" }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "./.claude/hooks/user-prompt-submit.sh" }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "./.claude/hooks/stop.sh" }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "./.claude/hooks/subagent-stop.sh" }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "./.claude/hooks/notification.sh" }] }]
  },
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "{{CWD}}"]
    }
  },
  "statusLine": { "type": "command", "command": "./.claude/statusline.sh" },
  "outputStyles": { "default": "concise" },
  "permissions": {
    "allow": ["Bash(git status:*)", "Bash(npm test:*)", "Bash(npm run lint:*)"],
    "deny":  ["Bash(rm -rf /:*)"]
  }
}
```

### `.claude/agents/<name>.md` shape

```markdown
---
name: code-reviewer
description: Reviews recent edits for style, security, and convention adherence.
tools: [Read, Grep, Glob, Bash(git diff:*), Bash(git log:*)]
model: claude-opus-4-7
---

# Code Reviewer

You are invoked when the user wants a careful second pass over recent changes...
```

### `.claude/skills/<name>/SKILL.md` shape

```markdown
---
name: testing-protocol
description: How to write, run, and verify tests in this project.
when_to_use: Before claiming "tests pass" or "feature complete"; whenever new tests are added.
---

# Testing protocol for {{project_name}}

## Running tests
{{test_command}}

## Conventions
- Unit tests colocated with sources as `*.test.ts`
- Integration tests in `__tests__/integration/`
...
```

### `.claude/commands/<name>.md` shape

```markdown
---
allowed-tools: [Bash, Read, Grep]
argument-hint: "<feature-name>"
description: "Create a PRP for a new feature"
model: claude-opus-4-7
---

# PRP create — $1

Compose a Product Requirement Prompt for the feature **$1**...
```

### Model lineup (replace hardcoded IDs)

| Purpose                 | Model ID                       | Notes                                         |
|-------------------------|--------------------------------|-----------------------------------------------|
| Default / planning      | `claude-opus-4-7`              | Deep reasoning, PRP generation                |
| Balanced                | `claude-sonnet-4-6`            | General-purpose default for most CLI calls    |
| Cheap classification    | `claude-haiku-4-5-20251001`    | Key validation, quick lints                   |

API key validation hits the **Models endpoint** (`GET /v1/models`) with a token-cheap 1-input `messages.create` using Haiku 4.5 as a fallback.

---

## Task ledger

| ID | Worker        | Subject                                                                | State    |
|----|---------------|------------------------------------------------------------------------|----------|
| W1 | sdk-bump      | Anthropic SDK upgrade + replace hardcoded model IDs                    | pending  |
| W2 | settings-gen  | NEW `src/generators/claudeSettings.ts`                                 | pending  |
| W3 | agents-gen    | NEW `src/generators/agents.ts` + 5 default agent templates             | pending  |
| W4 | skills-gen    | NEW `src/generators/skills.ts` + 3 default skill templates             | pending  |
| W5 | hooks-migrate | Migrate `hooks.ts`/`enhancementHooks.ts`/`migrationHooks.ts` to settings.json format | pending  |
| W6 | commands-gen  | Refactor `slashCommands.ts` to emit real `.md` files with frontmatter  | pending  |
| W7 | dogfood       | Update repo's own `.claude/` to modern shape (settings.json, modern hooks, command frontmatter) | pending  |

---

## Decision log

- **2026-05-11 01:30Z** — Canonical settings.json shape locked above. All workers conform.
- **2026-05-11 01:30Z** — Model lineup table locked. Workers may not introduce other model IDs.
- **2026-05-11 01:30Z** — File scopes locked (see worker prompts). No worker may touch another worker's exclusive scope; orchestrator owns synthesis files (`src/generators/index.ts`, `src/adapters/claude.ts`, `README.md`, `CHANGELOG.md`, `package.json` version, tech-stack templates).

---

## Verification evidence (filled in as workers complete)

### W1 sdk-bump — verified 2026-05-11 ✓
- `grep -rn "claude-3-" src/` → zero matches (old IDs purged)
- `keyManager.ts:196` → `'claude-haiku-4-5-20251001'`
- `apiKeyManager.ts:138` → `'claude-sonnet-4-6'`
- `package.json` `@anthropic-ai/sdk: ^0.94.0` (was `^0.56.0`)
- `package.json` `@anthropic-ai/claude-code: ^2.1.0` (was `^1.0.51`)
- `globalApiKeyManager.ts` was the operator's untracked WIP (not on origin) — safely preserved in `stash@{0}: subctl-refresh-stash`. Will restore + re-apply model swap manually post-merge if Jason wants it.

### W2 settings-gen — verified 2026-05-11 ✓
- `src/generators/claudeSettings.ts` created (271 lines — final count)
- Default model `claude-opus-4-7`
- Exports: `buildClaudeSettings`, `generateClaudeSettings`, + interfaces (`HookCommand`, `HookRule`, `SettingsHooksFragment`, `McpServerConfig`, `StatusLineConfig`, `ClaudePermissions`, `ClaudeSettings`)
- Contract for W5 defined inline at top of file; consumed via dynamic require with `{}` fallback so it compiles before W5 lands
- `ProjectConfig` type extensions flagged for wave 2: `preferredModel?`, `mcpServers?`, `statusLine?`, `outputStyles?`, `permissionsAllow?`, `permissionsDeny?`
- Smoke test: valid JSON, 7 top-level keys, `$schema` URL correct
- Open questions: none

---

### W3 agents-gen — verified 2026-05-11 ✓
- `src/generators/agents.ts` (215 lines) — exports `AgentDef`, `getDefaultAgents`, `generateAgents`, `renderAgentMarkdown`
- 5 templates under `templates/claude/agents/` (48–55 lines each): `code-reviewer`, `test-runner`, `plan-architect`, `security-auditor`, `prp-executor`
- Template bodies clean (no frontmatter inline); generator composes frontmatter from `AgentDef` at render time → keeps templates diff-friendly
- Tools JSON-quoted in YAML (handles `:`, `(`, `)`, `*` correctly)
- Handlebars `noEscape: true` (preserves backticks/asterisks)
- Smoke: 5 files at `.claude/agents/<name>.md`, frontmatter valid YAML on all 5, `{{testCommand}}` substitution confirmed
- ProjectConfig type extensions flagged: `customAgents?: AgentDef[]`, `testCommand?: string` (also exists on TechStackInfo — orchestrator picks canonical location)
- `AgentDef` interface candidate for promotion to `src/types/agents.ts` or `src/types/index.ts` (so adapters can import without going through generator)
- Open questions: none. tsc + lint clean.

### W6 commands-gen — verified 2026-05-11 ✓
- `src/generators/slashCommands.ts` rewritten (1223 lines — W6 reported 870, real count is larger; both fine)
- 21 commands across 6 subdirs: `PRPs/` (5), `orchestration/` (4), `checkpoints/` (3), `quality/` (3), `session/` (3), `migration/` (3)
- Exports: `SlashCommandDef` interface, `getDefaultCommands`, `generateSlashCommands`, `renderCommandsForClaudeMd`, `renderCommandMarkdown`, plus legacy `SlashCommand` interface and `generateSlashCommandFiles` shim that auto-detects shape (keeps `src/adapters/claude.ts` working without a wire-up change)
- Smoke: 22 files emitted (21 commands + README), frontmatter YAML parses 21/21 ✓, models restricted to canonical lineup ✓
- ProjectConfig type extensions needed: none
- tsc + lint clean
- Open questions: none. Wave-2 note: claudeMd.ts can embed `renderCommandsForClaudeMd` output

### W5 hooks-migrate — verified 2026-05-11 ✓
- 3 generators refactored: `hooks.ts`, `enhancementHooks.ts`, `migrationHooks.ts`
- Exports: `getHooksFragment(config): SettingsHooksFragment` aggregates base + enhancement + migration fragments — W2 calls this single entry
- 14 shell scripts + 4 Python (retained where stdin JSON / markdown scanning warrants it: `prp-tracking.py`, `dart-progress-updater.py`, `auto-task-commenter.py`, `task-code-mapper.py`)
- `mode: 0o755` set via local `HookFile extends GeneratedFile { mode?: number }` cast — flagged for wave-2 base.ts extension + adapter chmod
- Full lifecycle coverage: PreCompact, UserPromptSubmit, SessionStart, Stop (×3), PreToolUse (×2), PostToolUse (×5), Notification (×2), SubagentStop (×1)
- `bash -n` 14/14 ✓, `py_compile` 4/4 ✓, `tsc` clean, lint clean on these 3 files
- Drops `ContextRotation.py` (subsumed by `pre-compact.sh` snapshot); renames `PRPTracking.py` → `prp-tracking.py`
- Open questions: GeneratedFile.mode + optional follow-up to deduplicate interface defs (both queued for wave 2)

### W4 skills-gen — verified 2026-05-11 ✓
- `src/generators/skills.ts` (260 lines) — exports `SkillDef`, `getDefaultSkills`, `generateSkills`, `renderSkillMarkdown`
- 3 templates under `templates/claude/skills/` (87–96 lines each): `testing-protocol.md`, `deployment-checklist.md`, `codebase-navigation.md`
- Handlebars variables: `{{projectName}}`, `{{testCommand}}`, `{{testFramework}}`, `{{deployTarget}}`, `{{primaryLanguage}}`, `{{techStack}}`
- Derivation heuristics in skills.ts: framework (Jest/Vitest/Pytest/JUnit/RSpec), language (TS/Python/Java/Ruby/Go), deploy target (vercel/coolify/aws/etc → placeholder fallback)
- Custom skills override + frontmatter YAML parse: pass
- ProjectConfig type extensions flagged for wave 2: `testCommand?`, `deployTarget?`, `customSkills?`
- Open questions: none

### W7 dogfood — verified 2026-05-11 ✓
- `.claude/settings.json` valid JSON, 4 hooks registered (PreCompact, SessionStart, Stop, PostToolUse w/ matcher `Edit|Write`)
- 4 shell hooks created, all `-rwxr-xr-x`: `pre-compact.sh`, `session-start.sh`, `stop.sh`, `lint-on-edit.sh`
- 4 command files frontmattered: `prime-context.md` (opus-4-7), `project-status.md` (sonnet-4-6), `session-save.md` + `session-restore.md` (sonnet-4-6 with `argument-hint`)
- `PreCompact.py` shimmed to exec the new bash hook (kept because downstream refs exist in README/CHANGELOG/`src/generators/hooks.ts` — W5 will modernize those)
- Subdirs `commands/{checkpoints,development,git,...}/` untouched per constraints

---

## Wave-2 backlog (flagged by workers; orchestrator handles)

1. **Restore + re-patch `globalApiKeyManager.ts`** (operator WIP in `stash@{0}`) — if Jason wants it merged, restore from stash and apply the same model-ID swap W1 did.
2. **Extend `ProjectConfig` type** (`src/types/index.ts`) with the 6 optional fields W2 listed. Promote `(config as any).<field>` reads to typed reads.
3. **Extend `GeneratedFile` type** with optional `mode?: number` — W5 confirmed need; declared local `HookFile extends GeneratedFile { mode?: number }` and casts back to `GeneratedFile[]` at return. Wave-2 must (a) add the field to `src/adapters/base.ts` and (b) update the file writer in `src/adapters/claude.ts` (and other adapters) to `fs.chmod` when set.
4. **Wire generators into pipeline**: `src/generators/index.ts` barrel + `src/adapters/claude.ts` `generateFiles()`.
5. **Prompt caching + extended thinking** (originally W1 bonus): deferred to its own task. context-forge uses `@anthropic-ai/claude-code`'s `query()` wrapper, not direct `messages.create` calls. To enable caching/thinking, either (a) plumb options through the wrapper, or (b) switch the planning paths in `AIIntelligenceService` to direct `@anthropic-ai/sdk`. Recommend (b) for `generateFeaturePRP` only; tracked as **W11 ai-paths-direct** for v4.1.0.
6. **CHANGELOG entries** for v3.3.0 (SDK + models — W1 only) and v4.0.0 (everything else).
7. **Refresh README** to remove overstated claims and surface the new generators.

---

## Wave plan

**Wave 1 (parallel, no deps):** W1, W2, W3, W4, W5, W6, W7

**Wave 2 (orchestrator-only synthesis after Wave 1):**
- Wire new generators into `src/generators/index.ts` and `src/adapters/claude.ts`
- Update `src/generators/claudeMd.ts` + `templates/claude/tech-stacks/*.md` to mention skills/agents/MCP/settings.json
- Bump `package.json` version → 4.0.0 (or 3.3.0 if shipping in two PRs)
- Write CHANGELOG entries
- Refresh README headline claims to match generated output
- Run `tsc --noEmit` + `npm run lint`
- Smoke-run `node bin/context-forge.js init --help` and a minimal `init` in a tmp dir to verify output structure

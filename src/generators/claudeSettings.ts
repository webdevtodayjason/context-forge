/**
 * `.claude/settings.json` generator (load-bearing for v4.0.0).
 *
 * Emits a single file at `.claude/settings.json` that wires up:
 *   - top-level `model` (defaults to claude-opus-4-7)
 *   - lifecycle `hooks` (sourced from W5's `getHooksFragment(config)`)
 *   - `mcpServers` (filesystem MCP by default)
 *   - `statusLine` (./.claude/statusline.sh by default)
 *   - `outputStyles` ({ default: "concise" } by default)
 *   - `permissions.allow` / `permissions.deny` (safe defaults, merged with user)
 *
 * Canonical shape is locked in ORCHESTRATION.md ("`.claude/settings.json`
 * shape v1"). All workers must conform.
 *
 * Contract with W5 (hooks-migrate):
 *   `./hooks` will export a function `getHooksFragment(config: ProjectConfig)`
 *   returning a `SettingsHooksFragment` matching the interface below. We
 *   require it dynamically so this module compiles cleanly before W5 lands;
 *   if the symbol is missing we fall back to an empty `{}` fragment.
 *
 *   When W5 lands, they MUST match these interface shapes exactly:
 *     - `HookCommand`     — `{ type: "command"; command: string }`
 *     - `HookRule`        — `{ matcher?: string; hooks: HookCommand[] }`
 *     - `SettingsHooksFragment` — one optional key per lifecycle event,
 *       each `HookRule[]`.
 *
 * ProjectConfig extensions needed (flag to orchestrator, do NOT edit
 * `src/types/index.ts` from this worker):
 *   - `preferredModel?: string`
 *   - `mcpServers?: Record<string, McpServerConfig>`
 *   - `statusLine?: { type: "command"; command: string }`
 *   - `outputStyles?: Record<string, string>`
 *   - `permissionsAllow?: string[]`
 *   - `permissionsDeny?: string[]`
 *
 * Until the type extensions land, we read these via `(config as any).<field>`.
 */

import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

// ---------------------------------------------------------------------------
// Public interfaces — exported so W5 (and any consumer) can import & conform.
// ---------------------------------------------------------------------------

export interface HookCommand {
  type: 'command';
  command: string;
}

export interface HookRule {
  matcher?: string;
  hooks: HookCommand[];
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

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface StatusLineConfig {
  type: 'command';
  command: string;
}

export interface ClaudePermissions {
  allow: string[];
  deny: string[];
}

export interface ClaudeSettings {
  $schema: string;
  model: string;
  hooks: SettingsHooksFragment;
  mcpServers: Record<string, McpServerConfig>;
  statusLine: StatusLineConfig;
  outputStyles: Record<string, string>;
  permissions: ClaudePermissions;
}

// ---------------------------------------------------------------------------
// Defaults — locked to the canonical shape in ORCHESTRATION.md.
// ---------------------------------------------------------------------------

const SETTINGS_SCHEMA_URL = 'https://json.schemastore.org/claude-code-settings.json';
const DEFAULT_MODEL = 'claude-opus-4-7';

const DEFAULT_MCP_SERVERS: Record<string, McpServerConfig> = {
  filesystem: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '{{CWD}}'],
  },
};

const DEFAULT_STATUS_LINE: StatusLineConfig = {
  type: 'command',
  command: './.claude/statusline.sh',
};

const DEFAULT_OUTPUT_STYLES: Record<string, string> = {
  default: 'concise',
};

const DEFAULT_PERMISSIONS_ALLOW: string[] = [
  'Bash(git status:*)',
  'Bash(git diff:*)',
  'Bash(git log:*)',
  'Bash(npm test:*)',
  'Bash(npm run lint:*)',
  'Bash(npm run build:*)',
];

const DEFAULT_PERMISSIONS_DENY: string[] = ['Bash(rm -rf /:*)', 'Bash(sudo:*)'];

// ---------------------------------------------------------------------------
// Hooks fragment loader (W5 contract).
// ---------------------------------------------------------------------------

/**
 * Loads the hooks fragment from the W5-owned `./hooks` module. Uses a
 * runtime require so this file compiles cleanly before W5 ships the
 * `getHooksFragment` export. Any missing-symbol or thrown error yields an
 * empty fragment `{}` so generation still succeeds.
 */
function loadHooksFragment(config: ProjectConfig): SettingsHooksFragment {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hooksModule = require('./hooks') as {
      getHooksFragment?: (c: ProjectConfig) => SettingsHooksFragment | undefined;
    };
    if (typeof hooksModule.getHooksFragment !== 'function') {
      return {};
    }
    const fragment = hooksModule.getHooksFragment(config);
    return fragment && typeof fragment === 'object' ? fragment : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Compose a ClaudeSettings object from project config + the hooks fragment.
 * Uses `(config as any)` reads for optional fields not yet on ProjectConfig
 * (preferredModel, mcpServers, statusLine, outputStyles, permissionsAllow,
 * permissionsDeny). Orchestrator will add those in wave 2.
 */
export function buildClaudeSettings(config: ProjectConfig): ClaudeSettings {
  // Optional extensions — see the file-header note. Cast once, use locally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = config as any;

  const model: string =
    typeof ext.preferredModel === 'string' && ext.preferredModel.length > 0
      ? ext.preferredModel
      : DEFAULT_MODEL;

  const hooks = loadHooksFragment(config);

  const userMcpServers = isRecord(ext.mcpServers)
    ? (ext.mcpServers as Record<string, McpServerConfig>)
    : {};
  const mcpServers: Record<string, McpServerConfig> = {
    ...DEFAULT_MCP_SERVERS,
    ...userMcpServers,
  };

  const statusLine: StatusLineConfig =
    isRecord(ext.statusLine) && typeof ext.statusLine.command === 'string'
      ? {
          type: 'command',
          command: String(ext.statusLine.command),
        }
      : DEFAULT_STATUS_LINE;

  const userOutputStyles = isRecord(ext.outputStyles)
    ? (ext.outputStyles as Record<string, string>)
    : {};
  const outputStyles: Record<string, string> = {
    ...DEFAULT_OUTPUT_STYLES,
    ...userOutputStyles,
  };

  const userAllow = Array.isArray(ext.permissionsAllow)
    ? (ext.permissionsAllow as string[]).filter((v) => typeof v === 'string')
    : [];
  const userDeny = Array.isArray(ext.permissionsDeny)
    ? (ext.permissionsDeny as string[]).filter((v) => typeof v === 'string')
    : [];

  const permissions: ClaudePermissions = {
    allow: dedupe([...DEFAULT_PERMISSIONS_ALLOW, ...userAllow]),
    deny: dedupe([...DEFAULT_PERMISSIONS_DENY, ...userDeny]),
  };

  return {
    $schema: SETTINGS_SCHEMA_URL,
    model,
    hooks,
    mcpServers,
    statusLine,
    outputStyles,
    permissions,
  };
}

// ---------------------------------------------------------------------------
// Generator entrypoint
// ---------------------------------------------------------------------------

/**
 * Generate the `.claude/settings.json` file for a project.
 * Returns a single GeneratedFile to slot into the existing generator pipeline.
 */
export function generateClaudeSettings(config: ProjectConfig): GeneratedFile[] {
  const settings = buildClaudeSettings(config);
  return [
    {
      path: '.claude/settings.json',
      content: JSON.stringify(settings, null, 2) + '\n',
      description:
        'Claude Code settings.json (model, hooks, mcpServers, statusLine, outputStyles, permissions)',
    },
  ];
}

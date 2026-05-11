/**
 * Claude Code sub-agent generator.
 *
 * Emits `.claude/agents/<name>.md` files following the modern Claude Code
 * sub-agent format: YAML frontmatter (name, description, tools, model) then
 * a Markdown body. Other agents invoke these via the Agent tool's
 * `subagent_type` parameter.
 *
 * The default agent set is intentionally small and high-signal:
 *   - code-reviewer    — review recent diffs
 *   - test-runner      — run tests, classify failures
 *   - plan-architect   — read-only PRP planner
 *   - security-auditor — OWASP / CVE / secret scan
 *   - prp-executor     — walk a PRP through its validation gates
 *
 * Templates live under `templates/claude/agents/*.md` and are Handlebars-
 * rendered against the project config (so e.g. `{{testCommand}}` substitutes
 * to the project's actual test command).
 */

import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

export interface AgentDef {
  /** Sub-agent name. Must match the emitted filename (kebab-case, no `.md`). */
  name: string;
  /** Single-line description ending with a period; surfaces in `/agents` UI. */
  description: string;
  /**
   * Optional tool allowlist. Subset of the parent agent's tools.
   * Entries can be bare tool names (`Read`, `Grep`) or restricted-Bash
   * matchers (`Bash(git diff:*)`).
   */
  tools?: string[];
  /** Optional model override. Defaults to inheriting from parent if absent. */
  model?: string;
  /** Markdown body, rendered after the frontmatter. */
  body: string;
}

interface AgentTemplateMeta {
  /** Template filename under `templates/claude/agents/`. */
  filename: string;
  name: string;
  description: string;
  tools?: string[];
  model?: string;
}

const AGENTS_TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates', 'claude', 'agents');

/**
 * Metadata for the default agent set. The body text lives in the matching
 * template files so it can be edited without recompiling. Tool strings here
 * may contain Handlebars expressions (`{{testCommand}}`) — they're rendered
 * against the project config at generation time.
 */
const DEFAULT_AGENT_META: AgentTemplateMeta[] = [
  {
    filename: 'code-reviewer.md',
    name: 'code-reviewer',
    description: 'Reviews recent edits for style, security, performance, and convention adherence.',
    tools: ['Read', 'Grep', 'Glob', 'Bash(git diff:*)', 'Bash(git log:*)', 'Bash(git status:*)'],
    model: 'claude-opus-4-7',
  },
  {
    filename: 'test-runner.md',
    name: 'test-runner',
    description: "Runs the project's test suite, parses failures, and proposes targeted fixes.",
    tools: [
      'Read',
      'Bash({{testCommand}}:*)',
      'Bash(jest:*)',
      'Bash(npm test:*)',
      'Bash(pnpm test:*)',
      'Grep',
    ],
    model: 'claude-sonnet-4-6',
  },
  {
    filename: 'plan-architect.md',
    name: 'plan-architect',
    description:
      "Read-only planning agent. Surveys the codebase and produces implementation plans in the project's PRP format.",
    tools: ['Read', 'Grep', 'Glob', 'WebFetch'],
    model: 'claude-opus-4-7',
  },
  {
    filename: 'security-auditor.md',
    name: 'security-auditor',
    description:
      'Scans for OWASP Top 10 patterns, dependency CVEs, and credential leaks; reports findings by severity.',
    tools: ['Read', 'Grep', 'Glob', 'Bash(npm audit:*)', 'Bash(git log:*)'],
    model: 'claude-opus-4-7',
  },
  {
    filename: 'prp-executor.md',
    name: 'prp-executor',
    description:
      'Walks a PRP file through its validation gates one at a time, marking each pass or fail.',
    tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
    model: 'claude-opus-4-7',
  },
];

/** Build the Handlebars context used when rendering agent bodies and tool strings. */
function buildContext(config: ProjectConfig): Record<string, unknown> {
  const cfgAny = config as unknown as Record<string, unknown>;
  const testCommand = (typeof cfgAny.testCommand === 'string' && cfgAny.testCommand) || 'npm test';

  return {
    projectName: config.projectName,
    description: config.description,
    testCommand,
    techStack: config.techStack,
  };
}

/** Render a template string only if it contains a Handlebars marker; otherwise pass-through. */
function renderTemplateString(s: string, context: Record<string, unknown>): string {
  if (!s.includes('{{')) return s;
  return Handlebars.compile(s, { noEscape: true })(context);
}

/**
 * Load and render the default agent set. Templates are read from
 * `templates/claude/agents/` and Handlebars-compiled against the project
 * config. Tool strings with Handlebars markers are also rendered.
 */
export function getDefaultAgents(config: ProjectConfig): AgentDef[] {
  const context = buildContext(config);

  return DEFAULT_AGENT_META.map((meta) => {
    const templatePath = path.join(AGENTS_TEMPLATE_DIR, meta.filename);
    const raw = fs.readFileSync(templatePath, 'utf-8');
    const body = Handlebars.compile(raw, { noEscape: true })(context).trim();
    const tools = meta.tools?.map((t) => renderTemplateString(t, context));

    return {
      name: meta.name,
      description: meta.description,
      tools,
      model: meta.model,
      body,
    };
  });
}

/**
 * Emit a single agent string can survive a YAML round-trip. Identifiers
 * with only `[A-Za-z0-9_./-]` go unquoted; anything else gets JSON-encoded
 * (a strict subset of YAML double-quoted strings).
 */
function yamlScalar(s: string): string {
  if (/^[A-Za-z0-9_\-./]+$/.test(s)) return s;
  return JSON.stringify(s);
}

/** Emit a YAML flow-sequence of strings, each safely quoted. */
function yamlToolsArray(tools: string[]): string {
  // Always JSON-quote tool entries to keep YAML happy with `:`, `(`, `)`, `*`, etc.
  const items = tools.map((t) => JSON.stringify(t));
  return `[${items.join(', ')}]`;
}

/**
 * Compose the final `.md` content for an agent: YAML frontmatter followed
 * by the Markdown body. The frontmatter is hand-emitted (not js-yaml) to
 * keep the output diff-friendly and avoid pulling a transitive dependency.
 */
export function renderAgentMarkdown(agent: AgentDef): string {
  const lines: string[] = ['---'];
  lines.push(`name: ${yamlScalar(agent.name)}`);
  lines.push(`description: ${yamlScalar(agent.description)}`);
  if (agent.tools && agent.tools.length > 0) {
    lines.push(`tools: ${yamlToolsArray(agent.tools)}`);
  }
  if (agent.model) {
    lines.push(`model: ${yamlScalar(agent.model)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n\n${agent.body.trim()}\n`;
}

/**
 * Generate the full set of agent files. Custom agents supplied on
 * `config.customAgents` are merged into the result: same-name entries
 * override defaults; new names are appended.
 *
 * NOTE: `customAgents` is read off `config` via a cast — `ProjectConfig`
 * does not yet declare it. Adding the field is flagged in the W3 report.
 */
export function generateAgents(config: ProjectConfig): GeneratedFile[] {
  const defaults = getDefaultAgents(config);

  const cfgAny = config as unknown as { customAgents?: AgentDef[] };
  const customAgents: AgentDef[] = Array.isArray(cfgAny.customAgents) ? cfgAny.customAgents : [];

  // Merge: defaults first, then customs override by name, with new names appended.
  const byName = new Map<string, AgentDef>();
  for (const a of defaults) byName.set(a.name, a);
  for (const a of customAgents) byName.set(a.name, a);

  const agents = Array.from(byName.values());

  return agents.map((a) => ({
    path: `.claude/agents/${a.name}.md`,
    content: renderAgentMarkdown(a),
    description: `Claude Code sub-agent: ${a.name}`,
  }));
}

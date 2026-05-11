import path from 'path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

/**
 * A Claude Code Skill definition. Skills are procedural knowledge bundles
 * loaded by Claude Code from `.claude/skills/<name>/SKILL.md` and pulled
 * into context when their `when_to_use` triggers match the user's intent.
 *
 * - `name` must be kebab-case and match the directory the SKILL.md lives in.
 * - `description` is a single-line summary of what the skill teaches.
 * - `when_to_use` is the trigger spec — tells Claude when to load this skill.
 * - `body` is the freeform markdown procedure that follows the frontmatter.
 */
export interface SkillDef {
  name: string;
  description: string;
  when_to_use: string;
  body: string;
}

/**
 * Internal: a built-in skill that has not yet been rendered. `bodyTemplate`
 * is the Handlebars-rendered content (already a string at this point), so
 * the only thing the public API has to do is compose frontmatter + body.
 */
interface BuiltInSkill {
  name: string;
  description: string;
  when_to_use: string;
  templateFile: string;
}

const BUILTIN_SKILLS: BuiltInSkill[] = [
  {
    name: 'testing-protocol',
    description: 'How to write, run, and verify tests in this project.',
    when_to_use: 'Before claiming tests pass or feature is complete; whenever new tests are added.',
    templateFile: 'testing-protocol.md',
  },
  {
    name: 'deployment-checklist',
    description: 'Pre-flight, deploy, rollback, and post-deploy verification for this project.',
    when_to_use:
      'Before shipping to production; when the user says "deploy" or "ship" or asks about release.',
    templateFile: 'deployment-checklist.md',
  },
  {
    name: 'codebase-navigation',
    description: 'Orientation guide: top-level layout, entry points, and where things live.',
    when_to_use:
      'SessionStart hook; whenever context is unclear or the user asks about project structure.',
    templateFile: 'codebase-navigation.md',
  },
];

/**
 * Build the Handlebars context for a skill template. Pulls values off
 * `ProjectConfig` with sensible fallbacks so the rendered body never contains
 * raw `{{...}}` placeholders or `undefined`.
 */
function buildTemplateContext(config: ProjectConfig): Record<string, string> {
  const projectName = config.projectName || '(your-project)';
  const techStack = config.techStack || {};

  // testCommand: prefer an explicit config.testCommand, fall back to npm test.
  const testCommand = (config as Record<string, unknown>).testCommand as string | undefined;

  // testFramework: derive from the tech stack.
  const testFramework = deriveTestFramework(techStack);

  // deployTarget: prefer an explicit config.deployTarget, then config.deployment,
  // fall back to a clear placeholder so the rendered skill flags it for the user.
  const deployTargetRaw =
    ((config as Record<string, unknown>).deployTarget as string | undefined) ||
    (config.deployment as string | undefined);
  const deployTarget = mapDeployTarget(deployTargetRaw);

  // primaryLanguage: derive from the tech stack.
  const primaryLanguage = derivePrimaryLanguage(techStack);

  // techStack: a flat human-readable summary of the configured stack.
  const techStackSummary = summarizeTechStack(techStack);

  return {
    projectName,
    testCommand: testCommand && testCommand.trim().length > 0 ? testCommand : 'npm test',
    testFramework,
    deployTarget,
    primaryLanguage,
    techStack: techStackSummary,
  };
}

function deriveTestFramework(techStack: ProjectConfig['techStack']): string {
  const backend = (techStack.backend || '').toLowerCase();
  const frontend = (techStack.frontend || '').toLowerCase();

  if (
    backend === 'fastapi' ||
    backend === 'django' ||
    backend === 'flask' ||
    backend.includes('python')
  ) {
    return 'Pytest';
  }
  if (frontend === 'vue' || frontend.startsWith('nuxt') || frontend === 'vite') {
    return 'Vitest';
  }
  if (backend === 'spring' || backend.includes('java')) {
    return 'JUnit';
  }
  if (backend === 'rails' || backend.includes('ruby')) {
    return 'RSpec';
  }
  // Jest is the safe default for Node/Next/React projects.
  return 'Jest';
}

function derivePrimaryLanguage(techStack: ProjectConfig['techStack']): string {
  const backend = (techStack.backend || '').toLowerCase();
  const frontend = (techStack.frontend || '').toLowerCase();

  if (
    backend === 'fastapi' ||
    backend === 'django' ||
    backend === 'flask' ||
    backend.includes('python')
  ) {
    return 'Python';
  }
  if (backend === 'spring' || backend.includes('java')) {
    return 'Java';
  }
  if (backend === 'rails' || backend.includes('ruby')) {
    return 'Ruby';
  }
  if (backend.includes('go') || frontend.includes('go')) {
    return 'Go';
  }
  // Default: most context-forge users are on a Node/TS stack.
  return 'TypeScript';
}

function summarizeTechStack(techStack: ProjectConfig['techStack']): string {
  const entries = Object.entries(techStack || {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`);
  return entries.length > 0 ? entries.join(', ') : '(unspecified)';
}

function mapDeployTarget(raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    return '(your-deploy-target)';
  }
  const v = raw.toLowerCase();
  if (v.includes('vercel')) return 'Vercel';
  if (v.includes('netlify')) return 'Netlify';
  if (v.includes('coolify')) return 'Coolify';
  if (v.includes('aws')) return 'AWS';
  if (v.includes('gcp') || v.includes('google')) return 'GCP';
  if (v.includes('azure')) return 'Azure';
  if (v.includes('docker')) return 'Docker';
  if (v.includes('fly')) return 'Fly.io';
  if (v.includes('render')) return 'Render';
  if (v.includes('railway')) return 'Railway';
  return raw;
}

/**
 * Load a skill body template from disk and render it with the project
 * context. Synchronous so that callers can use `getDefaultSkills` /
 * `generateSkills` without forcing an async boundary on the whole
 * generator pipeline.
 */
function renderTemplate(templateFile: string, context: Record<string, string>): string {
  const templatePath = path.join(__dirname, '../../templates/claude/skills', templateFile);
  // Synchronous read keeps the public API non-Promise-based.
  const source = fs.readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(source, { noEscape: true });
  return compiled(context);
}

/**
 * YAML-escape a single-line string value. Skill frontmatter values are
 * always single-line, so this is intentionally simple: wrap in double
 * quotes, escape backslashes and embedded double quotes.
 */
function yamlString(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Compose the on-disk markdown for a single skill: YAML frontmatter
 * followed by the rendered body. The output is what gets written to
 * `.claude/skills/<name>/SKILL.md`.
 */
export function renderSkillMarkdown(skill: SkillDef): string {
  const frontmatter = [
    '---',
    `name: ${yamlString(skill.name)}`,
    `description: ${yamlString(skill.description)}`,
    `when_to_use: ${yamlString(skill.when_to_use)}`,
    '---',
  ].join('\n');

  // Normalize trailing whitespace so the file ends with exactly one newline.
  const body = skill.body.replace(/\s*$/, '') + '\n';
  return `${frontmatter}\n\n${body}`;
}

/**
 * Build the list of skills that should be emitted for the given project.
 *
 * Returns the built-in defaults (testing-protocol, deployment-checklist,
 * codebase-navigation) with bodies already rendered for the project. If
 * the caller has populated `config.customSkills`, those are merged in:
 * any custom skill with the same `name` as a built-in overrides it,
 * otherwise it is appended.
 */
export function getDefaultSkills(config: ProjectConfig): SkillDef[] {
  const context = buildTemplateContext(config);

  const defaults: SkillDef[] = BUILTIN_SKILLS.map((spec) => ({
    name: spec.name,
    description: spec.description,
    when_to_use: spec.when_to_use,
    body: renderTemplate(spec.templateFile, context),
  }));

  const custom = (config as Record<string, unknown>).customSkills as SkillDef[] | undefined;
  if (!custom || custom.length === 0) {
    return defaults;
  }

  const byName = new Map<string, SkillDef>();
  for (const s of defaults) byName.set(s.name, s);
  for (const s of custom) {
    if (!s || !s.name) continue;
    byName.set(s.name, s);
  }
  return Array.from(byName.values());
}

/**
 * Top-level entry point: produce `GeneratedFile` entries for every skill
 * this project should ship with. Each file is written to
 * `.claude/skills/<name>/SKILL.md` relative to the project root.
 */
export function generateSkills(config: ProjectConfig): GeneratedFile[] {
  const skills = getDefaultSkills(config);
  return skills.map((s) => ({
    path: `.claude/skills/${s.name}/SKILL.md`,
    content: renderSkillMarkdown(s),
    description: `Claude Code skill: ${s.name}`,
  }));
}

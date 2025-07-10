import { IDEAdapter } from './base';
import { ClaudeAdapter } from './claude';
import { CursorAdapter } from './cursor';
import { RooCodeAdapter } from './roo';
import { ClineAdapter } from './cline';
import { GeminiAdapter } from './gemini';
import { WindsurfAdapter } from './windsurf';
import { CopilotAdapter } from './copilot';
import { ProjectConfig, SupportedIDE, IDEInfo } from '../types';

export { IDEAdapter, GeneratedFile } from './base';

export const IDE_INFO: Record<SupportedIDE, IDEInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    description: "Anthropic's official CLI for Claude (recommended)",
    configFiles: ['CLAUDE.md', 'Docs/', 'PRPs/'],
    supportsValidation: true,
    supportsPRP: true,
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor IDE',
    description: 'AI-powered IDE built on VS Code',
    configFiles: ['.cursorrules', '.cursor/rules/'],
    supportsValidation: true,
    supportsPRP: true,
  },
  roo: {
    id: 'roo',
    name: 'Roo Code',
    description: 'VS Code extension for AI-assisted development',
    configFiles: ['.roo/rules/', '.roorules'],
    supportsValidation: true,
    supportsPRP: false,
  },
  cline: {
    id: 'cline',
    name: 'Cline',
    description: 'VS Code extension for AI pair programming (formerly Claude Dev)',
    configFiles: ['.clinerules/'],
    supportsValidation: true,
    supportsPRP: true,
  },
  windsurf: {
    id: 'windsurf',
    name: 'Windsurf IDE',
    description: 'AI-powered IDE with Cascade AI integration',
    configFiles: ['.windsurfrules.md', '.codeiumignore', 'global_rules.md'],
    supportsValidation: true,
    supportsPRP: true,
  },
  copilot: {
    id: 'copilot',
    name: 'GitHub Copilot',
    description: 'AI pair programmer from GitHub',
    configFiles: ['.github/copilot-instructions.md', '.vscode/settings.json'],
    supportsValidation: false,
    supportsPRP: false,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: "Google's Gemini AI tools (CLI and Code Assist)",
    configFiles: ['GEMINI.md', '.gemini/'],
    supportsValidation: true,
    supportsPRP: false,
  },
};

export function createAdapter(ide: SupportedIDE, config: ProjectConfig): IDEAdapter {
  switch (ide) {
    case 'claude':
      return new ClaudeAdapter(config);
    case 'cursor':
      return new CursorAdapter(config);
    case 'roo':
      return new RooCodeAdapter(config);
    case 'cline':
      return new ClineAdapter(config);
    case 'gemini':
      return new GeminiAdapter(config);
    case 'windsurf':
      return new WindsurfAdapter(config);
    case 'copilot':
      return new CopilotAdapter(config);
    default:
      throw new Error(`Unknown IDE: ${ide}`);
  }
}

export function getIDEInfo(ide: SupportedIDE): IDEInfo {
  return IDE_INFO[ide];
}

export function getAllIDEs(): IDEInfo[] {
  return Object.values(IDE_INFO);
}

export function getSupportedIDEs(): SupportedIDE[] {
  return Object.keys(IDE_INFO) as SupportedIDE[];
}

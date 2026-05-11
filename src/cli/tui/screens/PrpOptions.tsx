import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Hint } from '../components/Hint.js';
import type { ProjectConfig } from '../../../types/index.js';

export interface PrpOptionsProps {
  initial?: ProjectConfig['extras'];
  onSubmit: (extras: ProjectConfig['extras']) => void;
  onBack: () => void;
}

interface Toggle {
  key: keyof ProjectConfig['extras'];
  label: string;
  blurb: string;
  defaultOn?: boolean;
}

const TOGGLES: Toggle[] = [
  {
    key: 'prp',
    label: 'Base PRP (Product Requirement Prompts)',
    blurb: 'Template-based PRPs Claude can execute',
    defaultOn: true,
  },
  {
    key: 'aiPrp',
    label: 'AI-Enhanced PRP',
    blurb: 'Use the Anthropic API to craft richer PRPs (requires API key)',
  },
  {
    key: 'claudeCommands',
    label: 'Claude Code slash commands',
    blurb: 'Generate /prime-context, /project-status, etc.',
    defaultOn: true,
  },
  {
    key: 'hooks',
    label: 'Claude Code hooks',
    blurb: 'Pre/Post tool-use hooks for safety + linting',
    defaultOn: true,
  },
  {
    key: 'checkpoints',
    label: 'Human-in-the-Loop checkpoints',
    blurb: 'Pause for verification at critical milestones',
  },
  {
    key: 'docker',
    label: 'Docker configuration',
    blurb: 'Dockerfile + compose for the chosen stack',
    defaultOn: true,
  },
  {
    key: 'testing',
    label: 'Testing setup',
    blurb: 'Pre-wired test framework config',
    defaultOn: true,
  },
  {
    key: 'linting',
    label: 'ESLint / Prettier config',
    blurb: 'Format + lint on save',
    defaultOn: true,
  },
  {
    key: 'aiDocs',
    label: 'AI docs directory',
    blurb: 'ai_docs/ for stack-specific reference material',
  },
];

export const PrpOptions: React.FC<PrpOptionsProps> = ({ initial, onSubmit, onBack }) => {
  const seedExtras = (): ProjectConfig['extras'] => {
    const out: ProjectConfig['extras'] = {};
    for (const t of TOGGLES) {
      if (initial && t.key in initial && initial[t.key] !== undefined) {
        (out as Record<string, boolean | undefined>)[t.key] = initial[t.key];
      } else if (t.defaultOn) {
        (out as Record<string, boolean | undefined>)[t.key] = true;
      } else {
        (out as Record<string, boolean | undefined>)[t.key] = false;
      }
    }
    return out;
  };

  const [extras, setExtras] = useState<ProjectConfig['extras']>(seedExtras);
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.return) {
      onSubmit(extras);
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(TOGGLES.length - 1, c + 1));
      return;
    }
    if (input === ' ') {
      const t = TOGGLES[cursor];
      setExtras((prev) => ({ ...prev, [t.key]: !prev[t.key] }));
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 7 — Generation options
      </Text>
      <Text color="gray" dimColor>
        Choose what context-forge should generate alongside the IDE configs.
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {TOGGLES.map((t, idx) => {
          const on = extras[t.key];
          const isCursor = idx === cursor;
          const cb = on ? '☑' : '☐';
          return (
            <Box key={t.key}>
              <Text color={isCursor ? 'cyan' : undefined}>
                {isCursor ? '▶ ' : '  '}
                {cb} {t.label}
              </Text>
              <Box marginLeft={1}>
                <Text color="gray" dimColor>
                  — {t.blurb}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Hint showNav={false} text="space toggle · enter continue · esc back" />
    </Box>
  );
};

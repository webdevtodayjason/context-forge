import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Hint } from '../components/Hint.js';
import type { SupportedIDE } from '../../../types/index.js';

export interface IdeTargetsProps {
  initial?: SupportedIDE[];
  onSubmit: (ides: SupportedIDE[]) => void;
  onBack: () => void;
}

interface IdeOption {
  id: SupportedIDE;
  label: string;
  blurb: string;
  comingSoon?: boolean;
  recommended?: boolean;
}

const OPTIONS: IdeOption[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    blurb: "Anthropic's official CLI (recommended)",
    recommended: true,
  },
  {
    id: 'cursor',
    label: 'Cursor IDE',
    blurb: 'AI-powered IDE built on VS Code',
  },
  {
    id: 'roo',
    label: 'Roo Code',
    blurb: 'VS Code extension for AI development',
  },
  {
    id: 'cline',
    label: 'Cline',
    blurb: 'VS Code AI pair programming extension',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    blurb: "Google's AI tools (CLI & Code Assist)",
  },
  {
    id: 'windsurf',
    label: 'Windsurf IDE',
    blurb: 'Cascade-AI IDE (coming soon)',
    comingSoon: true,
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    blurb: 'AI pair programmer (coming soon)',
    comingSoon: true,
  },
];

export const IdeTargets: React.FC<IdeTargetsProps> = ({ initial, onSubmit, onBack }) => {
  const initialSelected = new Set<SupportedIDE>(initial ?? ['claude']);

  const [selected, setSelected] = useState<Set<SupportedIDE>>(initialSelected);
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(OPTIONS.length - 1, c + 1));
      return;
    }
    if (key.return) {
      const chosen = Array.from(selected);
      if (chosen.length === 0) {
        setError('Pick at least one IDE.');
        return;
      }
      setError(null);
      onSubmit(chosen);
      return;
    }
    if (input === ' ') {
      const opt = OPTIONS[cursor];
      if (opt.comingSoon) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(opt.id)) {
          next.delete(opt.id);
        } else {
          next.add(opt.id);
        }
        return next;
      });
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 6 — Target IDEs
      </Text>
      <Text color="gray" dimColor>
        Generate configs for one or many IDEs. Space to toggle, enter to confirm.
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {OPTIONS.map((opt, idx) => {
          const isCursor = idx === cursor;
          const checked = selected.has(opt.id);
          const cb = checked ? '☑' : '☐';
          const color = opt.comingSoon ? 'gray' : isCursor ? 'cyan' : undefined;
          return (
            <Box key={opt.id}>
              <Text color={color} dimColor={opt.comingSoon}>
                {isCursor ? '▶ ' : '  '}
                {cb} {opt.label}
                {opt.recommended ? ' ★' : ''}
              </Text>
              <Box marginLeft={1}>
                <Text color="gray" dimColor>
                  — {opt.blurb}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
      {error ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
      <Hint showNav={false} text="space toggle · enter continue · esc back" />
    </Box>
  );
};

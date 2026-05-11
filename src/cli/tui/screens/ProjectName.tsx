import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { Hint } from '../components/Hint.js';
import type { ProjectConfig } from '../../../types/index.js';

export interface ProjectNameProps {
  initialName?: string;
  initialType?: ProjectConfig['projectType'];
  onSubmit: (name: string, type: ProjectConfig['projectType']) => void;
  onBack: () => void;
}

const TYPE_CHOICES: Array<{ label: string; value: ProjectConfig['projectType'] }> = [
  { label: '🌐  Web Application', value: 'web' },
  { label: '📱  Mobile Application', value: 'mobile' },
  { label: '🖥️   Desktop Application', value: 'desktop' },
  { label: '🔌  API Service', value: 'api' },
  { label: '🚀  Full-Stack Application', value: 'fullstack' },
];

export const ProjectName: React.FC<ProjectNameProps> = ({
  initialName,
  initialType,
  onSubmit,
  onBack,
}) => {
  const [phase, setPhase] = useState<'name' | 'type'>('name');
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (phase === 'type') {
        setPhase('name');
      } else {
        onBack();
      }
    }
  });

  if (phase === 'name') {
    const handleSubmit = (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setError('Project name must be at least 2 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9-_ ]+$/.test(trimmed)) {
        setError('Use letters, numbers, hyphens, underscores, or spaces only.');
        return;
      }
      setError(null);
      setName(trimmed);
      setPhase('type');
    };

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          Step 1 — Project name
        </Text>
        <Box marginTop={1}>
          <Text>What is the project name? </Text>
          <TextInput value={name} onChange={setName} onSubmit={handleSubmit} />
        </Box>
        {error ? (
          <Box marginTop={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : null}
        <Hint text="type to edit · enter to confirm · esc to go back" showNav={false} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 2 — Project type
      </Text>
      <Box marginTop={1}>
        <Text>
          What kind of project is <Text color="green">{name}</Text>?
        </Text>
      </Box>
      <Box marginTop={1}>
        <SelectInput
          items={TYPE_CHOICES.map((c) => ({ label: c.label, value: c.value }))}
          initialIndex={
            initialType
              ? Math.max(
                  0,
                  TYPE_CHOICES.findIndex((c) => c.value === initialType)
                )
              : 0
          }
          onSelect={(item) => onSubmit(name, item.value as ProjectConfig['projectType'])}
        />
      </Box>
      <Hint />
    </Box>
  );
};

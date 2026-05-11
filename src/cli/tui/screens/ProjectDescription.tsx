import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Hint } from '../components/Hint.js';

export interface ProjectDescriptionProps {
  initialDescription?: string;
  onSubmit: (description: string) => void;
  onBack: () => void;
}

export const ProjectDescription: React.FC<ProjectDescriptionProps> = ({
  initialDescription,
  onSubmit,
  onBack,
}) => {
  const [value, setValue] = useState(initialDescription ?? '');
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) onBack();
  });

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (trimmed.length < 10) {
      setError('Description must be at least 10 characters (helps the AI write better docs).');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 3 — Description
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text>Briefly describe what this project does:</Text>
        <Text color="gray" dimColor>
          e.g. &quot;A SaaS dashboard for law firms to track case progress&quot;
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>{'> '}</Text>
        <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
      </Box>
      <Box marginTop={1}>
        <Text color="gray">{value.length} chars</Text>
      </Box>
      {error ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
      <Hint text="enter to confirm · esc to go back" showNav={false} />
    </Box>
  );
};

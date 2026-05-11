import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Logo } from '../components/Logo.js';
import { Hint } from '../components/Hint.js';

export interface WelcomeProps {
  onContinue: () => void;
  onCancel: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onContinue, onCancel }) => {
  useInput((input, key) => {
    if (key.return) {
      onContinue();
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Logo tagline="AI-optimized scaffolding for Claude, Cursor, Cline, and friends" />
      <Box flexDirection="column" marginTop={1}>
        <Text>
          <Text color="green" bold>
            Welcome!
          </Text>{' '}
          This wizard will collect a handful of details about your project
          and generate the docs + configs your AI IDE needs.
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text color="gray"> · 8 quick screens (~2 minutes)</Text>
          <Text color="gray"> · You can press <Text color="white">Esc</Text> to go back at any time</Text>
          <Text color="gray"> · Press <Text color="white">Ctrl-C</Text> to quit without writing anything</Text>
        </Box>
      </Box>
      <Hint text="press enter to begin · esc to cancel" showNav={false} />
    </Box>
  );
};

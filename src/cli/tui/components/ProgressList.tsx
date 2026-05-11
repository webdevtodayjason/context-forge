import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { GenerationStep } from '../types.js';

export interface ProgressListProps {
  steps: GenerationStep[];
}

const STATUS_ICON: Record<GenerationStep['status'], string> = {
  pending: '○',
  running: '◐',
  done: '✔',
  failed: '✖',
};

const STATUS_COLOR: Record<GenerationStep['status'], string> = {
  pending: 'gray',
  running: 'cyan',
  done: 'green',
  failed: 'red',
};

export const ProgressList: React.FC<ProgressListProps> = ({ steps }) => {
  return (
    <Box flexDirection="column">
      {steps.map((step) => {
        const color = STATUS_COLOR[step.status];
        const icon =
          step.status === 'running' ? null : STATUS_ICON[step.status];
        return (
          <Box key={step.id}>
            <Box marginRight={1}>
              {step.status === 'running' ? (
                <Text color={color}>
                  <Spinner type="dots" />
                </Text>
              ) : (
                <Text color={color}>{icon}</Text>
              )}
            </Box>
            <Text color={color}>{step.label}</Text>
            {step.detail ? (
              <Box marginLeft={1}>
                <Text color="gray" dimColor>
                  {step.detail}
                </Text>
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
};

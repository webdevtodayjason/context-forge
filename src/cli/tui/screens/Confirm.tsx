import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Hint } from '../components/Hint.js';
import type { WizardState } from '../types.js';

export interface ConfirmProps {
  state: WizardState;
  outputPath: string;
  onGenerate: () => void;
  onBack: () => void;
}

const formatTechStack = (stack: WizardState['techStack']): string => {
  const parts: string[] = [];
  if (stack.frontend && stack.frontend !== 'none') parts.push(`Frontend: ${stack.frontend}`);
  if (stack.styling) parts.push(`Style: ${stack.styling}`);
  if (stack.stateManagement && stack.stateManagement !== 'none')
    parts.push(`State: ${stack.stateManagement}`);
  if (stack.backend && stack.backend !== 'none') parts.push(`Backend: ${stack.backend}`);
  if (stack.database && stack.database !== 'none') parts.push(`DB: ${stack.database}`);
  if (stack.auth && stack.auth !== 'none') parts.push(`Auth: ${stack.auth}`);
  return parts.join(' · ') || 'No stack selected';
};

const truthyExtras = (extras: WizardState['extras']): string[] => {
  return Object.entries(extras)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
};

export const Confirm: React.FC<ConfirmProps> = ({ state, outputPath, onGenerate, onBack }) => {
  useInput((_input, key) => {
    if (key.return) onGenerate();
    if (key.escape) onBack();
  });

  const featuresByPriority = {
    'must-have': state.features.filter((f) => f.priority === 'must-have'),
    'should-have': state.features.filter((f) => f.priority === 'should-have'),
    'nice-to-have': state.features.filter((f) => f.priority === 'nice-to-have'),
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Step 8 — Review &amp; generate
      </Text>
      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="cyan" paddingX={1}>
        <Box>
          <Text color="gray">Name: </Text>
          <Text bold>{state.projectName}</Text>
          <Text color="gray"> · type: </Text>
          <Text>{state.projectType}</Text>
        </Box>
        <Box>
          <Text color="gray">Output: </Text>
          <Text color="white">{outputPath}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Description: </Text>
          <Text>{state.description}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Stack: </Text>
          <Text>{formatTechStack(state.techStack)}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text color="gray">Features ({state.features.length}):</Text>
          {featuresByPriority['must-have'].length > 0 ? (
            <Text>
              <Text color="red">  must</Text>: {featuresByPriority['must-have'].map((f) => f.name).join(', ')}
            </Text>
          ) : null}
          {featuresByPriority['should-have'].length > 0 ? (
            <Text>
              <Text color="yellow">  should</Text>: {featuresByPriority['should-have'].map((f) => f.name).join(', ')}
            </Text>
          ) : null}
          {featuresByPriority['nice-to-have'].length > 0 ? (
            <Text>
              <Text color="gray">  nice</Text>: {featuresByPriority['nice-to-have'].map((f) => f.name).join(', ')}
            </Text>
          ) : null}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">IDEs: </Text>
          <Text>{state.targetIDEs.join(', ')}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Extras: </Text>
          <Text>{truthyExtras(state.extras).join(', ') || 'none'}</Text>
        </Box>
      </Box>
      <Hint text="enter to generate · esc to go back" showNav={false} />
    </Box>
  );
};

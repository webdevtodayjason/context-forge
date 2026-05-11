import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import type { WizardState, GenerationResult } from '../types.js';

export interface DoneProps {
  state: WizardState;
  result: GenerationResult;
  outputPath: string;
}

export const Done: React.FC<DoneProps> = ({ state, result, outputPath }) => {
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.return || key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="green" bold>
          ✨ Context Forge setup complete!
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="green" paddingX={1}>
        <Box>
          <Text color="gray">Project: </Text>
          <Text bold>{state.projectName}</Text>
        </Box>
        <Box>
          <Text color="gray">Output: </Text>
          <Text color="white">{outputPath}</Text>
        </Box>
        <Box>
          <Text color="gray">Files: </Text>
          <Text>{result.filesCreated} created</Text>
          {result.filesUpdated ? (
            <Text>
              {' · '}
              {result.filesUpdated} updated
            </Text>
          ) : null}
          {result.filesSkipped ? (
            <Text color="yellow">
              {' · '}
              {result.filesSkipped} skipped
            </Text>
          ) : null}
        </Box>
        <Box>
          <Text color="gray">IDEs: </Text>
          <Text>{state.targetIDEs.join(', ')}</Text>
        </Box>
        {result.summary ? (
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {result.summary}
            </Text>
          </Box>
        ) : null}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text color="cyan" bold>
          Next steps
        </Text>
        <Text>1. Open the project in your AI IDE</Text>
        <Text>2. Review the generated CLAUDE.md / config files</Text>
        <Text>3. Run <Text color="white">context-forge validate</Text> to sanity-check</Text>
        <Text>4. Start implementing using the staged approach</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          press enter to exit
        </Text>
      </Box>
    </Box>
  );
};

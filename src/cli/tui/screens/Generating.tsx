import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ProgressList } from '../components/ProgressList.js';
import type { GenerationResult, GenerationStep, RunGenerators } from '../types.js';
import type { ProjectConfig } from '../../../types/index.js';

export interface GeneratingProps {
  config: ProjectConfig;
  runGenerators: RunGenerators;
  onDone: (result: GenerationResult) => void;
  onError: (err: Error) => void;
}

export const Generating: React.FC<GeneratingProps> = ({
  config,
  runGenerators,
  onDone,
  onError,
}) => {
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'init', label: 'Preparing…', status: 'running' },
  ]);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    (async () => {
      try {
        const result = await runGenerators(config, (next) => {
          setSteps(next);
        });
        onDone(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setSteps((prev) =>
          prev.map((s) => (s.status === 'running' ? { ...s, status: 'failed' } : s))
        );
        onError(error);
      }
    })();
  }, [config, runGenerators, onDone, onError]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text bold color="cyan">
          {'  '}Generating context-forge output…
        </Text>
      </Box>
      <Box marginTop={1}>
        <ProgressList steps={steps} />
      </Box>
    </Box>
  );
};

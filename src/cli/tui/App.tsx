import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Welcome } from './screens/Welcome.js';
import { ProjectName } from './screens/ProjectName.js';
import { ProjectDescription } from './screens/ProjectDescription.js';
import { TechStack } from './screens/TechStack.js';
import { Features } from './screens/Features.js';
import { IdeTargets } from './screens/IdeTargets.js';
import { PrpOptions } from './screens/PrpOptions.js';
import { Confirm } from './screens/Confirm.js';
import { Generating } from './screens/Generating.js';
import { Done } from './screens/Done.js';
import type { GenerationResult, RunGenerators, Screen, WizardState } from './types.js';
import type { ProjectConfig } from '../../types/index.js';

export interface AppProps {
  initial?: Partial<WizardState>;
  outputPath: string;
  runGenerators: RunGenerators;
  onComplete: (config: ProjectConfig) => void;
  onCancel: () => void;
}

const defaultState = (initial?: Partial<WizardState>): WizardState => ({
  projectName: initial?.projectName ?? '',
  projectType: initial?.projectType ?? 'web',
  description: initial?.description ?? '',
  techStack: initial?.techStack ?? {},
  features: initial?.features ?? [],
  targetIDEs: initial?.targetIDEs ?? ['claude'],
  extras: initial?.extras ?? {
    docker: true,
    testing: true,
    linting: true,
    prp: true,
    claudeCommands: true,
    hooks: true,
  },
  timeline: initial?.timeline ?? 'mvp',
  teamSize: initial?.teamSize ?? 'solo',
  deployment: initial?.deployment ?? 'vercel',
});

const buildProjectConfig = (state: WizardState): ProjectConfig => ({
  projectName: state.projectName,
  projectType: state.projectType,
  description: state.description,
  techStack: state.techStack,
  features: state.features,
  timeline: state.timeline,
  teamSize: state.teamSize,
  deployment: state.deployment,
  targetIDEs: state.targetIDEs,
  extras: state.extras,
});

export const App: React.FC<AppProps> = ({
  initial,
  outputPath,
  runGenerators,
  onComplete,
  onCancel,
}) => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [state, setState] = useState<WizardState>(() => defaultState(initial));
  const [genResult, setGenResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Global Ctrl-C — Ink itself handles this by default but we set up a safety net.
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const cancel = (): void => {
    onCancel();
    exit();
  };

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red" bold>
          ✖ Generation failed
        </Text>
        <Box marginTop={1}>
          <Text color="red">{error.message}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            press ctrl-c to exit
          </Text>
        </Box>
      </Box>
    );
  }

  switch (screen) {
    case 'welcome':
      return <Welcome onContinue={() => setScreen('project-name')} onCancel={cancel} />;

    case 'project-name':
      return (
        <ProjectName
          initialName={state.projectName}
          initialType={state.projectType}
          onSubmit={(projectName, projectType) => {
            setState((s) => ({ ...s, projectName, projectType }));
            setScreen('project-description');
          }}
          onBack={() => setScreen('welcome')}
        />
      );

    case 'project-description':
      return (
        <ProjectDescription
          initialDescription={state.description}
          onSubmit={(description) => {
            setState((s) => ({ ...s, description }));
            setScreen('tech-stack');
          }}
          onBack={() => setScreen('project-name')}
        />
      );

    case 'tech-stack':
      return (
        <TechStack
          projectType={state.projectType}
          initial={state.techStack}
          onSubmit={(techStack) => {
            setState((s) => ({ ...s, techStack }));
            setScreen('features');
          }}
          onBack={() => setScreen('project-description')}
        />
      );

    case 'features':
      return (
        <Features
          projectType={state.projectType}
          initial={state.features}
          onSubmit={(features) => {
            setState((s) => ({ ...s, features }));
            setScreen('ide-targets');
          }}
          onBack={() => setScreen('tech-stack')}
        />
      );

    case 'ide-targets':
      return (
        <IdeTargets
          initial={state.targetIDEs}
          onSubmit={(targetIDEs) => {
            setState((s) => ({ ...s, targetIDEs }));
            setScreen('prp-options');
          }}
          onBack={() => setScreen('features')}
        />
      );

    case 'prp-options':
      return (
        <PrpOptions
          initial={state.extras}
          onSubmit={(extras) => {
            setState((s) => ({ ...s, extras }));
            setScreen('confirm');
          }}
          onBack={() => setScreen('ide-targets')}
        />
      );

    case 'confirm':
      return (
        <Confirm
          state={state}
          outputPath={outputPath}
          onGenerate={() => {
            onComplete(buildProjectConfig(state));
            setScreen('generating');
          }}
          onBack={() => setScreen('prp-options')}
        />
      );

    case 'generating':
      return (
        <Generating
          config={buildProjectConfig(state)}
          runGenerators={runGenerators}
          onDone={(result) => {
            setGenResult(result);
            setScreen('done');
          }}
          onError={(err) => setError(err)}
        />
      );

    case 'done':
      return (
        <Done
          state={state}
          result={genResult ?? { outputPath, filesCreated: 0 }}
          outputPath={outputPath}
        />
      );

    default:
      return null;
  }
};

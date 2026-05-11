import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import type { ProjectConfig } from '../../types/index.js';
import type { RunGenerators, WizardState } from './types.js';

export interface RunInitTuiOptions {
  initial?: Partial<WizardState>;
  outputPath: string;
  runGenerators: RunGenerators;
}

/**
 * Mounts the Ink-based init wizard and resolves once the user has confirmed
 * (and the runGenerators callback has finished).
 *
 * Resolves with the collected ProjectConfig. Rejects on user-cancellation
 * (Ctrl-C / explicit cancel) or generator failure.
 */
export async function runInitTui(opts: RunInitTuiOptions): Promise<ProjectConfig> {
  return new Promise((resolve, reject) => {
    let collected: ProjectConfig | null = null;
    let cancelled = false;

    const onComplete = (config: ProjectConfig): void => {
      collected = config;
    };

    const onCancel = (): void => {
      cancelled = true;
    };

    const element = React.createElement(App, {
      initial: opts.initial,
      outputPath: opts.outputPath,
      runGenerators: opts.runGenerators,
      onComplete,
      onCancel,
    });

    const instance = render(element, { exitOnCtrlC: true });

    instance
      .waitUntilExit()
      .then(() => {
        if (cancelled) {
          reject(new Error('Init wizard cancelled by user.'));
          return;
        }
        if (!collected) {
          reject(new Error('Init wizard exited before configuration was collected.'));
          return;
        }
        resolve(collected);
      })
      .catch((err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}

export type { RunGenerators } from './types.js';
export { App } from './App.js';

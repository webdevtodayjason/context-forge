import type { ProjectConfig, SupportedIDE, Feature } from '../../types/index.js';

export type Screen =
  | 'welcome'
  | 'project-name'
  | 'project-description'
  | 'tech-stack'
  | 'features'
  | 'ide-targets'
  | 'prp-options'
  | 'confirm'
  | 'generating'
  | 'done';

export type FeaturePriority = 'must-have' | 'should-have' | 'nice-to-have';

export interface WizardState {
  projectName: string;
  projectType: ProjectConfig['projectType'];
  description: string;
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    auth?: string;
    styling?: string;
    stateManagement?: string;
  };
  features: Feature[];
  targetIDEs: SupportedIDE[];
  extras: ProjectConfig['extras'];
  timeline: ProjectConfig['timeline'];
  teamSize: ProjectConfig['teamSize'];
  deployment: string;
}

export type GenerationStepStatus = 'pending' | 'running' | 'done' | 'failed';

export interface GenerationStep {
  id: string;
  label: string;
  status: GenerationStepStatus;
  detail?: string;
}

export interface GenerationResult {
  outputPath: string;
  filesCreated: number;
  filesSkipped?: number;
  filesUpdated?: number;
  summary?: string;
}

export type RunGenerators = (
  config: ProjectConfig,
  onProgress: (steps: GenerationStep[]) => void
) => Promise<GenerationResult>;

export interface TuiOptions {
  initial?: Partial<WizardState>;
  outputPath: string;
  runGenerators: RunGenerators;
}

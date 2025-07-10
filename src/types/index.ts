export type SupportedIDE =
  | 'claude'
  | 'cursor'
  | 'roo'
  | 'cline'
  | 'windsurf'
  | 'copilot'
  | 'gemini';

export interface IDEInfo {
  id: SupportedIDE;
  name: string;
  description: string;
  configFiles: string[];
  supportsValidation: boolean;
  supportsPRP: boolean;
}

export interface ProjectConfig {
  // Basic project info
  projectName: string;
  projectType: 'web' | 'mobile' | 'desktop' | 'api' | 'fullstack';
  description: string;

  // PRD
  prd?: {
    content: string;
    problemStatement?: string;
    targetUsers?: string;
    userStories?: string[];
  };

  // Tech stack
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    auth?: string;
    styling?: string;
    stateManagement?: string;
  };

  // Features
  features: Feature[];

  // Project configuration
  timeline: 'mvp' | 'standard' | 'enterprise';
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  deployment: string;

  // Target IDE(s)
  targetIDEs: SupportedIDE[];

  // Extras
  extras: {
    docker?: boolean;
    cicd?: boolean;
    testing?: boolean;
    linting?: boolean;
    examples?: boolean;
    prp?: boolean;
    aiDocs?: boolean;
    claudeCommands?: boolean;
  };

  // PRP specific config
  prpConfig?: {
    type: 'base' | 'planning' | 'spec';
    featureName?: string;
    includeValidation?: boolean;
    includeDiagrams?: boolean;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  complexity: 'simple' | 'medium' | 'complex';
  category: 'auth' | 'ui' | 'data' | 'integration' | 'infrastructure';
  subtasks?: string[];
  dependencies?: string[];
}

export interface TechStackInfo {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'auth' | 'styling';
  docs: string;
  structure?: string;
  dependencies: string[];
  devDependencies?: string[];
  files?: string[];
  folders?: string[];
  // New fields for enhanced tech stack
  lintCommand?: string;
  testCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  gotchas?: string[];
  bestPractices?: string[];
}

export interface Stage {
  name: string;
  duration: string;
  dependencies: string[];
  tasks: Task[];
}

export interface Task {
  description: string;
  subtasks?: string[];
  completed: boolean;
}

// New interfaces for PRP support
export interface ValidationCommand {
  level: 'syntax' | 'test' | 'integration' | 'deployment';
  command: string;
  description?: string;
}

export interface PRPTask {
  name: string;
  action?: 'CREATE' | 'MODIFY' | 'DELETE';
  file?: string;
  steps: string[];
  pseudocode?: string;
}

export interface PRPContext {
  projectName: string;
  featureName: string;
  goal: string;
  reasons: string[];
  description: string;
  successCriteria: string[];
  documentation: Array<{
    type: 'url' | 'file' | 'doc' | 'docfile';
    url: string;
    reason: string;
  }>;
  projectStructure: string;
  desiredStructure: string;
  language: string;
  testLanguage: string;
  gotchas: string[];
  tasks: PRPTask[];
  validationCommands: {
    syntax: string[];
    tests: string[];
    start: string;
    deployment: string[];
  };
  integrationTests: string[];
  expectedResult: string;
  customValidation: string[];
  checklist: string[];
  antiPatterns: string[];

  // Planning-specific fields
  summary?: string;
  architectureDiagram?: string;
  components?: any[];
  dataFlowDiagram?: string;
  decisions?: any[];
  phases?: any[];
  risks?: any[];
  security?: string[];
  performance?: any[];
  monitoring?: any[];
  future?: string[];

  // Spec-specific fields
  version?: string;
  status?: string;
  author?: string;
  date?: string;
  objective?: string;
  inScope?: string[];
  outOfScope?: string[];
  functionalRequirements?: any[];
  nonFunctionalRequirements?: any[];
  endpoints?: any[];
  entities?: any[];
  databaseSchema?: string;
  businessRules?: any[];
  errorScenarios?: any[];
  unitTests?: any[];
  performanceTests?: any[];
  securityRequirements?: any[];
  externalDependencies?: any[];
  libraries?: any[];
  migrationRequired?: boolean;
  migrationSteps?: string[];
  rollbackStrategy?: string;
  openQuestions?: string[];
}

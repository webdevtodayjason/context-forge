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

  // Retrofit mode
  isRetrofit?: boolean;
  plannedFeatures?: string[];

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
    url?: string;
    filename?: string;
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
    logs?: string;
  };
  integrationTests: string[] | any[];
  expectedResult: string;
  customValidation: string[];
  checklist: string[];
  antiPatterns: string[];

  // Enhanced base template fields
  hasAiDocs?: boolean;
  aiDocs?: any[];
  versionNotes?: string[];
  modelPath?: string;
  database?: any[];
  config?: any[];
  routes?: any[];
  environment?: any[];
  testCases?: any[];
  edgeCases?: string[];
  logPath?: string;
  creativeValidation?: any[];
  commonFixes?: {
    syntax: string[];
    tests: string[];
  };

  // Planning-specific fields
  summary?: string;
  executiveSummary?: string;
  problemStatement?: string;
  subProblems?: any[];
  constraints?: any[];
  architectureDiagram?: string;
  components?: any[];
  dataFlowDiagram?: string;
  decisions?: any[];
  phases?: any[];
  phase1Duration?: string;
  phase1Tasks?: string[];
  phase2Duration?: string;
  phase2Tasks?: string[];
  phase3Duration?: string;
  phase3Tasks?: string[];
  risks?: any[];
  expectedUsers?: string;
  expectedRPS?: string;
  dataVolume?: string;
  optimizations?: any[];
  benchmarks?: any[];
  attackVectors?: any[];
  securityMeasures?: string[];
  coverageTarget?: number;
  unitTestAreas?: string[];
  performanceTests?: any[];
  securityTests?: any[];
  metrics?: any[];
  loggingPoints?: any[];
  traces?: string[];
  apiDocFormat?: string;
  apiDocLocation?: string;
  userDocs?: any[];
  devDocs?: any[];
  externalResources?: any[];
  codeExamples?: any[];
  proofOfConcepts?: any[];
  successMetrics?: any[];
  milestones?: any[];
  openQuestions?: any[];
  researchNotes?: string;
  security?: string[];
  performance?: any[];
  monitoring?: any[];
  future?: string[];

  // Additional planning fields used in prp.ts
  technicalDecisions?: any[];
  implementationPhases?: any[];
  securityConsiderations?: any[];
  performanceRequirements?: any[];
  monitoringStrategy?: any[];

  // Spec-specific fields
  version?: string;
  status?: string;
  author?: string;
  date?: string;
  createdDate?: string;
  lastUpdated?: string;
  reviewers?: string;
  objective?: string;
  primaryObjectives?: any[];
  secondaryObjectives?: string[];
  inScope?: string[];
  outOfScope?: string[];
  futureConsiderations?: string[];
  systemContextDiagram?: string;
  componentDiagram?: string;
  techStack?: any[];
  functionalRequirements?: any[];
  nonFunctionalRequirements?: any[];
  nfrs?: any[];
  endpoints?: any[];
  hasGraphQL?: boolean;
  hasWebSocket?: boolean;
  websocketEvents?: any[];
  domainModels?: any[];
  databaseSchema?: string;
  indexes?: any[];
  hasMigration?: boolean;
  migrationScript?: string;
  rollbackScript?: string;
  algorithms?: any[];
  stateDiagram?: string;
  businessRules?: any[];
  integrations?: any[];
  hasMessageQueue?: boolean;
  authMethod?: string;
  roles?: any[];
  resources?: any[];
  securityControls?: any[];
  dataProtection?: any[];
  performanceTargets?: any[];
  cachingLayers?: any[];
  testPyramid?: string;
  unitTestSuites?: any[];
  deploymentDiagram?: string;
  environments?: any[];
  pipelineDiagram?: string;
  pipelineStages?: any[];
  logLevels?: any[];
  healthChecks?: any[];
  dependencies?: any[];
  documentationDeliverables?: any[];
  training?: any[];
  techLead?: string;
  productOwner?: string;
  securityLead?: string;
  architect?: string;
  glossary?: any[];
  references?: any[];
  changelog?: any[];
  entities?: any[];
  errorScenarios?: any[];
  unitTests?: any[];
  securityRequirements?: any[];
  externalDependencies?: any[];
  libraries?: any[];
  migrationRequired?: boolean;
  migrationSteps?: string[];
  rollbackStrategy?: string;

  // Additional spec fields used in prp.ts
  apiEndpoints?: any[];
  dataEntities?: any[];
  unitTestStrategy?: any[];
  integrationTestScenarios?: any[];

  // Task template fields
  taskName?: string;
  taskType?: string;
  priority?: string;
  estimatedTime?: string;
  assignee?: string;
  problemDescription?: string;
  currentBehavior?: string;
  expectedBehavior?: string;
  usersAffected?: string;
  severity?: string;
  businessImpact?: string;
  solutionSummary?: string;
  implementationSteps?: any[];
  keyFiles?: any[];
  patterns?: any[];
  manualTests?: string[];
  syntaxCommand?: string;
  testCommand?: string;
  integrationCommand?: string;
  verificationSteps?: string[];
  rollbackSteps?: string[];
  documentationNeeded?: boolean;
  documentationFiles?: any[];
  changelogEntry?: string;
  relatedItems?: any[];
  notes?: string;
  lintCommand?: string;
  devCommand?: string;
  buildCommand?: string;
}

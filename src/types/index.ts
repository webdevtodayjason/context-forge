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
    hooks?: boolean;
    checkpoints?: boolean;
  };

  // Checkpoint configuration
  checkpointConfig?: CheckpointConfig;

  // PRP specific config
  prpConfig?: {
    type: 'base' | 'planning' | 'spec';
    featureName?: string;
    includeValidation?: boolean;
    includeDiagrams?: boolean;
  };

  // Migration configuration (for retrofit projects)
  migrationConfig?: MigrationConfig;

  // Enhancement configuration (for feature additions)
  enhancementConfig?: EnhancementConfig;
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
  type: 'frontend' | 'backend' | 'database' | 'auth' | 'styling' | 'fullstack';
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
  // Framework detection fields
  version?: string;
  metadata?: {
    confidence: number;
    detectedFrameworks: Array<{
      framework: string;
      version?: string;
      variant?: string;
      confidence: number;
    }>;
  };
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

// Checkpoint System Types
export interface CheckpointConfig {
  enabled: boolean;
  triggers: CheckpointTrigger[];
  customMilestones?: CustomMilestone[];
  notifications?: NotificationConfig;
  customCommands?: CheckpointCommand[];
}

export interface CheckpointTrigger {
  id: string;
  name: string;
  description: string;
  category: 'critical' | 'important' | 'normal';
  autoTrigger: boolean;
  conditions?: string[];
}

export interface CustomMilestone {
  name: string;
  description: string;
  testInstructions: string[];
  verificationPoints: string[];
  triggerAfter?: string[];
  blocksUntilApproved: boolean;
}

export interface NotificationConfig {
  slack?: {
    webhook: string;
    channel: string;
  };
  email?: {
    to: string[];
    template: string;
  };
}

export interface CheckpointCommand {
  name: string;
  category: string;
  description: string;
  template: string;
  triggers: CheckpointTrigger[];
}

// Migration System Types
export interface MigrationConfig {
  strategy: 'big-bang' | 'incremental' | 'parallel-run';
  sourceStack: TechStackInfo;
  targetStack: TechStackInfo;
  sharedResources: SharedResource[];
  migrationPhases: MigrationPhase[];
  rollbackStrategy: RollbackStrategy;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  checkpoints?: MigrationCheckpoint[];
}

export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  criticalCheckpoints: CheckpointTrigger[];
  dependencies: string[];
  rollbackPoint: boolean;
  estimatedDuration: string;
  risks: MigrationRisk[];
  validationCriteria: string[];
}

export interface SharedResource {
  type: 'database' | 'api' | 'auth' | 'storage' | 'cache' | 'queue';
  name: string;
  description: string;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  migrationStrategy: string;
}

export interface RollbackStrategy {
  automatic: boolean;
  triggers: RollbackTrigger[];
  procedures: RollbackProcedure[];
  dataBackupRequired: boolean;
  estimatedTime: string;
}

export interface RollbackTrigger {
  condition: string;
  severity: 'warning' | 'error' | 'critical';
  action: 'alert' | 'pause' | 'rollback';
}

export interface RollbackProcedure {
  phase: string;
  steps: string[];
  verificationPoints: string[];
  estimatedDuration: string;
}

export interface MigrationRisk {
  category: 'data-loss' | 'downtime' | 'compatibility' | 'performance' | 'security';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export interface MigrationCheckpoint {
  phaseId: string;
  name: string;
  description: string;
  validationSteps: string[];
  rollbackEnabled: boolean;
  requiresApproval: boolean;
  automatedTests?: string[];
}

// Enhancement System Types
export interface EnhancementConfig {
  projectName: string;
  existingStack: TechStackInfo;
  features: FeatureRequirement[];
  enhancementPhases: EnhancementPhase[];
  implementationStrategy: 'sequential' | 'parallel' | 'hybrid';
  estimatedDuration: string;
  checkpoints?: EnhancementCheckpoint[];
  validationStrategy: ValidationStrategy;
}

export interface FeatureRequirement {
  id: string;
  name: string;
  description: string;
  category: 'api' | 'ui' | 'database' | 'integration' | 'infrastructure' | 'analytics' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  complexity: 'simple' | 'medium' | 'complex' | 'very-complex';
  dependencies: string[]; // IDs of other features
  acceptanceCriteria: string[];
  technicalRequirements: string[];
  estimatedEffort: string; // e.g., "2-3 days", "1 week"
  risks: FeatureRisk[];
  integrationPoints: IntegrationPoint[];
}

export interface EnhancementPhase {
  id: string;
  name: string;
  description: string;
  features: string[]; // Feature IDs included in this phase
  tasks: ImplementationTask[];
  dependencies: string[]; // Other phase IDs
  checkpoints: CheckpointTrigger[];
  estimatedDuration: string;
  validationCriteria: string[];
  rollbackStrategy?: RollbackStrategy;
  risks?: FeatureRisk[];
}

export interface ImplementationTask {
  id: string;
  name: string;
  description: string;
  type: 'create' | 'modify' | 'refactor' | 'test' | 'document' | 'deploy';
  targetFiles?: string[];
  subtasks: string[];
  estimatedHours: number;
  complexity: 'trivial' | 'simple' | 'medium' | 'complex' | 'very-complex';
  dependencies: string[]; // Other task IDs
  validationSteps: string[];
  aiContext?: string; // Additional context for AI assistance
}

export interface FeatureRisk {
  category: 'technical' | 'integration' | 'performance' | 'security' | 'ux';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation: string;
}

export interface IntegrationPoint {
  component: string;
  type: 'api' | 'database' | 'ui' | 'service' | 'config';
  description: string;
  requiredChanges: string[];
  testingStrategy: string;
}

export interface EnhancementCheckpoint {
  phaseId: string;
  featureId?: string;
  name: string;
  description: string;
  validationSteps: string[];
  automatedTests?: string[];
  requiresReview: boolean;
  reviewers?: string[];
  successCriteria: string[];
}

export interface ValidationStrategy {
  unitTests: boolean;
  integrationTests: boolean;
  e2eTests: boolean;
  performanceTests: boolean;
  securityScans: boolean;
  codeReview: boolean;
  stagingDeployment: boolean;
  userAcceptance: boolean;
}

// Hook System Types
export interface HookTemplate {
  name: string;
  description: string;
  script: string;
  trigger: 'pre-commit' | 'post-commit' | 'pre-push' | 'post-push' | 'custom';
  enabled: boolean;
}

// Export orchestration types
export * from './orchestration';

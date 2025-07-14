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

export interface ProjectConfig extends Record<string, unknown> {
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

// Define specific types for PRPContext array fields
export interface AIDocItem {
  type: 'url' | 'file' | 'doc' | 'docfile';
  url?: string;
  filename?: string;
  reason: string;
  content?: string;
}

export interface DatabaseItem {
  type: 'table' | 'model' | 'migration' | 'seed' | 'index';
  name: string;
  description: string;
  schema?: string;
  relationships?: string[];
}

export interface ConfigItem {
  key: string;
  value: string | number | boolean;
  environment?: string;
  description?: string;
  required?: boolean;
}

export interface RouteItem {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: string[];
  authentication?: boolean;
  responses?: ResponseItem[];
}

export interface ResponseItem {
  status: number;
  description: string;
  schema?: string;
}

export interface EnvironmentItem {
  name: string;
  value: string;
  description?: string;
  required?: boolean;
}

export interface TestCaseItem {
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e';
  file?: string;
  assertions?: string[];
}

export interface ValidationItem {
  type: 'syntax' | 'test' | 'integration' | 'deployment';
  command: string;
  description: string;
  expected?: string;
}

export interface ComponentItem {
  name: string;
  type: 'component' | 'service' | 'utility' | 'hook' | 'store';
  description: string;
  dependencies?: string[];
  props?: string[];
  methods?: string[];
}

export interface DecisionItem {
  title: string;
  description: string;
  options: string[];
  chosen: string;
  rationale: string;
  impact: 'low' | 'medium' | 'high';
}

export interface PhaseItem {
  name: string;
  description: string;
  duration: string;
  tasks: string[];
  dependencies?: string[];
  deliverables?: string[];
}

export interface RiskItem {
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  owner?: string;
}

export interface OptimizationItem {
  area: string;
  description: string;
  technique: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface BenchmarkItem {
  name: string;
  metric: string;
  target: string;
  current?: string;
  tool?: string;
}

export interface AttackVectorItem {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  status: 'open' | 'mitigated' | 'accepted';
}

export interface MetricItem {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  unit?: string;
  tags?: string[];
}

export interface LoggingItem {
  level: 'debug' | 'info' | 'warn' | 'error';
  location: string;
  message: string;
  context?: string[];
}

export interface DocumentationItem {
  title: string;
  type: 'readme' | 'api' | 'guide' | 'reference' | 'tutorial';
  description: string;
  audience: 'user' | 'developer' | 'admin';
  format: 'markdown' | 'html' | 'pdf';
}

export interface CodeExampleItem {
  title: string;
  description: string;
  language: string;
  code: string;
  explanation?: string;
}

export interface MilestoneItem {
  name: string;
  description: string;
  dueDate?: string;
  deliverables: string[];
  criteria: string[];
  dependencies?: string[];
}

export interface TechStackItem {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'testing' | 'monitoring';
  version?: string;
  description: string;
  rationale: string;
  alternatives?: string[];
}

export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  acceptance: string[];
  dependencies?: string[];
}

export interface EndpointItem {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: ParameterItem[];
  requestBody?: SchemaItem;
  responses: ResponseItem[];
  authentication?: boolean;
  rateLimit?: number;
  requestExample?: string;
  responseExample?: string;
  statusCodes?: { code: number; description: string }[];
}

export interface ParameterItem {
  name: string;
  type: 'query' | 'path' | 'header' | 'cookie';
  dataType: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface SchemaItem {
  type: string;
  properties?: Record<string, PropertyItem>;
  required?: string[];
  example?: unknown;
}

export interface PropertyItem {
  type: string;
  description?: string;
  format?: string;
  enum?: string[];
  example?: unknown;
}

export interface EntityItem {
  name: string;
  description: string;
  attributes: AttributeItem[];
  relationships?: RelationshipItem[];
  constraints?: string[];
}

export interface AttributeItem {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  constraints?: string[];
}

export interface RelationshipItem {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  entity: string;
  description: string;
  foreignKey?: string;
}

export interface CheckpointItem {
  phaseId: string;
  name: string;
  description: string;
  validationSteps: string[];
  dependencies?: string[];
  estimatedTime?: string;
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
  integrationTests: TestCaseItem[];
  expectedResult: string;
  customValidation: string[];
  checklist: string[];
  antiPatterns: string[];

  // Enhanced base template fields
  hasAiDocs?: boolean;
  aiDocs?: AIDocItem[];
  versionNotes?: string[];
  modelPath?: string;
  database?: DatabaseItem[];
  config?: ConfigItem[];
  routes?: RouteItem[];
  environment?: EnvironmentItem[];
  testCases?: TestCaseItem[];
  edgeCases?: string[];
  logPath?: string;
  creativeValidation?: ValidationItem[];
  commonFixes?: {
    syntax: string[];
    tests: string[];
  };

  // Planning-specific fields
  summary?: string;
  executiveSummary?: string;
  problemStatement?: string;
  subProblems?: string[];
  constraints?: string[];
  architectureDiagram?: string;
  components?: ComponentItem[];
  dataFlowDiagram?: string;
  decisions?: DecisionItem[];
  phases?: PhaseItem[];
  phase1Duration?: string;
  phase1Tasks?: string[];
  phase2Duration?: string;
  phase2Tasks?: string[];
  phase3Duration?: string;
  phase3Tasks?: string[];
  risks?: RiskItem[];
  expectedUsers?: string;
  expectedRPS?: string;
  dataVolume?: string;
  optimizations?: OptimizationItem[];
  benchmarks?: BenchmarkItem[];
  attackVectors?: AttackVectorItem[];
  securityMeasures?: string[];
  coverageTarget?: number;
  unitTestAreas?: string[];
  performanceTests?: TestCaseItem[];
  securityTests?: TestCaseItem[];
  metrics?: MetricItem[];
  loggingPoints?: LoggingItem[];
  traces?: string[];
  apiDocFormat?: string;
  apiDocLocation?: string;
  userDocs?: DocumentationItem[];
  devDocs?: DocumentationItem[];
  externalResources?: DocumentationItem[];
  codeExamples?: CodeExampleItem[];
  proofOfConcepts?: CodeExampleItem[];
  successMetrics?: MetricItem[];
  milestones?: MilestoneItem[];
  openQuestions?: string[];
  researchNotes?: string;
  security?: string[];
  performance?: MetricItem[];
  monitoring?: MetricItem[];
  future?: string[];

  // Additional planning fields used in prp.ts
  technicalDecisions?: DecisionItem[];
  implementationPhases?: PhaseItem[];
  securityConsiderations?: string[];
  performanceRequirements?: RequirementItem[];
  monitoringStrategy?: MetricItem[];

  // Spec-specific fields
  version?: string;
  status?: string;
  author?: string;
  date?: string;
  createdDate?: string;
  lastUpdated?: string;
  reviewers?: string;
  objective?: string;
  primaryObjectives?: string[];
  secondaryObjectives?: string[];
  inScope?: string[];
  outOfScope?: string[];
  futureConsiderations?: string[];
  systemContextDiagram?: string;
  componentDiagram?: string;
  techStack?: TechStackItem[];
  functionalRequirements?: RequirementItem[];
  nonFunctionalRequirements?: RequirementItem[];
  nfrs?: RequirementItem[];
  endpoints?: EndpointItem[];
  hasGraphQL?: boolean;
  hasWebSocket?: boolean;
  websocketEvents?: RouteItem[];
  domainModels?: EntityItem[];
  databaseSchema?: string;
  indexes?: string[];
  hasMigration?: boolean;
  migrationScript?: string;
  rollbackScript?: string;
  algorithms?: string[];
  stateDiagram?: string;
  businessRules?: string[];
  integrations?: string[];
  hasMessageQueue?: boolean;
  authMethod?: string;
  roles?: string[];
  resources?: string[];
  securityControls?: string[];
  dataProtection?: string[];
  performanceTargets?: string[];
  cachingLayers?: string[];
  testPyramid?: string;
  unitTestSuites?: TestCaseItem[];
  deploymentDiagram?: string;
  environments?: EnvironmentItem[];
  pipelineDiagram?: string;
  pipelineStages?: string[];
  logLevels?: string[];
  healthChecks?: string[];
  dependencies?: string[];
  documentationDeliverables?: DocumentationItem[];
  training?: DocumentationItem[];
  techLead?: string;
  productOwner?: string;
  securityLead?: string;
  architect?: string;
  glossary?: string[];
  references?: string[];
  changelog?: string[];
  entities?: EntityItem[];
  errorScenarios?: TestCaseItem[];
  unitTests?: TestCaseItem[];
  securityRequirements?: RequirementItem[];
  externalDependencies?: string[];
  libraries?: string[];
  migrationRequired?: boolean;
  migrationSteps?: string[];
  rollbackStrategy?: string;

  // Additional spec fields used in prp.ts
  apiEndpoints?: EndpointItem[];
  dataEntities?: EntityItem[];
  unitTestStrategy?: string[];
  integrationTestScenarios?: TestCaseItem[];

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
  implementationSteps?: string[];
  keyFiles?: string[];
  patterns?: string[];
  manualTests?: string[];
  syntaxCommand?: string;
  testCommand?: string;
  integrationCommand?: string;
  verificationSteps?: string[];
  rollbackSteps?: string[];
  documentationNeeded?: boolean;
  documentationFiles?: DocumentationItem[];
  changelogEntry?: string;
  relatedItems?: string[];
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

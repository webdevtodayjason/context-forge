// Orchestration System Types for Autonomous AI Agent Management
export type AgentRole =
  | 'orchestrator'
  | 'project-manager'
  | 'developer'
  | 'qa-engineer'
  | 'devops'
  | 'code-reviewer'
  | 'researcher'
  | 'documentation-writer';

export type OrchestrationStrategy =
  | 'big-bang' // Deploy all agents at once
  | 'phased' // Deploy agents in phases
  | 'adaptive'; // Adjust team size based on workload

export type CommunicationModel =
  | 'hub-and-spoke' // All communication through PM
  | 'hierarchical' // Follow org chart
  | 'mesh'; // Direct communication allowed

export interface OrchestrationConfig {
  projectName: string;
  strategy: OrchestrationStrategy;
  communicationModel: CommunicationModel;
  gitDiscipline: GitDisciplineConfig;
  teamStructure: TeamStructure;
  phases?: OrchestrationPhase[];
  checkpoints?: OrchestrationCheckpoint[];
  selfScheduling: SelfSchedulingConfig;
  maxAgents?: number;
  estimatedDuration?: string;
}

export interface GitDisciplineConfig {
  enabled: boolean;
  autoCommitInterval: number; // minutes
  branchingStrategy: 'feature' | 'gitflow' | 'trunk';
  commitMessageFormat: string; // Template for commit messages
  tagStrategy?: 'stable' | 'version' | 'milestone';
  requireTests: boolean;
  requireReview: boolean;
}

export interface TeamStructure {
  orchestrator: AgentConfig;
  projectManagers: AgentConfig[];
  developers: AgentConfig[];
  qaEngineers?: AgentConfig[];
  devops?: AgentConfig[];
  codeReviewers?: AgentConfig[];
  researchers?: AgentConfig[];
  documentationWriters?: AgentConfig[];
}

export interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  briefing: string;
  responsibilities: string[];
  reportingTo?: string; // ID of supervising agent
  skillset?: string[];
  focusAreas?: string[];
  constraints?: string[];
}

export interface AgentSession {
  agentId: string;
  sessionName: string;
  windowIndex: number;
  windowName: string;
  status: 'active' | 'idle' | 'blocked' | 'completed' | 'error';
  startTime: Date;
  lastActivity: Date;
  currentTask?: string;
  completedTasks: number;
  gitCommits: number;
  messagesExchanged: number;
}

export interface OrchestrationPhase {
  id: string;
  name: string;
  description: string;
  agents: string[]; // Agent IDs involved in this phase
  tasks: OrchestrationTask[];
  dependencies?: string[]; // Other phase IDs
  estimatedDuration: string;
  completionCriteria: string[];
  rollbackStrategy?: string;
}

export interface OrchestrationTask {
  id: string;
  name: string;
  description: string;
  assignedTo: string[]; // Agent IDs
  type: 'development' | 'testing' | 'review' | 'deployment' | 'documentation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies?: string[]; // Other task IDs
  completionCriteria: string[];
  prpReference?: string; // Reference to PRP document
}

export interface SelfSchedulingConfig {
  enabled: boolean;
  defaultCheckInterval: number; // minutes
  adaptiveScheduling: boolean; // Adjust based on workload
  maxCheckInterval: number; // minutes
  minCheckInterval: number; // minutes
  scheduleScript?: string; // Path to custom scheduling script
  recoveryStrategy: 'restart' | 'resume' | 'escalate';
}

export interface OrchestrationCheckpoint {
  phaseId: string;
  name: string;
  description: string;
  validationCriteria: string[];
  automatedChecks?: string[]; // Commands to run
  requiresHumanApproval: boolean;
  rollbackEnabled: boolean;
  successMetrics?: OrchestrationMetric[];
}

export interface OrchestrationMetric {
  name: string;
  type: 'count' | 'percentage' | 'time' | 'boolean';
  target: number | boolean;
  current?: number | boolean;
  unit?: string;
}

export interface AgentMessage {
  id: string;
  timestamp: Date;
  fromAgent: string;
  toAgent: string;
  type:
    | 'status'
    | 'task'
    | 'question'
    | 'escalation'
    | 'completion'
    | 'status-update'
    | 'task-completed'
    | 'task-blocked'
    | 'code-review-request'
    | 'deployment-request';
  content: string;
  metadata?: Record<string, any>;
  requiresResponse?: boolean;
  parentMessageId?: string;
}

export interface OrchestrationStatus {
  id: string;
  projectName: string;
  startTime: Date;
  endTime?: Date;
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'error';
  currentPhase?: string;
  completedPhases: string[];
  activeAgents: AgentSession[];
  metrics: OrchestrationSummaryMetrics;
  lastUpdate: Date;
  estimatedCompletion?: Date;
}

export interface OrchestrationSummaryMetrics {
  totalAgents: number;
  activeAgents: number;
  tasksCompleted: number;
  tasksPending: number;
  gitCommits: number;
  linesOfCodeWritten: number;
  testsWritten: number;
  testsPassing: number;
  blockers: number;
  uptime: string; // Duration format
}

export interface TmuxWindowConfig {
  sessionName: string;
  windowIndex: number;
  windowName: string;
  workingDirectory: string;
  command?: string; // Initial command to run
  environment?: Record<string, string>;
}

export interface AgentBriefing {
  agentId: string;
  role: AgentRole;
  projectContext: string;
  objectives: string[];
  constraints: string[];
  communicationProtocol: string;
  gitInstructions: string;
  schedulingInstructions: string;
  escalationCriteria: string[];
  successCriteria: string[];
  resources: string[]; // URLs, docs, PRPs
}

export interface OrchestrationError {
  timestamp: Date;
  agentId?: string;
  phase?: string;
  type:
    | 'agent-crash'
    | 'communication'
    | 'git'
    | 'scheduling'
    | 'validation'
    | 'escalation'
    | 'task-blocked'
    | 'code-quality';
  message: string;
  severity: 'warning' | 'error' | 'critical';
  recovery?: string; // Recovery action taken
  requiresIntervention: boolean;
}

export interface AgentPerformance {
  agentId: string;
  period: 'hour' | 'day' | 'week' | 'total';
  tasksCompleted: number;
  avgTaskTime: number; // minutes
  commitFrequency: number; // commits per hour
  codeQuality: number; // 0-100 score
  communicationScore: number; // 0-100 score
  blockerRate: number; // blockers per task
  errorRate: number; // errors per task
}

// Re-export for convenience
export interface OrchestrationContext {
  config: OrchestrationConfig;
  status: OrchestrationStatus;
  agents: Map<string, AgentSession>;
  messages: AgentMessage[];
  errors: OrchestrationError[];
  performance: Map<string, AgentPerformance>;
}

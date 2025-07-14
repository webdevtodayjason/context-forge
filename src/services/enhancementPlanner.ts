import {
  EnhancementConfig,
  EnhancementPhase,
  ImplementationTask,
  FeatureRequirement,
  CheckpointTrigger,
  RollbackStrategy,
  CheckpointItem,
} from '../types';
import { BasicAnalysis } from './projectAnalyzer';

export class EnhancementPlanner {
  private projectPath: string;
  private config: EnhancementConfig;

  constructor(projectPath: string, config: EnhancementConfig) {
    this.projectPath = projectPath;
    this.config = config;
  }

  async createPlan(basicAnalysis: BasicAnalysis): Promise<EnhancementConfig> {
    // Sort features by dependencies and priority
    const sortedFeatures = this.topologicalSort(this.config.features);

    // Create phases based on implementation strategy
    const phases = await this.createPhases(sortedFeatures, basicAnalysis);

    // Add checkpoints
    const checkpoints = this.generateCheckpoints(phases);

    // Update config with generated plan
    return {
      ...this.config,
      enhancementPhases: phases,
      checkpoints: checkpoints as EnhancementConfig['checkpoints'], // Type conversion needed due to interface mismatch
      estimatedDuration: this.calculateTotalDuration(phases),
    };
  }

  private topologicalSort(features: FeatureRequirement[]): FeatureRequirement[] {
    const sorted: FeatureRequirement[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (featureId: string) => {
      if (visited.has(featureId)) return;
      if (visiting.has(featureId)) {
        throw new Error(`Circular dependency detected involving feature: ${featureId}`);
      }

      visiting.add(featureId);
      const feature = features.find((f) => f.id === featureId);
      if (!feature) return;

      // Visit dependencies first
      for (const depId of feature.dependencies) {
        visit(depId);
      }

      visiting.delete(featureId);
      visited.add(featureId);
      sorted.push(feature);
    };

    // Visit all features
    features.forEach((feature) => visit(feature.id));

    return sorted;
  }

  private async createPhases(
    sortedFeatures: FeatureRequirement[],
    basicAnalysis: BasicAnalysis
  ): Promise<EnhancementPhase[]> {
    const phases: EnhancementPhase[] = [];

    switch (this.config.implementationStrategy) {
      case 'sequential':
        phases.push(...this.createSequentialPhases(sortedFeatures));
        break;
      case 'parallel':
        phases.push(...this.createParallelPhases(sortedFeatures));
        break;
      case 'hybrid':
        phases.push(...this.createHybridPhases(sortedFeatures));
        break;
    }

    // Add setup phase if needed
    if (this.needsSetupPhase(sortedFeatures)) {
      phases.unshift(this.createSetupPhase(sortedFeatures));
    }

    // Add deployment phase
    phases.push(this.createDeploymentPhase(sortedFeatures));

    return phases;
  }

  private createSequentialPhases(features: FeatureRequirement[]): EnhancementPhase[] {
    return features.map((feature, index) => {
      const tasks = this.generateFeatureTasks(feature);

      return {
        id: `phase-${index + 1}`,
        name: `Implement ${feature.name}`,
        description: `Complete implementation of ${feature.name} feature`,
        features: [feature.id],
        tasks,
        dependencies: index > 0 ? [`phase-${index}`] : [],
        checkpoints: this.generateFeatureCheckpoints(feature),
        estimatedDuration: feature.estimatedEffort,
        validationCriteria: [
          ...feature.acceptanceCriteria,
          'All tests passing',
          'Code review completed',
          'Documentation updated',
        ],
        rollbackStrategy: this.generateRollbackStrategy(feature),
      };
    });
  }

  private createParallelPhases(features: FeatureRequirement[]): EnhancementPhase[] {
    // Group features that can be done in parallel
    const groups: FeatureRequirement[][] = [];
    const assigned = new Set<string>();

    features.forEach((feature) => {
      if (assigned.has(feature.id)) return;

      // Find features that can be done in parallel with this one
      const group = [feature];
      assigned.add(feature.id);

      features.forEach((otherFeature) => {
        if (
          !assigned.has(otherFeature.id) &&
          !this.haveDependencyConflict(feature, otherFeature, features)
        ) {
          group.push(otherFeature);
          assigned.add(otherFeature.id);
        }
      });

      groups.push(group);
    });

    return groups.map((group, index) => {
      const tasks = group.flatMap((feature) => this.generateFeatureTasks(feature));

      return {
        id: `phase-${index + 1}`,
        name: `Parallel Implementation: ${group.map((f) => f.name).join(', ')}`,
        description: `Implement ${group.length} features in parallel`,
        features: group.map((f) => f.id),
        tasks,
        dependencies: index > 0 ? [`phase-${index}`] : [],
        checkpoints: group.flatMap((f) => this.generateFeatureCheckpoints(f)),
        estimatedDuration: this.calculateParallelDuration(group),
        validationCriteria: group.flatMap((f) => f.acceptanceCriteria),
        rollbackStrategy: this.generateMultiFeatureRollback(group),
      };
    });
  }

  private createHybridPhases(features: FeatureRequirement[]): EnhancementPhase[] {
    const phases: EnhancementPhase[] = [];
    const processed = new Set<string>();

    // First, handle critical and high priority features sequentially
    const criticalFeatures = features.filter(
      (f) => (f.priority === 'critical' || f.priority === 'high') && !processed.has(f.id)
    );

    criticalFeatures.forEach((feature) => {
      phases.push({
        id: `phase-${phases.length + 1}`,
        name: `Critical: ${feature.name}`,
        description: `Implement critical feature: ${feature.name}`,
        features: [feature.id],
        tasks: this.generateFeatureTasks(feature),
        dependencies: phases.length > 0 ? [`phase-${phases.length}`] : [],
        checkpoints: this.generateFeatureCheckpoints(feature),
        estimatedDuration: feature.estimatedEffort,
        validationCriteria: feature.acceptanceCriteria,
        rollbackStrategy: this.generateRollbackStrategy(feature),
      });
      processed.add(feature.id);
    });

    // Then, group remaining features for parallel execution
    const remainingFeatures = features.filter((f) => !processed.has(f.id));
    if (remainingFeatures.length > 0) {
      const parallelPhases = this.createParallelPhases(remainingFeatures);
      parallelPhases.forEach((phase) => {
        phase.id = `phase-${phases.length + 1}`;
        phase.dependencies = phases.length > 0 ? [`phase-${phases.length}`] : [];
        phases.push(phase);
      });
    }

    return phases;
  }

  private needsSetupPhase(features: FeatureRequirement[]): boolean {
    // Check if any features require infrastructure setup
    return features.some(
      (f) =>
        f.category === 'infrastructure' ||
        f.technicalRequirements.some(
          (req) =>
            req.toLowerCase().includes('setup') ||
            req.toLowerCase().includes('install') ||
            req.toLowerCase().includes('configure')
        )
    );
  }

  private createSetupPhase(features: FeatureRequirement[]): EnhancementPhase {
    const setupTasks: ImplementationTask[] = [
      {
        id: 'setup-1',
        name: 'Environment Setup',
        description: 'Configure development environment for new features',
        type: 'create',
        subtasks: [
          'Install required dependencies',
          'Configure environment variables',
          'Set up development tools',
        ],
        estimatedHours: 2,
        complexity: 'simple',
        dependencies: [],
        validationSteps: ['Dependencies installed', 'Environment configured'],
      },
      {
        id: 'setup-2',
        name: 'Project Structure',
        description: 'Create necessary directories and base files',
        type: 'create',
        subtasks: [
          'Create feature directories',
          'Set up configuration files',
          'Initialize testing structure',
        ],
        estimatedHours: 1,
        complexity: 'trivial',
        dependencies: ['setup-1'],
        validationSteps: ['Directory structure created', 'Base files in place'],
      },
    ];

    return {
      id: 'phase-setup',
      name: 'Environment Setup',
      description: 'Prepare project for feature implementation',
      features: [],
      tasks: setupTasks,
      dependencies: [],
      checkpoints: [
        {
          id: 'setup-complete',
          name: 'Setup Complete',
          description: 'Verify environment is ready for development',
          category: 'important',
          autoTrigger: false,
          conditions: ['setup', 'complete', 'verified'],
        },
      ],
      estimatedDuration: '1 day',
      validationCriteria: [
        'All dependencies installed',
        'Development environment functional',
        'Testing framework ready',
      ],
    };
  }

  private createDeploymentPhase(features: FeatureRequirement[]): EnhancementPhase {
    const deploymentTasks: ImplementationTask[] = [
      {
        id: 'deploy-1',
        name: 'Integration Testing',
        description: 'Run comprehensive integration tests',
        type: 'test',
        subtasks: [
          'Run all feature tests',
          'Perform integration tests',
          'Check performance benchmarks',
        ],
        estimatedHours: 4,
        complexity: 'medium',
        dependencies: [],
        validationSteps: ['All tests passing', 'Performance acceptable'],
      },
      {
        id: 'deploy-2',
        name: 'Documentation Update',
        description: 'Update all documentation for new features',
        type: 'document',
        subtasks: [
          'Update API documentation',
          'Update user guides',
          'Update technical documentation',
        ],
        estimatedHours: 3,
        complexity: 'simple',
        dependencies: ['deploy-1'],
        validationSteps: ['Documentation complete', 'Examples provided'],
      },
      {
        id: 'deploy-3',
        name: 'Deployment',
        description: 'Deploy features to production',
        type: 'deploy',
        subtasks: [
          'Prepare deployment package',
          'Deploy to staging',
          'Verify staging deployment',
          'Deploy to production',
        ],
        estimatedHours: 4,
        complexity: 'medium',
        dependencies: ['deploy-2'],
        validationSteps: ['Staging verified', 'Production deployed'],
      },
    ];

    return {
      id: 'phase-deployment',
      name: 'Testing and Deployment',
      description: 'Final testing and deployment of all features',
      features: features.map((f) => f.id),
      tasks: deploymentTasks,
      dependencies: [], // Will be set based on previous phases
      checkpoints: [
        {
          id: 'pre-deployment',
          name: 'Pre-Deployment Check',
          description: 'Final verification before deployment',
          category: 'critical',
          autoTrigger: false,
          conditions: ['deployment', 'ready', 'approved'],
        },
      ],
      estimatedDuration: '2-3 days',
      validationCriteria: [
        'All features tested',
        'Documentation complete',
        'Performance verified',
        'Security checked',
      ],
    };
  }

  private generateFeatureTasks(feature: FeatureRequirement): ImplementationTask[] {
    const tasks: ImplementationTask[] = [];

    // Planning task
    tasks.push({
      id: `${feature.id}-plan`,
      name: `Plan ${feature.name} Implementation`,
      description: `Detailed planning and design for ${feature.name}`,
      type: 'document',
      subtasks: [
        'Review requirements',
        'Design technical approach',
        'Identify integration points',
        'Plan testing strategy',
      ],
      estimatedHours: feature.complexity === 'simple' ? 2 : 4,
      complexity: 'simple',
      dependencies: [],
      validationSteps: ['Design reviewed', 'Approach approved'],
      aiContext: `Feature: ${feature.name}\nDescription: ${feature.description}\nRequirements: ${feature.technicalRequirements.join(', ')}`,
    });

    // Implementation tasks based on category
    switch (feature.category) {
      case 'api':
        tasks.push(...this.generateApiTasks(feature));
        break;
      case 'ui':
        tasks.push(...this.generateUiTasks(feature));
        break;
      case 'database':
        tasks.push(...this.generateDatabaseTasks(feature));
        break;
      case 'integration':
        tasks.push(...this.generateIntegrationTasks(feature));
        break;
      default:
        tasks.push(...this.generateGenericTasks(feature));
    }

    // Testing task
    tasks.push({
      id: `${feature.id}-test`,
      name: `Test ${feature.name}`,
      description: `Comprehensive testing of ${feature.name}`,
      type: 'test',
      subtasks: [
        'Write unit tests',
        'Write integration tests',
        'Perform manual testing',
        'Fix any issues found',
      ],
      estimatedHours: this.estimateTestingHours(feature),
      complexity: feature.complexity === 'simple' ? 'simple' : 'medium',
      dependencies: tasks.map((t) => t.id),
      validationSteps: ['All tests passing', 'Coverage adequate'],
    });

    return tasks;
  }

  private generateApiTasks(feature: FeatureRequirement): ImplementationTask[] {
    return [
      {
        id: `${feature.id}-api-routes`,
        name: 'Create API Routes',
        description: `Implement API endpoints for ${feature.name}`,
        type: 'create',
        targetFiles: ['routes/', 'api/'],
        subtasks: [
          'Define route structure',
          'Implement endpoint handlers',
          'Add request validation',
          'Add error handling',
        ],
        estimatedHours: this.estimateApiHours(feature),
        complexity: feature.complexity,
        dependencies: [`${feature.id}-plan`],
        validationSteps: ['Routes accessible', 'Validation working'],
      },
      {
        id: `${feature.id}-api-logic`,
        name: 'Implement Business Logic',
        description: `Core logic implementation for ${feature.name}`,
        type: 'create',
        targetFiles: ['services/', 'controllers/'],
        subtasks: [
          'Implement service layer',
          'Add data processing',
          'Implement business rules',
          'Add logging',
        ],
        estimatedHours: this.estimateLogicHours(feature),
        complexity: feature.complexity,
        dependencies: [`${feature.id}-api-routes`],
        validationSteps: ['Logic implemented', 'Business rules enforced'],
      },
    ];
  }

  private generateUiTasks(feature: FeatureRequirement): ImplementationTask[] {
    return [
      {
        id: `${feature.id}-ui-components`,
        name: 'Create UI Components',
        description: `Build UI components for ${feature.name}`,
        type: 'create',
        targetFiles: ['components/', 'src/components/'],
        subtasks: [
          'Create component structure',
          'Implement component logic',
          'Add styling',
          'Handle user interactions',
        ],
        estimatedHours: this.estimateUiHours(feature),
        complexity: feature.complexity,
        dependencies: [`${feature.id}-plan`],
        validationSteps: ['Components render', 'Interactions work'],
      },
      {
        id: `${feature.id}-ui-integration`,
        name: 'Integrate with Application',
        description: `Integrate ${feature.name} into the application`,
        type: 'modify',
        subtasks: [
          'Add routing',
          'Connect to state management',
          'Integrate with API',
          'Update navigation',
        ],
        estimatedHours: Math.ceil(this.estimateUiHours(feature) * 0.5),
        complexity: 'medium',
        dependencies: [`${feature.id}-ui-components`],
        validationSteps: ['Integration complete', 'Feature accessible'],
      },
    ];
  }

  private generateDatabaseTasks(feature: FeatureRequirement): ImplementationTask[] {
    return [
      {
        id: `${feature.id}-db-schema`,
        name: 'Design Database Schema',
        description: `Create database schema for ${feature.name}`,
        type: 'create',
        targetFiles: ['models/', 'migrations/', 'schemas/'],
        subtasks: [
          'Design data models',
          'Create migrations',
          'Define relationships',
          'Add indexes',
        ],
        estimatedHours: this.estimateDatabaseHours(feature),
        complexity: feature.complexity,
        dependencies: [`${feature.id}-plan`],
        validationSteps: ['Schema created', 'Migrations run successfully'],
      },
      {
        id: `${feature.id}-db-access`,
        name: 'Implement Data Access',
        description: `Create data access layer for ${feature.name}`,
        type: 'create',
        targetFiles: ['repositories/', 'dao/'],
        subtasks: [
          'Create repository methods',
          'Implement queries',
          'Add data validation',
          'Optimize performance',
        ],
        estimatedHours: Math.ceil(this.estimateDatabaseHours(feature) * 0.7),
        complexity: 'medium',
        dependencies: [`${feature.id}-db-schema`],
        validationSteps: ['Data access working', 'Queries optimized'],
      },
    ];
  }

  private generateIntegrationTasks(feature: FeatureRequirement): ImplementationTask[] {
    return [
      {
        id: `${feature.id}-integration-setup`,
        name: 'Set Up Integration',
        description: `Configure integration for ${feature.name}`,
        type: 'create',
        targetFiles: ['integrations/', 'services/'],
        subtasks: [
          'Configure credentials',
          'Set up connection',
          'Create integration client',
          'Add error handling',
        ],
        estimatedHours: 4,
        complexity: 'medium',
        dependencies: [`${feature.id}-plan`],
        validationSteps: ['Connection established', 'Authentication working'],
      },
      {
        id: `${feature.id}-integration-impl`,
        name: 'Implement Integration Logic',
        description: `Implement integration features for ${feature.name}`,
        type: 'create',
        subtasks: [
          'Implement API calls',
          'Add data transformation',
          'Handle responses',
          'Add retry logic',
        ],
        estimatedHours: this.estimateIntegrationHours(feature),
        complexity: feature.complexity,
        dependencies: [`${feature.id}-integration-setup`],
        validationSteps: ['Integration functional', 'Error handling tested'],
      },
    ];
  }

  private generateGenericTasks(feature: FeatureRequirement): ImplementationTask[] {
    return [
      {
        id: `${feature.id}-implementation`,
        name: `Implement ${feature.name}`,
        description: `Core implementation of ${feature.name}`,
        type: 'create',
        subtasks: feature.technicalRequirements,
        estimatedHours: this.estimateGenericHours(feature),
        complexity: feature.complexity,
        dependencies: [`${feature.id}-plan`],
        validationSteps: feature.acceptanceCriteria,
      },
    ];
  }

  private generateFeatureCheckpoints(feature: FeatureRequirement): CheckpointTrigger[] {
    const checkpoints: CheckpointTrigger[] = [];

    // Add critical checkpoints for high-risk features
    if (feature.priority === 'critical' || feature.complexity === 'very-complex') {
      checkpoints.push({
        id: `${feature.id}-review`,
        name: `${feature.name} Review`,
        description: `Technical review of ${feature.name} implementation`,
        category: 'critical',
        autoTrigger: false,
        conditions: ['implementation', 'complete', 'review'],
      });
    }

    // Add validation checkpoint
    checkpoints.push({
      id: `${feature.id}-validation`,
      name: `${feature.name} Validation`,
      description: `Validate ${feature.name} meets all requirements`,
      category: 'important',
      autoTrigger: true,
      conditions: ['tests', 'passing', 'criteria', 'met'],
    });

    return checkpoints;
  }

  private generateRollbackStrategy(feature: FeatureRequirement): RollbackStrategy {
    return {
      automatic: false,
      triggers: [
        {
          condition: `Critical failure in ${feature.name}`,
          severity: 'critical',
          action: 'rollback',
        },
        {
          condition: 'Tests failing after implementation',
          severity: 'error',
          action: 'pause',
        },
      ],
      procedures: [
        {
          phase: feature.id,
          steps: [
            'Stop all services',
            `Revert ${feature.name} changes`,
            'Restore previous state',
            'Run verification tests',
          ],
          verificationPoints: [
            'Previous functionality restored',
            'No regression issues',
            'System stable',
          ],
          estimatedDuration: '30-60 minutes',
        },
      ],
      dataBackupRequired: feature.category === 'database',
      estimatedTime: '1 hour',
    };
  }

  private generateMultiFeatureRollback(features: FeatureRequirement[]): RollbackStrategy {
    return {
      automatic: false,
      triggers: features.flatMap((f) => [
        {
          condition: `Critical failure in ${f.name}`,
          severity: 'critical' as const,
          action: 'rollback' as const,
        },
      ]),
      procedures: features.map((f) => ({
        phase: f.id,
        steps: ['Stop affected services', `Rollback ${f.name}`, 'Verify rollback'],
        verificationPoints: ['Feature removed', 'System stable'],
        estimatedDuration: '30 minutes',
      })),
      dataBackupRequired: features.some((f) => f.category === 'database'),
      estimatedTime: `${features.length} hours`,
    };
  }

  private generateCheckpoints(phases: EnhancementPhase[]): CheckpointItem[] {
    return phases.flatMap((phase) =>
      phase.checkpoints.map((checkpoint) => ({
        phaseId: phase.id,
        name: checkpoint.name,
        description: checkpoint.description,
        validationSteps: phase.validationCriteria,
      }))
    );
  }

  private haveDependencyConflict(
    feature1: FeatureRequirement,
    feature2: FeatureRequirement,
    allFeatures: FeatureRequirement[]
  ): boolean {
    // Check direct dependencies
    if (
      feature1.dependencies.includes(feature2.id) ||
      feature2.dependencies.includes(feature1.id)
    ) {
      return true;
    }

    // Check transitive dependencies
    const getDependencyChain = (featureId: string): Set<string> => {
      const chain = new Set<string>();
      const toVisit = [featureId];

      while (toVisit.length > 0) {
        const current = toVisit.pop()!;
        if (chain.has(current)) continue;
        chain.add(current);

        const feature = allFeatures.find((f) => f.id === current);
        if (feature) {
          toVisit.push(...feature.dependencies);
        }
      }

      return chain;
    };

    const chain1 = getDependencyChain(feature1.id);
    const chain2 = getDependencyChain(feature2.id);

    return chain1.has(feature2.id) || chain2.has(feature1.id);
  }

  private calculateParallelDuration(features: FeatureRequirement[]): string {
    // Duration is the max of all features
    const durations = features.map((f) => this.parseDuration(f.estimatedEffort));
    const maxDays = Math.max(...durations);

    if (maxDays < 5) return `${maxDays} days`;
    if (maxDays < 20) return `${Math.ceil(maxDays / 5)} weeks`;
    return `${Math.ceil(maxDays / 20)} months`;
  }

  private calculateTotalDuration(phases: EnhancementPhase[]): string {
    let totalDays = 0;

    // For sequential parts, add durations
    // For parallel parts, take the max
    phases.forEach((phase) => {
      const days = this.parseDuration(phase.estimatedDuration);
      totalDays += days;
    });

    // Add buffer for integration and unexpected issues
    totalDays *= 1.2;

    if (totalDays < 5) return `${Math.ceil(totalDays)} days`;
    if (totalDays < 20) return `${Math.ceil(totalDays / 5)} weeks`;
    return `${Math.ceil(totalDays / 20)} months`;
  }

  private parseDuration(duration: string): number {
    const lower = duration.toLowerCase();

    if (lower.includes('hour')) {
      return 0.5;
    } else if (lower.includes('day')) {
      const match = lower.match(/(\d+)(?:-(\d+))?\s*days?/);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return (min + max) / 2;
      }
      return 1;
    } else if (lower.includes('week')) {
      const match = lower.match(/(\d+)(?:-(\d+))?\s*weeks?/);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return ((min + max) / 2) * 5;
      }
      return 5;
    } else if (lower.includes('month')) {
      const match = lower.match(/(\d+)(?:-(\d+))?\s*months?/);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return ((min + max) / 2) * 20;
      }
      return 20;
    }

    return 3; // Default to 3 days
  }

  // Estimation methods
  private estimateTestingHours(feature: FeatureRequirement): number {
    const base = {
      simple: 2,
      medium: 4,
      complex: 8,
      'very-complex': 16,
    }[feature.complexity];

    return base + feature.integrationPoints.length;
  }

  private estimateApiHours(feature: FeatureRequirement): number {
    const base = {
      simple: 4,
      medium: 8,
      complex: 16,
      'very-complex': 32,
    }[feature.complexity];

    return base;
  }

  private estimateLogicHours(feature: FeatureRequirement): number {
    const base = {
      simple: 3,
      medium: 8,
      complex: 16,
      'very-complex': 24,
    }[feature.complexity];

    return base + feature.technicalRequirements.length * 0.5;
  }

  private estimateUiHours(feature: FeatureRequirement): number {
    const base = {
      simple: 4,
      medium: 12,
      complex: 24,
      'very-complex': 40,
    }[feature.complexity];

    return base;
  }

  private estimateDatabaseHours(feature: FeatureRequirement): number {
    const base = {
      simple: 3,
      medium: 6,
      complex: 12,
      'very-complex': 20,
    }[feature.complexity];

    return base;
  }

  private estimateIntegrationHours(feature: FeatureRequirement): number {
    const base = {
      simple: 6,
      medium: 12,
      complex: 24,
      'very-complex': 40,
    }[feature.complexity];

    return base;
  }

  private estimateGenericHours(feature: FeatureRequirement): number {
    const base = {
      simple: 4,
      medium: 10,
      complex: 20,
      'very-complex': 40,
    }[feature.complexity];

    return base;
  }
}

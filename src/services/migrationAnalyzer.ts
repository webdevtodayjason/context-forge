import fs from 'fs-extra';
import path from 'path';
import {
  MigrationPhase,
  SharedResource,
  MigrationRisk,
  TechStackInfo,
  RollbackStrategy,
} from '../types';
import { BasicAnalysis } from './projectAnalyzer';
import { FrameworkDetector } from './frameworkDetector';
import { BreakingChangeAnalyzer, BreakingChange } from './breakingChangeAnalyzer';
import { DependencyAnalyzer, DependencyAnalysis } from './dependencyAnalyzer';

export interface MigrationAnalysis {
  sourceStack: TechStackInfo;
  targetStack: TechStackInfo;
  complexity: MigrationComplexity;
  risks: MigrationRisk[];
  sharedResources: SharedResource[];
  suggestedPhases: MigrationPhase[];
  estimatedDuration: string;
  recommendedStrategy: 'big-bang' | 'incremental' | 'parallel-run';
  breakingChanges?: BreakingChange[];
  breakingChangesSummary?: {
    total: number;
    critical: number;
    automatable: number;
    estimatedHours: number;
  };
  dependencyAnalysis?: DependencyAnalysis;
}

export interface MigrationComplexity {
  score: number; // 0-100
  factors: ComplexityFactor[];
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplexityFactor {
  name: string;
  impact: number; // 0-10
  description: string;
}

export class MigrationAnalyzer {
  constructor(
    private sourcePath: string,
    private targetTechStack: Partial<TechStackInfo>
  ) {}

  async analyzeMigration(basicAnalysis: BasicAnalysis): Promise<MigrationAnalysis> {
    const sourceStack = await this.detectCurrentStack(basicAnalysis);
    const targetStack = this.completeTargetStack(this.targetTechStack);

    const sharedResources = await this.detectSharedResources();

    // Analyze breaking changes if we have framework information
    let breakingChanges: BreakingChange[] = [];
    let breakingChangesSummary;

    if (sourceStack.metadata && targetStack.name) {
      const breakingAnalyzer = new BreakingChangeAnalyzer();
      const sourceFramework = sourceStack.metadata.detectedFrameworks[0];
      const targetFramework = {
        framework: targetStack.name.toLowerCase(),
        version: targetStack.version,
        confidence: 100,
      };

      if (sourceFramework && targetFramework) {
        const breakingAnalysis = await breakingAnalyzer.analyzeBreakingChanges(
          sourceFramework,
          targetFramework
        );
        breakingChanges = breakingAnalysis.breakingChanges;
        breakingChangesSummary = {
          total: breakingChanges.length,
          critical: breakingAnalysis.criticalCount,
          automatable: breakingAnalysis.automatableCount,
          estimatedHours: breakingAnalysis.estimatedHours,
        };
      }
    }

    // Analyze dependencies
    let dependencyAnalysis: DependencyAnalysis | undefined;
    const dependencyAnalyzer = new DependencyAnalyzer();

    const sourceFrameworkName =
      sourceStack.metadata?.detectedFrameworks[0]?.framework || sourceStack.name.toLowerCase();
    const targetFrameworkName = targetStack.name.toLowerCase();

    dependencyAnalysis = await dependencyAnalyzer.analyzeDependencies(
      this.sourcePath,
      sourceFrameworkName,
      targetFrameworkName
    );

    const risks = this.assessMigrationRisks(
      sourceStack,
      targetStack,
      sharedResources,
      breakingChanges,
      dependencyAnalysis
    );
    const complexity = this.calculateComplexity(
      sourceStack,
      targetStack,
      sharedResources,
      risks,
      breakingChanges,
      dependencyAnalysis
    );
    const suggestedPhases = this.generateMigrationPhases(
      sourceStack,
      targetStack,
      complexity,
      breakingChanges,
      dependencyAnalysis
    );

    return {
      sourceStack,
      targetStack,
      complexity,
      risks,
      sharedResources,
      suggestedPhases,
      estimatedDuration: this.estimateDuration(complexity, suggestedPhases),
      recommendedStrategy: this.recommendStrategy(complexity, sharedResources),
      breakingChanges,
      breakingChangesSummary,
      dependencyAnalysis,
    };
  }

  private async detectCurrentStack(analysis: BasicAnalysis): Promise<TechStackInfo> {
    // Use FrameworkDetector for accurate detection
    const detector = new FrameworkDetector(this.sourcePath);
    const detectionResult = await detector.detectFrameworks();

    const stack: TechStackInfo = {
      name: 'Current Stack',
      type: 'fullstack',
      docs: '',
      dependencies: [],
      devDependencies: [],
    };

    // Use primary detected framework
    if (detectionResult.primary) {
      stack.name = detectionResult.primary.variant || detectionResult.primary.framework;
      if (detectionResult.primary.version) {
        stack.version = detectionResult.primary.version;
      }
    } else {
      // Fallback to basic analysis
      if (analysis.techStack.includes('React')) stack.name = 'React';
      if (analysis.techStack.includes('Next.js')) stack.name = 'Next.js';
      if (analysis.techStack.includes('Express')) stack.name = 'Express';
      if (analysis.techStack.includes('Flask')) stack.name = 'Flask';
      if (analysis.techStack.includes('Django')) stack.name = 'Django';
    }

    // Detect from package.json or requirements.txt
    const packageJsonPath = path.join(this.sourcePath, 'package.json');
    const requirementsPath = path.join(this.sourcePath, 'requirements.txt');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      stack.dependencies = Object.keys(packageJson.dependencies || {});
      stack.devDependencies = Object.keys(packageJson.devDependencies || {});
    }

    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf-8');
      stack.dependencies = requirements.split('\n').filter((line) => line.trim());
    }

    // Add framework detection confidence as metadata
    if (detectionResult.primary) {
      stack.metadata = {
        confidence: detectionResult.primary.confidence,
        detectedFrameworks: detectionResult.allDetected,
      };
    }

    return stack;
  }

  private completeTargetStack(partial: Partial<TechStackInfo>): TechStackInfo {
    return {
      name: partial.name || 'Target Stack',
      type: partial.type || 'fullstack',
      docs: partial.docs || '',
      dependencies: partial.dependencies || [],
      devDependencies: partial.devDependencies || [],
      ...partial,
    };
  }

  private async detectSharedResources(): Promise<SharedResource[]> {
    const resources: SharedResource[] = [];

    // Check for database connections
    const envPath = path.join(this.sourcePath, '.env');
    const envExamplePath = path.join(this.sourcePath, '.env.example');

    if (fs.existsSync(envPath) || fs.existsSync(envExamplePath)) {
      const envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, 'utf-8')
        : fs.readFileSync(envExamplePath, 'utf-8');

      if (envContent.includes('DATABASE_URL') || envContent.includes('DB_')) {
        resources.push({
          type: 'database',
          name: 'Production Database',
          description: 'Shared database connection detected in environment',
          criticalityLevel: 'critical',
          migrationStrategy: 'Maintain compatibility during migration',
        });
      }

      if (envContent.includes('REDIS_URL') || envContent.includes('CACHE_')) {
        resources.push({
          type: 'cache',
          name: 'Redis Cache',
          description: 'Shared cache instance detected',
          criticalityLevel: 'medium',
          migrationStrategy: 'Gradual cache key migration',
        });
      }

      if (envContent.includes('AUTH_') || envContent.includes('JWT_')) {
        resources.push({
          type: 'auth',
          name: 'Authentication System',
          description: 'Shared authentication configuration',
          criticalityLevel: 'critical',
          migrationStrategy: 'Maintain session compatibility',
        });
      }
    }

    // Check for API endpoints
    const routesExist = await this.checkForRoutes();
    if (routesExist) {
      resources.push({
        type: 'api',
        name: 'API Endpoints',
        description: 'Existing API contracts that may have consumers',
        criticalityLevel: 'high',
        migrationStrategy: 'Version APIs or maintain backward compatibility',
      });
    }

    return resources;
  }

  private async checkForRoutes(): Promise<boolean> {
    const patterns = [
      '**/routes/**/*.{js,ts,py}',
      '**/api/**/*.{js,ts,py}',
      '**/views/**/*.py',
      '**/controllers/**/*.{js,ts,py}',
    ];

    // Simple check for route files
    for (const pattern of patterns) {
      const routePath = path.join(this.sourcePath, pattern.split('**/')[1].split('/**')[0]);
      if (fs.existsSync(routePath)) {
        return true;
      }
    }

    return false;
  }

  private assessMigrationRisks(
    sourceStack: TechStackInfo,
    targetStack: TechStackInfo,
    sharedResources: SharedResource[],
    breakingChanges: BreakingChange[] = [],
    dependencyAnalysis?: DependencyAnalysis
  ): MigrationRisk[] {
    const risks: MigrationRisk[] = [];

    // Framework migration risks
    if (sourceStack.name !== targetStack.name) {
      risks.push({
        category: 'compatibility',
        description: `Framework migration from ${sourceStack.name} to ${targetStack.name}`,
        probability: 'high',
        impact: 'high',
        mitigation: 'Use adapter patterns and gradual component migration',
      });
    }

    // Shared database risks
    const hasSharedDb = sharedResources.some((r) => r.type === 'database');
    if (hasSharedDb) {
      risks.push({
        category: 'data-loss',
        description: 'Shared database requires careful schema management',
        probability: 'medium',
        impact: 'critical',
        mitigation: 'Use database migrations with rollback capability',
      });
    }

    // Authentication risks
    const hasSharedAuth = sharedResources.some((r) => r.type === 'auth');
    if (hasSharedAuth) {
      risks.push({
        category: 'security',
        description: 'Authentication system must remain compatible',
        probability: 'medium',
        impact: 'critical',
        mitigation: 'Implement session sharing or token compatibility layer',
      });
    }

    // API compatibility risks
    const hasApi = sharedResources.some((r) => r.type === 'api');
    if (hasApi) {
      risks.push({
        category: 'compatibility',
        description: 'API contracts must be maintained for existing consumers',
        probability: 'high',
        impact: 'high',
        mitigation: 'Version APIs or use API gateway for routing',
      });
    }

    // Breaking change risks
    if (breakingChanges.length > 0) {
      const criticalChanges = breakingChanges.filter((c) => c.severity === 'critical');
      if (criticalChanges.length > 0) {
        risks.push({
          category: 'compatibility',
          description: `${criticalChanges.length} critical breaking changes require attention`,
          probability: 'high',
          impact: 'critical',
          mitigation: 'Address all critical breaking changes before migration',
        });
      }

      const nonAutomatable = breakingChanges.filter((c) => !c.automatable);
      if (nonAutomatable.length > 0) {
        risks.push({
          category: 'compatibility',
          description: `${nonAutomatable.length} breaking changes require manual migration`,
          probability: 'high',
          impact: 'high',
          mitigation: 'Allocate time for manual code updates and testing',
        });
      }
    }

    // Dependency risks
    if (dependencyAnalysis && dependencyAnalysis.incompatibleCount > 0) {
      risks.push({
        category: 'compatibility',
        description: `${dependencyAnalysis.incompatibleCount} incompatible dependencies detected`,
        probability: 'high',
        impact: dependencyAnalysis.incompatibleCount > 10 ? 'critical' : 'high',
        mitigation: 'Replace incompatible packages with suggested alternatives',
      });
    }

    if (dependencyAnalysis && dependencyAnalysis.migrationComplexity === 'high') {
      risks.push({
        category: 'compatibility',
        description: 'High dependency migration complexity',
        probability: 'high',
        impact: 'high',
        mitigation: 'Plan phased dependency migration with thorough testing',
      });
    }

    // Performance risks
    risks.push({
      category: 'performance',
      description: 'Parallel run strategy may impact system performance',
      probability: 'medium',
      impact: 'medium',
      mitigation: 'Implement load balancing and resource monitoring',
    });

    return risks;
  }

  private calculateComplexity(
    sourceStack: TechStackInfo,
    targetStack: TechStackInfo,
    sharedResources: SharedResource[],
    risks: MigrationRisk[],
    breakingChanges: BreakingChange[] = [],
    dependencyAnalysis?: DependencyAnalysis
  ): MigrationComplexity {
    const factors: ComplexityFactor[] = [];
    let totalScore = 0;

    // Framework difference
    if (sourceStack.name !== targetStack.name) {
      const frameworkComplexity = this.getFrameworkComplexity(sourceStack.name, targetStack.name);
      factors.push({
        name: 'Framework Migration',
        impact: frameworkComplexity,
        description: `Migrating from ${sourceStack.name} to ${targetStack.name}`,
      });
      totalScore += frameworkComplexity * 10;
    }

    // Shared resources
    const resourceComplexity = Math.min(sharedResources.length * 2, 10);
    factors.push({
      name: 'Shared Resources',
      impact: resourceComplexity,
      description: `${sharedResources.length} shared resources to maintain`,
    });
    totalScore += resourceComplexity * 5;

    // Risk factors
    const criticalRisks = risks.filter((r) => r.impact === 'critical').length;
    const riskComplexity = Math.min(criticalRisks * 3, 10);
    factors.push({
      name: 'Critical Risks',
      impact: riskComplexity,
      description: `${criticalRisks} critical risk factors identified`,
    });
    totalScore += riskComplexity * 7;

    // Breaking changes complexity
    if (breakingChanges.length > 0) {
      const breakingComplexity = Math.min(breakingChanges.length, 10);
      const manualChanges = breakingChanges.filter((c) => !c.automatable).length;
      factors.push({
        name: 'Breaking Changes',
        impact: breakingComplexity,
        description: `${breakingChanges.length} breaking changes (${manualChanges} manual)`,
      });
      totalScore += breakingComplexity * 5;
    }

    // Dependency complexity
    if (dependencyAnalysis) {
      const depComplexity =
        dependencyAnalysis.migrationComplexity === 'high'
          ? 8
          : dependencyAnalysis.migrationComplexity === 'medium'
            ? 5
            : 2;
      factors.push({
        name: 'Dependency Migration',
        impact: depComplexity,
        description: `${dependencyAnalysis.incompatibleCount}/${dependencyAnalysis.totalDependencies} incompatible dependencies`,
      });
      totalScore += depComplexity * 4;
    }

    // Determine level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (totalScore < 30) level = 'low';
    else if (totalScore < 60) level = 'medium';
    else if (totalScore < 80) level = 'high';
    else level = 'critical';

    return {
      score: Math.min(totalScore, 100),
      factors,
      level,
    };
  }

  private getFrameworkComplexity(source: string, target: string): number {
    // Define complexity matrix for common migrations
    const complexityMatrix: Record<string, Record<string, number>> = {
      Flask: {
        FastAPI: 4,
        Django: 6,
        Express: 8,
        'Next.js': 9,
      },
      Django: {
        FastAPI: 5,
        Flask: 4,
        Express: 8,
        'Next.js': 9,
      },
      Express: {
        Fastify: 3,
        'Next.js': 5,
        Flask: 8,
        Django: 9,
      },
      React: {
        'Next.js': 3,
        Vue: 7,
        Angular: 8,
      },
    };

    return complexityMatrix[source]?.[target] || 7; // Default complexity
  }

  private generateMigrationPhases(
    sourceStack: TechStackInfo,
    targetStack: TechStackInfo,
    complexity: MigrationComplexity,
    breakingChanges: BreakingChange[] = [],
    dependencyAnalysis?: DependencyAnalysis
  ): MigrationPhase[] {
    const phases: MigrationPhase[] = [];

    // Phase 1: Setup and Planning
    phases.push({
      id: 'setup',
      name: 'Setup and Planning',
      description: 'Initialize new project structure and migration tools',
      criticalCheckpoints: [
        {
          id: 'env-setup',
          name: 'Environment Setup',
          description: 'New environment configured with shared resources',
          category: 'critical',
          autoTrigger: true,
          conditions: ['environment', 'config', 'setup'],
        },
      ],
      dependencies: [],
      rollbackPoint: false,
      estimatedDuration: '1-2 days',
      risks: [],
      validationCriteria: [
        'New project structure created',
        'Development environment running',
        'Shared resources accessible',
      ],
    });

    // Phase 2: Core Infrastructure
    phases.push({
      id: 'infrastructure',
      name: 'Core Infrastructure Migration',
      description: 'Migrate core services, authentication, and database connections',
      criticalCheckpoints: [
        {
          id: 'db-connection',
          name: 'Database Connection',
          description: 'Verify database connectivity and compatibility',
          category: 'critical',
          autoTrigger: true,
          conditions: ['database', 'connection', 'schema'],
        },
      ],
      dependencies: ['setup'],
      rollbackPoint: true,
      estimatedDuration: '3-5 days',
      risks: complexity.factors
        .filter((f) => f.name === 'Shared Resources')
        .map((f) => ({
          category: 'compatibility' as const,
          description: f.description,
          probability: 'medium' as const,
          impact: 'high' as const,
          mitigation: 'Test thoroughly in staging',
        })),
      validationCriteria: [
        'Database connections working',
        'Authentication system compatible',
        'Core services operational',
      ],
    });

    // Phase 3: Breaking Changes (if needed)
    if (breakingChanges.length > 0) {
      const automatableChanges = breakingChanges.filter((c) => c.automatable);

      phases.push({
        id: 'breaking-changes',
        name: 'Breaking Changes Resolution',
        description: `Address ${breakingChanges.length} breaking changes (${automatableChanges.length} automatable)`,
        criticalCheckpoints: [
          {
            id: 'breaking-changes-review',
            name: 'Breaking Changes Review',
            description: 'Review and plan approach for each breaking change',
            category: 'critical',
            autoTrigger: false,
            conditions: ['breaking', 'changes', 'documented'],
          },
          {
            id: 'automated-changes',
            name: 'Automated Changes Applied',
            description: 'Run and verify automated migration scripts',
            category: 'important',
            autoTrigger: true,
            conditions: ['automated', 'migration', 'complete'],
          },
        ],
        dependencies: ['infrastructure'],
        rollbackPoint: true,
        estimatedDuration: `${Math.ceil(breakingChanges.length / 5)}-${Math.ceil(breakingChanges.length / 2)} days`,
        risks: [
          {
            category: 'compatibility',
            description: 'Breaking changes may introduce new issues',
            probability: 'medium',
            impact: 'high',
            mitigation: 'Thorough testing after each change',
          },
        ],
        validationCriteria: [
          'All breaking changes addressed',
          'Code compiles without errors',
          'Existing tests updated',
          'No regression issues',
        ],
      });
    }

    // Phase 4: Dependency Migration (if needed)
    if (dependencyAnalysis && dependencyAnalysis.incompatibleCount > 0) {
      phases.push({
        id: 'dependencies',
        name: 'Dependency Migration',
        description: `Update ${dependencyAnalysis.incompatibleCount} incompatible dependencies`,
        criticalCheckpoints: [
          {
            id: 'dependency-analysis',
            name: 'Dependency Analysis Review',
            description: 'Review replacement suggestions and migration paths',
            category: 'important',
            autoTrigger: false,
            conditions: ['dependencies', 'analyzed', 'replacements'],
          },
          {
            id: 'dependency-testing',
            name: 'Dependency Compatibility Test',
            description: 'Test new dependencies in isolation',
            category: 'critical',
            autoTrigger: true,
            conditions: ['dependencies', 'installed', 'tested'],
          },
        ],
        dependencies: breakingChanges.length > 0 ? ['breaking-changes'] : ['infrastructure'],
        rollbackPoint: true,
        estimatedDuration: `${Math.ceil(dependencyAnalysis.incompatibleCount / 10)}-${Math.ceil(dependencyAnalysis.incompatibleCount / 5)} days`,
        risks: [
          {
            category: 'compatibility',
            description: 'New dependencies may have different APIs',
            probability: 'medium',
            impact: 'medium',
            mitigation: 'Test each dependency replacement thoroughly',
          },
        ],
        validationCriteria: [
          'All incompatible dependencies replaced',
          'Package installation successful',
          'No version conflicts',
          'Application builds successfully',
        ],
      });
    }

    // Phase 5: Feature Migration (can be broken down further)
    const previousDeps = [
      ...(breakingChanges.length > 0 ? ['breaking-changes'] : ['infrastructure']),
      ...(dependencyAnalysis && dependencyAnalysis.incompatibleCount > 0 ? ['dependencies'] : []),
    ];

    phases.push({
      id: 'features',
      name: 'Feature Migration',
      description: 'Migrate application features incrementally',
      criticalCheckpoints: [
        {
          id: 'feature-parity',
          name: 'Feature Parity Check',
          description: 'Verify migrated features match original functionality',
          category: 'important',
          autoTrigger: false,
          conditions: ['feature', 'complete', 'tested'],
        },
      ],
      dependencies: previousDeps,
      rollbackPoint: true,
      estimatedDuration: '2-4 weeks',
      risks: [],
      validationCriteria: [
        'Core features migrated',
        'Unit tests passing',
        'Integration tests passing',
      ],
    });

    // Phase 4: Data Migration (if needed)
    if (complexity.factors.some((f) => f.name.includes('Shared Resources'))) {
      phases.push({
        id: 'data',
        name: 'Data Migration',
        description: 'Migrate or transform data structures if needed',
        criticalCheckpoints: [
          {
            id: 'data-integrity',
            name: 'Data Integrity Check',
            description: 'Verify all data migrated correctly',
            category: 'critical',
            autoTrigger: true,
            conditions: ['data', 'migration', 'integrity'],
          },
        ],
        dependencies: ['features'],
        rollbackPoint: true,
        estimatedDuration: '1-2 weeks',
        risks: [
          {
            category: 'data-loss',
            description: 'Potential data inconsistency during migration',
            probability: 'low',
            impact: 'critical',
            mitigation: 'Implement comprehensive backup and validation',
          },
        ],
        validationCriteria: [
          'Data integrity verified',
          'No data loss confirmed',
          'Performance benchmarks met',
        ],
      });
    }

    // Phase 5: Cutover
    phases.push({
      id: 'cutover',
      name: 'Production Cutover',
      description: 'Switch production traffic to new system',
      criticalCheckpoints: [
        {
          id: 'go-live',
          name: 'Go Live Decision',
          description: 'Final approval before production cutover',
          category: 'critical',
          autoTrigger: false,
          conditions: ['production', 'ready', 'approved'],
        },
      ],
      dependencies: phases.map((p) => p.id),
      rollbackPoint: true,
      estimatedDuration: '1-2 days',
      risks: [
        {
          category: 'downtime',
          description: 'Potential service disruption during cutover',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Use blue-green deployment or gradual rollout',
        },
      ],
      validationCriteria: [
        'All systems operational',
        'Performance metrics acceptable',
        'Rollback plan tested and ready',
      ],
    });

    return phases;
  }

  private estimateDuration(complexity: MigrationComplexity, phases: MigrationPhase[]): string {
    const baseDuration = phases.reduce((total, phase) => {
      const [min, max] = this.parseDuration(phase.estimatedDuration);
      return total + (min + max) / 2;
    }, 0);

    const complexityMultiplier = 1 + complexity.score / 100;
    const totalDays = Math.ceil(baseDuration * complexityMultiplier);

    if (totalDays < 14) return `${totalDays} days`;
    if (totalDays < 60) return `${Math.ceil(totalDays / 7)} weeks`;
    return `${Math.ceil(totalDays / 30)} months`;
  }

  private parseDuration(duration: string): [number, number] {
    const dayMatch = duration.match(/(\d+)-?(\d+)?\s*days?/);
    const weekMatch = duration.match(/(\d+)-?(\d+)?\s*weeks?/);

    if (dayMatch) {
      const min = parseInt(dayMatch[1]);
      const max = parseInt(dayMatch[2] || dayMatch[1]);
      return [min, max];
    }

    if (weekMatch) {
      const min = parseInt(weekMatch[1]) * 7;
      const max = parseInt(weekMatch[2] || weekMatch[1]) * 7;
      return [min, max];
    }

    return [7, 14]; // Default
  }

  private recommendStrategy(
    complexity: MigrationComplexity,
    sharedResources: SharedResource[]
  ): 'big-bang' | 'incremental' | 'parallel-run' {
    const hasCriticalShared = sharedResources.some((r) => r.criticalityLevel === 'critical');

    if (complexity.level === 'low' && !hasCriticalShared) {
      return 'big-bang';
    }

    if (complexity.level === 'critical' || hasCriticalShared) {
      return 'parallel-run';
    }

    return 'incremental';
  }

  async generateRollbackStrategy(
    phases: MigrationPhase[],
    sharedResources: SharedResource[]
  ): Promise<RollbackStrategy> {
    const hasDatabase = sharedResources.some((r) => r.type === 'database');

    return {
      automatic: false, // Default to manual rollback for safety
      triggers: [
        {
          condition: 'Critical error in production',
          severity: 'critical',
          action: 'rollback',
        },
        {
          condition: 'Data integrity check failed',
          severity: 'critical',
          action: 'rollback',
        },
        {
          condition: 'Performance degradation > 50%',
          severity: 'error',
          action: 'pause',
        },
      ],
      procedures: phases
        .filter((p) => p.rollbackPoint)
        .map((phase) => ({
          phase: phase.id,
          steps: [
            `Stop all services for ${phase.name}`,
            'Restore previous configuration',
            hasDatabase ? 'Execute database rollback script' : 'Skip database rollback',
            'Restart services with old configuration',
            'Verify system functionality',
          ],
          verificationPoints: [
            'Old system responding correctly',
            'Data integrity verified',
            'No active errors in logs',
          ],
          estimatedDuration: '30-60 minutes',
        })),
      dataBackupRequired: hasDatabase,
      estimatedTime: '1-2 hours',
    };
  }
}

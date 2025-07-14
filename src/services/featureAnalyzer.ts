import { glob } from 'glob';
import { FeatureRequirement, IntegrationPoint } from '../types';
import { BasicAnalysis } from './projectAnalyzer';

export interface FeatureFeasibility {
  featureId: string;
  featureName: string;
  feasibility: 'high' | 'medium' | 'low';
  score: number; // 0-100
  concerns: string[];
  opportunities: string[];
  estimatedImpact: {
    files: number;
    components: number;
    tests: number;
  };
  suggestedApproach?: string;
}

export interface ConflictAnalysis {
  featureId: string;
  conflicts: Array<{
    type: 'file' | 'dependency' | 'api' | 'schema';
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolution: string;
  }>;
}

export class FeatureAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyzeFeasibility(
    features: FeatureRequirement[],
    basicAnalysis: BasicAnalysis
  ): Promise<FeatureFeasibility[]> {
    const results: FeatureFeasibility[] = [];

    for (const feature of features) {
      const feasibility = await this.analyzeFeatureFeasibility(feature, basicAnalysis);
      results.push(feasibility);
    }

    return results;
  }

  private async analyzeFeatureFeasibility(
    feature: FeatureRequirement,
    basicAnalysis: BasicAnalysis
  ): Promise<FeatureFeasibility> {
    let score = 100; // Start with perfect score
    const concerns: string[] = [];
    const opportunities: string[] = [];

    // Analyze complexity impact
    const complexityPenalty = this.calculateComplexityPenalty(feature);
    score -= complexityPenalty;
    if (complexityPenalty > 20) {
      concerns.push(`High complexity (${feature.complexity}) may extend timeline`);
    }

    // Analyze integration requirements
    const integrationAnalysis = await this.analyzeIntegrationRequirements(feature, basicAnalysis);
    score -= integrationAnalysis.penalty;
    concerns.push(...integrationAnalysis.concerns);
    opportunities.push(...integrationAnalysis.opportunities);

    // Analyze dependencies
    if (feature.dependencies.length > 0) {
      score -= feature.dependencies.length * 5;
      concerns.push(`Depends on ${feature.dependencies.length} other features`);
    }

    // Analyze risks
    const riskPenalty = this.calculateRiskPenalty(feature);
    score -= riskPenalty;
    if (riskPenalty > 15) {
      concerns.push('Multiple high-impact risks identified');
    }

    // Category-specific analysis
    const categoryAnalysis = await this.analyzeCategorySpecific(feature, basicAnalysis);
    score -= categoryAnalysis.penalty;
    concerns.push(...categoryAnalysis.concerns);
    opportunities.push(...categoryAnalysis.opportunities);

    // Estimate impact
    const impact = await this.estimateImpact(feature, basicAnalysis);

    // Determine feasibility level
    let feasibility: 'high' | 'medium' | 'low';
    if (score >= 70) feasibility = 'high';
    else if (score >= 40) feasibility = 'medium';
    else feasibility = 'low';

    // Suggest approach based on analysis
    const suggestedApproach = this.suggestImplementationApproach(feature, feasibility);

    return {
      featureId: feature.id,
      featureName: feature.name,
      feasibility,
      score: Math.max(0, Math.min(100, score)),
      concerns,
      opportunities,
      estimatedImpact: impact,
      suggestedApproach,
    };
  }

  private calculateComplexityPenalty(feature: FeatureRequirement): number {
    const penalties = {
      simple: 0,
      medium: 10,
      complex: 25,
      'very-complex': 40,
    };
    return penalties[feature.complexity];
  }

  private async analyzeIntegrationRequirements(
    feature: FeatureRequirement,
    basicAnalysis: BasicAnalysis
  ): Promise<{ penalty: number; concerns: string[]; opportunities: string[] }> {
    let penalty = 0;
    const concerns: string[] = [];
    const opportunities: string[] = [];

    for (const integration of feature.integrationPoints) {
      // Check if integration point exists
      const exists = await this.checkIntegrationPointExists(integration, basicAnalysis);

      if (!exists) {
        penalty += 10;
        concerns.push(`Integration point "${integration.component}" may not exist`);
      } else {
        opportunities.push(`Can leverage existing ${integration.type} infrastructure`);
      }

      // Check change complexity
      if (integration.requiredChanges.length > 3) {
        penalty += 5;
        concerns.push(`Complex changes required for ${integration.component}`);
      }
    }

    return { penalty, concerns, opportunities };
  }

  private async checkIntegrationPointExists(
    integration: IntegrationPoint,
    basicAnalysis: BasicAnalysis
  ): Promise<boolean> {
    switch (integration.type) {
      case 'api':
        return basicAnalysis.fileStats.routes > 0;
      case 'database':
        return basicAnalysis.techStack.some(
          (tech) =>
            tech.toLowerCase().includes('database') ||
            tech.toLowerCase().includes('mongo') ||
            tech.toLowerCase().includes('postgres') ||
            tech.toLowerCase().includes('mysql')
        );
      case 'ui':
        return basicAnalysis.fileStats.components > 0;
      case 'service':
        // Check for service pattern files
        const serviceFiles = await glob('**/services/**/*.{js,ts}', {
          cwd: this.projectPath,
          ignore: ['node_modules/**'],
        });
        return serviceFiles.length > 0;
      case 'config':
        return basicAnalysis.fileStats.config > 0;
      default:
        return true;
    }
  }

  private calculateRiskPenalty(feature: FeatureRequirement): number {
    let penalty = 0;

    for (const risk of feature.risks) {
      // Impact scoring
      const impactScore = {
        low: 1,
        medium: 3,
        high: 5,
        critical: 10,
      }[risk.impact];

      // Probability scoring
      const probabilityScore = {
        unlikely: 0.25,
        possible: 0.5,
        likely: 0.75,
        certain: 1,
      }[risk.probability];

      penalty += impactScore * probabilityScore * 3;
    }

    return Math.round(penalty);
  }

  private async analyzeCategorySpecific(
    feature: FeatureRequirement,
    basicAnalysis: BasicAnalysis
  ): Promise<{ penalty: number; concerns: string[]; opportunities: string[] }> {
    let penalty = 0;
    const concerns: string[] = [];
    const opportunities: string[] = [];

    switch (feature.category) {
      case 'api':
        if (basicAnalysis.fileStats.routes === 0) {
          penalty += 15;
          concerns.push('No existing API structure detected');
        } else {
          opportunities.push('Existing API patterns can be followed');
        }
        break;

      case 'ui':
        if (basicAnalysis.fileStats.components === 0) {
          penalty += 15;
          concerns.push('No existing UI components detected');
        } else {
          opportunities.push('Can reuse existing component patterns');
        }
        break;

      case 'database':
        const hasDb = basicAnalysis.techStack.some(
          (tech) => tech.toLowerCase().includes('database') || tech.toLowerCase().includes('db')
        );
        if (!hasDb) {
          penalty += 20;
          concerns.push('No database infrastructure detected');
        }
        break;

      case 'security':
        if (!basicAnalysis.techStack.some((tech) => tech.toLowerCase().includes('auth'))) {
          concerns.push('No existing authentication system detected');
          penalty += 10;
        }
        break;

      case 'analytics':
        // Check for existing analytics
        const analyticsFiles = await glob('**/analytics/**/*.{js,ts}', {
          cwd: this.projectPath,
          ignore: ['node_modules/**'],
        });
        if (analyticsFiles.length === 0) {
          concerns.push('No existing analytics infrastructure');
          penalty += 5;
        }
        break;
    }

    return { penalty, concerns, opportunities };
  }

  private async estimateImpact(
    feature: FeatureRequirement,
    _basicAnalysis: BasicAnalysis
  ): Promise<{ files: number; components: number; tests: number }> {
    // Base estimates
    let files = 0;
    let components = 0;
    let tests = 0;

    // Complexity multipliers
    const complexityMultiplier = {
      simple: 1,
      medium: 2.5,
      complex: 5,
      'very-complex': 10,
    }[feature.complexity];

    // Category-based estimates
    switch (feature.category) {
      case 'api':
        files = Math.ceil(3 * complexityMultiplier); // Routes, controllers, middleware
        tests = Math.ceil(2 * complexityMultiplier); // Unit and integration tests
        break;

      case 'ui':
        components = Math.ceil(2 * complexityMultiplier); // Components and containers
        files = Math.ceil(4 * complexityMultiplier); // Components, styles, utils, types
        tests = Math.ceil(2 * complexityMultiplier); // Component and integration tests
        break;

      case 'database':
        files = Math.ceil(2 * complexityMultiplier); // Models and migrations
        tests = Math.ceil(1.5 * complexityMultiplier); // Model tests
        break;

      case 'integration':
        files = Math.ceil(2.5 * complexityMultiplier); // Service files and configs
        tests = Math.ceil(2 * complexityMultiplier); // Integration tests
        break;

      default:
        files = Math.ceil(2 * complexityMultiplier);
        tests = Math.ceil(1.5 * complexityMultiplier);
    }

    // Add integration impact
    files += feature.integrationPoints.length * 2;
    tests += feature.integrationPoints.length;

    return { files, components, tests };
  }

  private suggestImplementationApproach(
    feature: FeatureRequirement,
    feasibility: 'high' | 'medium' | 'low'
  ): string {
    const approaches = {
      high: {
        api: 'Follow existing API patterns. Create new routes in the established structure.',
        ui: 'Extend existing component library. Maintain current styling patterns.',
        database: 'Use existing ORM/database patterns. Follow current schema conventions.',
        integration:
          'Leverage existing service architecture. Use established integration patterns.',
        infrastructure: 'Build on current DevOps setup. Extend existing CI/CD pipelines.',
        analytics: 'Integrate with current monitoring. Extend existing metrics collection.',
        security: 'Enhance current auth system. Follow established security patterns.',
      },
      medium: {
        api: 'Consider creating a separate API module. Plan for gradual integration.',
        ui: 'Create new component namespace. Plan progressive enhancement.',
        database: 'Design migration strategy. Consider compatibility layer.',
        integration: 'Implement adapter pattern. Create abstraction layer.',
        infrastructure: 'Phase implementation. Start with development environment.',
        analytics: 'Start with basic metrics. Plan incremental enhancement.',
        security: 'Implement in phases. Start with basic authentication.',
      },
      low: {
        api: 'Consider microservice approach. Plan extensive testing.',
        ui: 'Prototype separately first. Plan careful integration.',
        database: 'Evaluate database choice. Consider data migration carefully.',
        integration: 'Research alternatives. Consider third-party solutions.',
        infrastructure: 'Seek expert consultation. Consider managed services.',
        analytics: 'Start with third-party service. Plan custom implementation later.',
        security: 'Use proven libraries. Consider security audit.',
      },
    };

    return (
      approaches[feasibility][feature.category] ||
      'Conduct detailed technical spike before implementation.'
    );
  }

  async detectPotentialConflicts(features: FeatureRequirement[]): Promise<ConflictAnalysis[]> {
    const conflicts: ConflictAnalysis[] = [];

    for (const feature of features) {
      const featureConflicts = await this.analyzeFeatureConflicts(feature, features);
      if (featureConflicts.conflicts.length > 0) {
        conflicts.push(featureConflicts);
      }
    }

    return conflicts;
  }

  private async analyzeFeatureConflicts(
    feature: FeatureRequirement,
    allFeatures: FeatureRequirement[]
  ): Promise<ConflictAnalysis> {
    const conflicts: ConflictAnalysis['conflicts'] = [];

    // Check for overlapping integration points
    for (const otherFeature of allFeatures) {
      if (otherFeature.id === feature.id) continue;

      // Check integration conflicts
      const overlappingIntegrations = feature.integrationPoints.filter((ip) =>
        otherFeature.integrationPoints.some(
          (oip) => oip.component === ip.component && oip.type === ip.type
        )
      );

      if (overlappingIntegrations.length > 0) {
        conflicts.push({
          type: 'file',
          description: `Both "${feature.name}" and "${otherFeature.name}" modify same components`,
          severity: 'medium',
          resolution: 'Coordinate changes or implement in sequence',
        });
      }

      // Check for circular dependencies
      if (
        feature.dependencies.includes(otherFeature.id) &&
        otherFeature.dependencies.includes(feature.id)
      ) {
        conflicts.push({
          type: 'dependency',
          description: `Circular dependency between "${feature.name}" and "${otherFeature.name}"`,
          severity: 'high',
          resolution: 'Refactor to remove circular dependency',
        });
      }
    }

    // Check for API conflicts
    if (feature.category === 'api') {
      const apiFeatures = allFeatures.filter((f) => f.id !== feature.id && f.category === 'api');
      if (apiFeatures.length > 0) {
        // Simple check for potential route conflicts
        conflicts.push({
          type: 'api',
          description: 'Multiple API features may have route conflicts',
          severity: 'low',
          resolution: 'Ensure unique route paths and proper namespacing',
        });
      }
    }

    return {
      featureId: feature.id,
      conflicts,
    };
  }

  async generateIntegrationMap(features: FeatureRequirement[]): Promise<Map<string, Set<string>>> {
    const integrationMap = new Map<string, Set<string>>();

    for (const feature of features) {
      for (const integration of feature.integrationPoints) {
        const key = `${integration.type}:${integration.component}`;
        if (!integrationMap.has(key)) {
          integrationMap.set(key, new Set());
        }
        integrationMap.get(key)!.add(feature.id);
      }
    }

    return integrationMap;
  }
}

import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  ProjectConfig,
  SupportedIDE,
  FeatureRequirement,
  EnhancementConfig,
  FeatureRisk,
  IntegrationPoint,
  ValidationStrategy,
} from '../../types';
import { BasicAnalysis, DetailedAnalysis } from '../../services/projectAnalyzer';
import { ideSelection } from './ideSelection';
import { projectConfig } from './projectConfig';

export async function runEnhancementPrompts(
  basicAnalysis: BasicAnalysis,
  detailedAnalysis: DetailedAnalysis | null,
  ideOverride?: SupportedIDE[]
): Promise<ProjectConfig> {
  console.log(chalk.blue.bold('\n🎨 Enhancement Configuration\n'));
  console.log(chalk.gray("Let's define the new features and enhancements for your project.\n"));

  // Step 1: Confirm project information
  console.log(chalk.gray('Step 1/6: Confirming project information...'));
  const projectInfo = await confirmProjectInfo(basicAnalysis);

  // Step 2: IDE selection (use override or ask)
  console.log(chalk.gray('Step 2/6: IDE selection...'));
  const targetIDEs = ideOverride || (await ideSelection());

  // Step 3: Feature definition
  console.log(chalk.gray('Step 3/6: Feature definition...'));
  const features = await defineFeatures(basicAnalysis, detailedAnalysis);

  // Step 4: Implementation strategy
  console.log(chalk.gray('Step 4/6: Implementation strategy...'));
  const strategy = await selectImplementationStrategy(features);

  // Step 5: Validation strategy
  console.log(chalk.gray('Step 5/6: Validation strategy...'));
  const validationStrategy = await defineValidationStrategy();

  // Step 6: Project configuration
  console.log(chalk.gray('Step 6/6: Project settings...'));
  const config = await projectConfig();

  // Create enhancement configuration
  const enhancementConfig: EnhancementConfig = {
    projectName: projectInfo.projectName,
    existingStack: {
      name: basicAnalysis.techStack[0] || 'Unknown',
      type: 'fullstack',
      docs: '',
      dependencies: [],
    },
    features,
    enhancementPhases: [], // Will be populated by EnhancementPlanner
    implementationStrategy: strategy,
    estimatedDuration: estimateTotalDuration(features),
    validationStrategy,
  };

  return {
    ...projectInfo,
    targetIDEs,
    techStack: mapAnalysisToTechStack(basicAnalysis),
    features: [], // Base features from original project
    plannedFeatures: features.map((f) => f.name),
    ...config,
    enhancementConfig,
  };
}

async function confirmProjectInfo(analysis: BasicAnalysis) {
  console.log(chalk.cyan('📋 Project Information'));
  console.log(chalk.gray('Detected project details:\n'));

  console.log(`  • Type: ${analysis.projectType}`);
  console.log(`  • Tech Stack: ${analysis.techStack.join(', ')}`);
  console.log(`  • Components: ${analysis.fileStats.components}`);
  console.log(`  • API Routes: ${analysis.fileStats.routes}`);
  console.log(`  • Tests: ${analysis.fileStats.tests}`);

  const { projectName, description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: process.cwd().split('/').pop(),
      validate: (input: string) => input.trim().length > 0 || 'Project name is required',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Enhancement description:',
      default: 'Adding new features and improvements to the existing application',
      validate: (input: string) => input.trim().length > 0 || 'Description is required',
    },
  ]);

  return {
    projectName,
    description,
    projectType: analysis.projectType.toLowerCase() as
      | 'web'
      | 'mobile'
      | 'desktop'
      | 'api'
      | 'fullstack',
  };
}

async function defineFeatures(
  basicAnalysis: BasicAnalysis,
  detailedAnalysis: DetailedAnalysis | null
): Promise<FeatureRequirement[]> {
  console.log(chalk.cyan('\n🚀 Feature Definition'));

  // Suggest features based on analysis
  const suggestions = generateFeatureSuggestions(basicAnalysis, detailedAnalysis);

  if (suggestions.length > 0) {
    console.log(chalk.gray('\nBased on your project, you might consider:\n'));
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion.name} - ${suggestion.description}`);
    });
  }

  const features: FeatureRequirement[] = [];
  let addMore = true;

  while (addMore) {
    console.log(chalk.cyan(`\n📝 Feature ${features.length + 1}`));

    const featureData = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Feature name:',
        validate: (input: string) => input.trim().length > 0 || 'Feature name is required',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Feature description:',
        validate: (input: string) => input.trim().length > 0 || 'Description is required',
      },
      {
        type: 'list',
        name: 'category',
        message: 'Feature category:',
        choices: [
          { name: 'API - Backend endpoints and services', value: 'api' },
          { name: 'UI - User interface components', value: 'ui' },
          { name: 'Database - Data models and storage', value: 'database' },
          { name: 'Integration - Third-party services', value: 'integration' },
          { name: 'Infrastructure - DevOps and deployment', value: 'infrastructure' },
          { name: 'Analytics - Metrics and monitoring', value: 'analytics' },
          { name: 'Security - Auth and permissions', value: 'security' },
        ],
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: [
          { name: '🔴 Critical - Must have', value: 'critical' },
          { name: '🟡 High - Should have', value: 'high' },
          { name: '🟢 Medium - Nice to have', value: 'medium' },
          { name: '⚪ Low - Future consideration', value: 'low' },
        ],
      },
      {
        type: 'list',
        name: 'complexity',
        message: 'Complexity:',
        choices: [
          { name: 'Simple - Few hours to 1 day', value: 'simple' },
          { name: 'Medium - 2-5 days', value: 'medium' },
          { name: 'Complex - 1-2 weeks', value: 'complex' },
          { name: 'Very Complex - 2+ weeks', value: 'very-complex' },
        ],
      },
      {
        type: 'input',
        name: 'estimatedEffort',
        message: 'Estimated effort:',
        default: (answers: any) => {
          const effortMap = {
            simple: '1-2 days',
            medium: '3-5 days',
            complex: '1-2 weeks',
            'very-complex': '2-4 weeks',
          };
          return effortMap[answers.complexity as keyof typeof effortMap];
        },
      },
    ]);

    // Acceptance criteria
    console.log(chalk.gray('\nDefine acceptance criteria (empty line to finish):'));
    const acceptanceCriteria: string[] = [];
    let criterion = '';
    do {
      const { criterion: input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'criterion',
          message: `Criterion ${acceptanceCriteria.length + 1}:`,
        },
      ]);
      criterion = input;
      if (criterion) acceptanceCriteria.push(criterion);
    } while (criterion);

    // Technical requirements
    console.log(chalk.gray('\nDefine technical requirements (empty line to finish):'));
    const technicalRequirements: string[] = [];
    let requirement = '';
    do {
      const { requirement: input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'requirement',
          message: `Requirement ${technicalRequirements.length + 1}:`,
        },
      ]);
      requirement = input;
      if (requirement) technicalRequirements.push(requirement);
    } while (requirement);

    // Risks
    const risks = await defineFeatureRisks();

    // Integration points
    const integrationPoints = await defineIntegrationPoints(basicAnalysis);

    // Create feature
    const feature: FeatureRequirement = {
      id: `feature-${features.length + 1}`,
      name: featureData.name,
      description: featureData.description,
      category: featureData.category,
      priority: featureData.priority,
      complexity: featureData.complexity,
      dependencies: [], // Will be set later
      acceptanceCriteria,
      technicalRequirements,
      estimatedEffort: featureData.estimatedEffort,
      risks,
      integrationPoints,
    };

    features.push(feature);

    // Ask to add more
    const { addAnother } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addAnother',
        message: 'Add another feature?',
        default: features.length < 3,
      },
    ]);
    addMore = addAnother;
  }

  // Define dependencies
  if (features.length > 1) {
    console.log(chalk.cyan('\n🔗 Feature Dependencies'));
    for (const feature of features) {
      const otherFeatures = features.filter((f) => f.id !== feature.id);
      if (otherFeatures.length > 0) {
        const { dependencies } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'dependencies',
            message: `Which features does "${feature.name}" depend on?`,
            choices: otherFeatures.map((f) => ({
              name: f.name,
              value: f.id,
            })),
          },
        ]);
        feature.dependencies = dependencies;
      }
    }
  }

  return features;
}

async function defineFeatureRisks(): Promise<FeatureRisk[]> {
  const risks: FeatureRisk[] = [];

  const { hasRisks } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasRisks',
      message: 'Are there any risks associated with this feature?',
      default: false,
    },
  ]);

  if (hasRisks) {
    let addMore = true;
    while (addMore && risks.length < 3) {
      const risk = await inquirer.prompt([
        {
          type: 'list',
          name: 'category',
          message: 'Risk category:',
          choices: ['technical', 'integration', 'performance', 'security', 'ux'],
        },
        {
          type: 'input',
          name: 'description',
          message: 'Risk description:',
          validate: (input: string) => input.trim().length > 0 || 'Description is required',
        },
        {
          type: 'list',
          name: 'impact',
          message: 'Impact level:',
          choices: ['low', 'medium', 'high', 'critical'],
        },
        {
          type: 'list',
          name: 'probability',
          message: 'Probability:',
          choices: ['unlikely', 'possible', 'likely', 'certain'],
        },
        {
          type: 'input',
          name: 'mitigation',
          message: 'Mitigation strategy:',
          validate: (input: string) => input.trim().length > 0 || 'Mitigation is required',
        },
      ]);

      risks.push(risk);

      if (risks.length < 3) {
        const { addAnother } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addAnother',
            message: 'Add another risk?',
            default: false,
          },
        ]);
        addMore = addAnother;
      } else {
        addMore = false;
      }
    }
  }

  return risks;
}

async function defineIntegrationPoints(basicAnalysis: BasicAnalysis): Promise<IntegrationPoint[]> {
  const points: IntegrationPoint[] = [];

  const { hasIntegrations } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasIntegrations',
      message: 'Does this feature integrate with existing components?',
      default: true,
    },
  ]);

  if (hasIntegrations) {
    // Suggest common integration points based on project
    const suggestions = [];
    if (basicAnalysis.fileStats.routes > 0) {
      suggestions.push({ name: 'API Endpoints', value: 'api' });
    }
    if (basicAnalysis.techStack.some((tech) => tech.includes('database'))) {
      suggestions.push({ name: 'Database Models', value: 'database' });
    }
    if (basicAnalysis.fileStats.components > 0) {
      suggestions.push({ name: 'UI Components', value: 'ui' });
    }
    suggestions.push(
      { name: 'Services/Business Logic', value: 'service' },
      { name: 'Configuration', value: 'config' }
    );

    const { types } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'types',
        message: 'Select integration types:',
        choices: suggestions,
      },
    ]);

    for (const type of types) {
      const point = await inquirer.prompt([
        {
          type: 'input',
          name: 'component',
          message: `Which ${type} component will be affected?`,
          validate: (input: string) => input.trim().length > 0 || 'Component is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Describe the integration:',
          validate: (input: string) => input.trim().length > 0 || 'Description is required',
        },
      ]);

      // Required changes
      console.log(chalk.gray('List required changes (empty line to finish):'));
      const requiredChanges: string[] = [];
      let change = '';
      do {
        const { change: input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'change',
            message: `Change ${requiredChanges.length + 1}:`,
          },
        ]);
        change = input;
        if (change) requiredChanges.push(change);
      } while (change);

      const { testingStrategy } = await inquirer.prompt([
        {
          type: 'input',
          name: 'testingStrategy',
          message: 'Testing strategy for this integration:',
          default: 'Unit tests and integration tests',
        },
      ]);

      points.push({
        component: point.component,
        type,
        description: point.description,
        requiredChanges,
        testingStrategy,
      });
    }
  }

  return points;
}

async function selectImplementationStrategy(
  features: FeatureRequirement[]
): Promise<'sequential' | 'parallel' | 'hybrid'> {
  // Check for dependencies
  const hasDependencies = features.some((f) => f.dependencies.length > 0);
  const hasComplexFeatures = features.some(
    (f) => f.complexity === 'complex' || f.complexity === 'very-complex'
  );

  console.log(chalk.cyan('\n⚡ Implementation Strategy'));

  if (hasDependencies) {
    console.log(chalk.yellow('Note: Some features have dependencies'));
  }
  if (hasComplexFeatures) {
    console.log(chalk.yellow('Note: Some features are complex'));
  }

  const { strategy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: 'How should features be implemented?',
      choices: [
        {
          name: 'Sequential - One feature at a time (safer)',
          value: 'sequential',
        },
        {
          name: 'Parallel - Multiple features simultaneously (faster)',
          value: 'parallel',
          disabled: hasDependencies ? 'Not recommended due to dependencies' : false,
        },
        {
          name: 'Hybrid - Mix of sequential and parallel (balanced)',
          value: 'hybrid',
        },
      ],
      default: hasDependencies ? 'sequential' : 'hybrid',
    },
  ]);

  return strategy;
}

async function defineValidationStrategy(): Promise<ValidationStrategy> {
  console.log(chalk.cyan('\n✅ Validation Strategy'));
  console.log(chalk.gray('Select validation methods for your enhancements:\n'));

  const { validations } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'validations',
      message: 'Select validation methods:',
      choices: [
        { name: 'Unit Tests', value: 'unitTests', checked: true },
        { name: 'Integration Tests', value: 'integrationTests', checked: true },
        { name: 'End-to-End Tests', value: 'e2eTests' },
        { name: 'Performance Tests', value: 'performanceTests' },
        { name: 'Security Scans', value: 'securityScans' },
        { name: 'Code Review', value: 'codeReview', checked: true },
        { name: 'Staging Deployment', value: 'stagingDeployment' },
        { name: 'User Acceptance Testing', value: 'userAcceptance' },
      ],
    },
  ]);

  // Convert array to object
  const strategy: ValidationStrategy = {
    unitTests: false,
    integrationTests: false,
    e2eTests: false,
    performanceTests: false,
    securityScans: false,
    codeReview: false,
    stagingDeployment: false,
    userAcceptance: false,
  };

  validations.forEach((validation: string) => {
    (strategy as any)[validation] = true;
  });

  return strategy;
}

function generateFeatureSuggestions(
  basicAnalysis: BasicAnalysis,
  detailedAnalysis: DetailedAnalysis | null
): Array<{ name: string; description: string }> {
  const suggestions = [];

  // API suggestions
  if (basicAnalysis.fileStats.routes > 0 && !basicAnalysis.techStack.includes('GraphQL')) {
    suggestions.push({
      name: 'GraphQL API',
      description: 'Add GraphQL endpoint for more flexible data queries',
    });
  }

  // Authentication suggestions
  if (!basicAnalysis.techStack.some((tech) => tech.toLowerCase().includes('auth'))) {
    suggestions.push({
      name: 'Authentication System',
      description: 'Add user authentication and authorization',
    });
  }

  // Performance suggestions
  if (basicAnalysis.fileStats.total > 100) {
    suggestions.push({
      name: 'Performance Monitoring',
      description: 'Add application performance monitoring and analytics',
    });
  }

  // Testing suggestions
  if (basicAnalysis.fileStats.tests < basicAnalysis.fileStats.components / 2) {
    suggestions.push({
      name: 'Test Coverage',
      description: 'Improve test coverage with additional unit and integration tests',
    });
  }

  // Based on detailed analysis
  if (detailedAnalysis) {
    if (detailedAnalysis.recommendations.some((r) => r.includes('caching'))) {
      suggestions.push({
        name: 'Caching Layer',
        description: 'Implement caching for improved performance',
      });
    }

    if (detailedAnalysis.recommendations.some((r) => r.includes('logging'))) {
      suggestions.push({
        name: 'Centralized Logging',
        description: 'Add structured logging and log aggregation',
      });
    }
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

function mapAnalysisToTechStack(analysis: BasicAnalysis): any {
  const stack: any = {};

  // Frontend
  if (analysis.techStack.includes('React')) stack.frontend = 'react';
  else if (analysis.techStack.includes('Next.js')) stack.frontend = 'nextjs';
  else if (analysis.techStack.includes('Vue.js')) stack.frontend = 'vue';
  else if (analysis.techStack.includes('Angular')) stack.frontend = 'angular';

  // Backend
  if (analysis.techStack.includes('Express.js')) stack.backend = 'express';
  else if (analysis.techStack.includes('Fastify')) stack.backend = 'fastify';
  else if (analysis.techStack.includes('FastAPI')) stack.backend = 'fastapi';
  else if (analysis.techStack.includes('Django')) stack.backend = 'django';

  // Database
  if (analysis.techStack.includes('MongoDB')) stack.database = 'mongodb';
  else if (analysis.techStack.includes('PostgreSQL')) stack.database = 'postgresql';
  else if (analysis.techStack.includes('MySQL')) stack.database = 'mysql';

  return stack;
}

function estimateTotalDuration(features: FeatureRequirement[]): string {
  // Calculate total days based on complexity
  let totalDays = 0;

  features.forEach((feature) => {
    const effort = feature.estimatedEffort.toLowerCase();
    if (effort.includes('hour')) {
      totalDays += 0.5;
    } else if (effort.includes('day')) {
      const days = parseInt(effort.match(/\d+/)?.[0] || '1');
      totalDays += days;
    } else if (effort.includes('week')) {
      const weeks = parseInt(effort.match(/\d+/)?.[0] || '1');
      totalDays += weeks * 5; // 5 working days per week
    }
  });

  // Add overhead for integration and testing
  totalDays *= 1.3;

  if (totalDays < 5) return `${Math.ceil(totalDays)} days`;
  if (totalDays < 20) return `${Math.ceil(totalDays / 5)} weeks`;
  return `${Math.ceil(totalDays / 20)} months`;
}

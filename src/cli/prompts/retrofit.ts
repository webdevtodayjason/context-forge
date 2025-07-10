import { ProjectConfig, SupportedIDE, Feature } from '../../types';
import { BasicAnalysis, DetailedAnalysis } from '../../services/projectAnalyzer';
import { projectInfo } from './projectInfo';
import { ideSelection } from './ideSelection';
import { prdInput } from './prdInput';
import { projectConfig } from './projectConfig';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface PRDResult {
  content: string;
  problemStatement?: string;
  targetUsers?: string;
  userStories?: string[];
}

export async function runRetrofitPrompts(
  basicAnalysis: BasicAnalysis,
  detailedAnalysis: DetailedAnalysis | null,
  ideOverride?: SupportedIDE[]
): Promise<ProjectConfig> {
  console.log(chalk.blue.bold('\n🔧 Retrofitting Configuration\n'));
  console.log(chalk.gray("Based on your project analysis, let's configure Context Forge.\n"));

  // Step 1: Confirm or adjust project info
  const confirmedInfo = await confirmProjectInfo(basicAnalysis);

  // Step 2: IDE selection (use override or ask)
  const targetIDEs = ideOverride || (await ideSelection());

  // Step 3: PRD input (different flow for retrofit)
  const prd = await retrofitPrdInput(basicAnalysis, detailedAnalysis);

  // Step 4: Project configuration
  const config = await projectConfig();

  // Step 5: Feature selection based on analysis
  const selectedFeatures = await retrofitFeatures(basicAnalysis, detailedAnalysis);

  return {
    ...confirmedInfo,
    targetIDEs,
    prd,
    techStack: mapAnalysisToTechStack(basicAnalysis),
    features: selectedFeatures,
    ...config,
  };
}

async function confirmProjectInfo(analysis: BasicAnalysis) {
  console.log(chalk.cyan('📋 Project Information'));
  console.log(chalk.gray('We detected the following about your project:\n'));

  console.log(`  • Type: ${analysis.projectType}`);
  console.log(`  • Tech Stack: ${analysis.techStack.join(', ')}`);
  console.log(
    `  • Files: ${analysis.fileStats.total} total, ${analysis.fileStats.components} components`
  );

  const { confirmInfo } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmInfo',
      message: 'Is this information correct?',
      default: true,
    },
  ]);

  if (confirmInfo) {
    // Use detected information and ask for basic details
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
        message: 'Project description:',
        validate: (input: string) => input.trim().length > 0 || 'Description is required',
      },
    ]);

    return {
      projectName: projectName.trim(),
      description: description.trim(),
      projectType: analysis.projectType.toLowerCase(),
    };
  } else {
    // Fall back to manual entry
    return await projectInfo();
  }
}

async function retrofitPrdInput(
  basicAnalysis: BasicAnalysis,
  detailedAnalysis: DetailedAnalysis | null
): Promise<PRDResult> {
  console.log(chalk.cyan('\n📝 Product Requirements'));

  const hasExistingDocs = basicAnalysis.existingDocs.length > 0;

  if (hasExistingDocs) {
    console.log(
      chalk.gray(`Found existing documentation: ${basicAnalysis.existingDocs.join(', ')}`)
    );

    const { useExistingDocs } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useExistingDocs',
        message: 'Use existing documentation as basis for PRD?',
        default: true,
      },
    ]);

    if (useExistingDocs) {
      const { additionalRequirements } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'additionalRequirements',
          message: 'Any additional requirements or clarifications?',
          default: '',
        },
      ]);

      return {
        content: `Based on existing project documentation and analysis:\n\n${additionalRequirements}`,
      };
    }
  }

  // Generate auto-PRD suggestion based on analysis
  const suggestedPrd = generateAutoPrd(basicAnalysis, detailedAnalysis);

  console.log(chalk.gray("\nBased on your codebase analysis, here's a suggested PRD:\n"));
  console.log(chalk.dim(suggestedPrd.substring(0, 300) + '...'));

  const { prdChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'prdChoice',
      message: 'How would you like to handle the PRD?',
      choices: [
        { name: 'Use AI-generated PRD based on analysis', value: 'auto' },
        { name: 'Write custom PRD', value: 'custom' },
        { name: 'Enhance AI-generated PRD', value: 'enhance' },
      ],
    },
  ]);

  switch (prdChoice) {
    case 'auto':
      return { content: suggestedPrd };
    case 'custom':
      return await prdInput();
    case 'enhance':
      const { enhancedPrd } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'enhancedPrd',
          message: 'Enhance the generated PRD:',
          default: suggestedPrd,
        },
      ]);
      return { content: enhancedPrd };
    default:
      return { content: suggestedPrd };
  }
}

async function retrofitFeatures(
  basicAnalysis: BasicAnalysis,
  _detailedAnalysis: DetailedAnalysis | null
): Promise<Feature[]> {
  console.log(chalk.cyan('\n🎯 Feature Selection'));

  // Suggest features based on analysis
  const suggestedFeatures = detectFeaturesFromAnalysis(basicAnalysis);

  if (suggestedFeatures.length > 0) {
    console.log(chalk.gray('Detected features in your project:'));
    suggestedFeatures.forEach((feature) => {
      console.log(`  • ${feature}`);
    });

    const { confirmFeatures } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmFeatures',
        message: 'Include these detected features?',
        default: true,
      },
    ]);

    if (confirmFeatures) {
      return suggestedFeatures.map((featureName, index) => ({
        id: `detected-${index}`,
        name: featureName,
        description: `Detected from project analysis: ${featureName}`,
        priority: 'must-have' as const,
        complexity: 'medium' as const,
        category: 'integration' as const,
      }));
    }
  }

  // Manual feature selection
  const { features: manualFeatures } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features for your project:',
      choices: [
        'Authentication & Authorization',
        'Database Integration',
        'API Development',
        'Frontend Components',
        'State Management',
        'Testing Framework',
        'Deployment Pipeline',
        'Monitoring & Analytics',
        'File Upload/Storage',
        'Real-time Features',
        'Search Functionality',
        'Payment Integration',
        'Email/Notifications',
        'Admin Dashboard',
        'Mobile Responsive',
      ],
    },
  ]);

  return manualFeatures.map((featureName: string, index: number) => ({
    id: `manual-${index}`,
    name: featureName,
    description: `Manually selected feature: ${featureName}`,
    priority: 'must-have' as const,
    complexity: 'medium' as const,
    category: 'integration' as const,
  }));
}

function mapAnalysisToTechStack(analysis: BasicAnalysis): any {
  // Map the detected tech stack to our expected format
  const stack: any = {};

  // Frontend
  if (analysis.techStack.includes('React')) stack.frontend = 'react';
  else if (analysis.techStack.includes('Next.js')) stack.frontend = 'nextjs';
  else if (analysis.techStack.includes('Vue.js')) stack.frontend = 'vue';
  else if (analysis.techStack.includes('Angular')) stack.frontend = 'angular';

  // Backend
  if (analysis.techStack.includes('Express.js')) stack.backend = 'express';
  else if (analysis.techStack.includes('Fastify')) stack.backend = 'fastify';
  else if (analysis.projectType.includes('Python')) stack.backend = 'fastapi';

  // Database
  if (analysis.techStack.includes('MongoDB')) stack.database = 'mongodb';
  else if (analysis.techStack.includes('PostgreSQL')) stack.database = 'postgresql';
  else if (analysis.techStack.includes('MySQL')) stack.database = 'mysql';
  else if (analysis.techStack.includes('SQLite')) stack.database = 'sqlite';

  // Auth
  stack.auth = 'jwt'; // Default assumption

  return stack;
}

function generateAutoPrd(
  basicAnalysis: BasicAnalysis,
  detailedAnalysis: DetailedAnalysis | null
): string {
  const { projectType, techStack, fileStats } = basicAnalysis;

  return `# Product Requirements Document

## Project Overview
This is a ${projectType} application built with ${techStack.join(', ')}.

## Current State Analysis
- **Total Files**: ${fileStats.total}
- **Components**: ${fileStats.components}
- **API Routes**: ${fileStats.routes}
- **Test Coverage**: ${fileStats.tests} test files
- **Configuration Files**: ${fileStats.config}

## Technology Stack
${techStack.map((tech) => `- ${tech}`).join('\n')}

## Key Features
Based on the codebase analysis, this application appears to include:
${detectFeaturesFromAnalysis(basicAnalysis)
  .map((feature) => `- ${feature}`)
  .join('\n')}

${
  detailedAnalysis
    ? `## AI Insights
${detailedAnalysis.insights.map((insight) => `- ${insight}`).join('\n')}

## Recommendations
${detailedAnalysis.recommendations.map((rec) => `- ${rec}`).join('\n')}`
    : ''
}

## Development Goals
1. Maintain existing functionality while improving code organization
2. Enhance documentation for better developer experience
3. Implement best practices for ${projectType} development
4. Ensure scalable architecture for future growth

## Success Criteria
- Clear, comprehensive documentation
- Well-organized codebase structure
- Improved developer onboarding experience
- Enhanced AI assistant integration`;
}

function detectFeaturesFromAnalysis(analysis: BasicAnalysis): string[] {
  const features: string[] = [];

  if (analysis.fileStats.routes > 0) features.push('API Development');
  if (analysis.fileStats.components > 0) features.push('Frontend Components');
  if (analysis.techStack.includes('MongoDB') || analysis.techStack.includes('PostgreSQL')) {
    features.push('Database Integration');
  }
  if (analysis.fileStats.tests > 0) features.push('Testing Framework');
  if (analysis.techStack.includes('TypeScript')) features.push('Type Safety');
  if (analysis.techStack.includes('Tailwind CSS')) features.push('Styling System');
  if (analysis.techStack.includes('Prisma')) features.push('ORM Integration');
  if (analysis.techStack.includes('Docker')) features.push('Containerization');

  return features;
}

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { SupportedIDE } from '../types';
import { getSupportedIDEs } from '../adapters';

export async function validateOutputPath(
  outputPath: string,
  preserveExisting?: boolean
): Promise<void> {
  try {
    await fs.ensureDir(outputPath);

    // Check if directory is writable
    await fs.access(outputPath, fs.constants.W_OK);

    // Check if docs already exist
    const claudePath = path.join(outputPath, 'CLAUDE.md');
    const docsPath = path.join(outputPath, 'Docs');

    if ((await fs.pathExists(claudePath)) || (await fs.pathExists(docsPath))) {
      if (preserveExisting) {
        console.log(chalk.blue('\n📁 Existing documentation detected - preserving existing files'));
        console.log(
          chalk.gray(
            '   Context Forge will skip conflicting files and preserve your existing documentation'
          )
        );
        return;
      }

      console.log(chalk.yellow('\n⚠️  Context engineering files already exist in this directory.'));
      console.log(chalk.gray('   Files that may be overwritten:'));
      if (await fs.pathExists(claudePath)) {
        console.log(chalk.gray(`   • ${path.relative(outputPath, claudePath)}`));
      }
      if (await fs.pathExists(docsPath)) {
        console.log(chalk.gray(`   • ${path.relative(outputPath, docsPath)}/`));
      }
      console.log(chalk.gray('   Use --preserve-existing to skip overwriting files'));

      const { confirm } = await import('inquirer').then((m) =>
        m.default.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to overwrite existing files?',
            default: false,
          },
        ])
      );

      if (!confirm) {
        throw new Error('Operation cancelled by user');
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
      throw new Error(`No write permission for directory: ${outputPath}`);
    }
    throw error;
  }
}

export function validateProjectName(name: string): boolean | string {
  if (!name || name.trim().length === 0) {
    return 'Project name is required';
  }

  if (name.length > 100) {
    return 'Project name must be less than 100 characters';
  }

  // Check for valid npm package name pattern
  const validPattern = /^[a-zA-Z0-9-_]+$/;
  if (!validPattern.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, and underscores';
  }

  return true;
}

export function validateDescription(description: string): boolean | string {
  if (!description || description.trim().length === 0) {
    return 'Description is required';
  }

  if (description.length < 10) {
    return 'Description must be at least 10 characters';
  }

  if (description.length > 500) {
    return 'Description must be less than 500 characters';
  }

  return true;
}

export function validatePRD(prd: string): boolean | string {
  if (!prd || prd.trim().length === 0) {
    return 'PRD content is required';
  }

  if (prd.length < 50) {
    return 'PRD should be at least 50 characters to be meaningful';
  }

  return true;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateTemplateFile(configPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check if file exists
    if (!(await fs.pathExists(configPath))) {
      result.isValid = false;
      result.errors.push(`Template file not found: ${configPath}`);
      return result;
    }

    // Read and parse JSON
    let config: any;
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch (parseError) {
      result.isValid = false;
      result.errors.push(`Invalid JSON format: ${(parseError as Error).message}`);
      return result;
    }

    // Validate configuration structure
    const structureValidation = validateConfigStructure(config);
    result.errors.push(...structureValidation.errors);
    result.warnings.push(...structureValidation.warnings);

    if (structureValidation.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to validate template: ${(error as Error).message}`);
    return result;
  }
}

export function validateConfigStructure(config: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Required fields validation
  const requiredFields = ['projectName', 'projectType', 'description', 'techStack', 'targetIDEs'];

  for (const field of requiredFields) {
    if (!config[field]) {
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  // Project name validation
  if (config.projectName) {
    const nameValidation = validateProjectName(config.projectName);
    if (nameValidation !== true) {
      result.errors.push(`Invalid project name: ${nameValidation}`);
    }
  }

  // Project type validation
  if (config.projectType) {
    const validProjectTypes = ['web', 'mobile', 'desktop', 'api', 'fullstack'];
    if (!validProjectTypes.includes(config.projectType)) {
      result.errors.push(
        `Invalid project type: ${config.projectType}. Valid options: ${validProjectTypes.join(', ')}`
      );
    }
  }

  // Description validation
  if (config.description) {
    const descValidation = validateDescription(config.description);
    if (descValidation !== true) {
      result.errors.push(`Invalid description: ${descValidation}`);
    }
  }

  // Tech stack validation
  if (config.techStack) {
    const techStackValidation = validateTechStack(config.techStack);
    result.errors.push(...techStackValidation.errors);
    result.warnings.push(...techStackValidation.warnings);
  }

  // Target IDEs validation
  if (config.targetIDEs) {
    const ideValidation = validateTargetIDEs(config.targetIDEs);
    result.errors.push(...ideValidation.errors);
    result.warnings.push(...ideValidation.warnings);
  }

  // Features validation
  if (config.features) {
    const featuresValidation = validateFeatures(config.features);
    result.errors.push(...featuresValidation.errors);
    result.warnings.push(...featuresValidation.warnings);
  }

  // Timeline validation
  if (config.timeline) {
    const validTimelines = ['mvp', 'standard', 'enterprise'];
    if (!validTimelines.includes(config.timeline)) {
      result.errors.push(
        `Invalid timeline: ${config.timeline}. Valid options: ${validTimelines.join(', ')}`
      );
    }
  }

  // Team size validation
  if (config.teamSize) {
    const validTeamSizes = ['solo', 'small', 'medium', 'large'];
    if (!validTeamSizes.includes(config.teamSize)) {
      result.errors.push(
        `Invalid team size: ${config.teamSize}. Valid options: ${validTeamSizes.join(', ')}`
      );
    }
  }

  // Extras validation
  if (config.extras) {
    const extrasValidation = validateExtras(config.extras);
    result.errors.push(...extrasValidation.errors);
    result.warnings.push(...extrasValidation.warnings);
  }

  if (result.errors.length > 0) {
    result.isValid = false;
  }

  return result;
}

function validateTechStack(techStack: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (typeof techStack !== 'object' || techStack === null) {
    result.errors.push('Tech stack must be an object');
    return result;
  }

  // Validate frontend options
  if (techStack.frontend) {
    const validFrontends = [
      'react',
      'nextjs',
      'vue',
      'nuxt4',
      'angular',
      'svelte',
      'vanilla',
      'none',
    ];
    if (!validFrontends.includes(techStack.frontend)) {
      result.errors.push(
        `Invalid frontend: ${techStack.frontend}. Valid options: ${validFrontends.join(', ')}`
      );
    }
  }

  // Validate backend options
  if (techStack.backend) {
    const validBackends = [
      'express',
      'fastapi',
      'django',
      'flask',
      'spring-boot',
      'rails',
      'aspnet',
      'go',
      'none',
    ];
    if (!validBackends.includes(techStack.backend)) {
      result.errors.push(
        `Invalid backend: ${techStack.backend}. Valid options: ${validBackends.join(', ')}`
      );
    }
  }

  // Validate database options
  if (techStack.database) {
    const validDatabases = [
      'postgresql',
      'mysql',
      'mongodb',
      'sqlite',
      'redis-postgresql',
      'redis-mongodb',
      'supabase',
      'firebase',
      'none',
    ];
    if (!validDatabases.includes(techStack.database)) {
      result.errors.push(
        `Invalid database: ${techStack.database}. Valid options: ${validDatabases.join(', ')}`
      );
    }
  }

  // Validate auth options
  if (techStack.auth) {
    const validAuth = [
      'jwt',
      'oauth',
      'session',
      'magic-links',
      'supabase-auth',
      'firebase-auth',
      'auth0',
      'clerk',
      'none',
    ];
    if (!validAuth.includes(techStack.auth)) {
      result.errors.push(`Invalid auth: ${techStack.auth}. Valid options: ${validAuth.join(', ')}`);
    }
  }

  // Validate styling options
  if (techStack.styling) {
    const validStyling = ['tailwind', 'css-modules', 'styled-components', 'emotion', 'sass', 'css'];
    if (!validStyling.includes(techStack.styling)) {
      result.warnings.push(
        `Unknown styling framework: ${techStack.styling}. Common options: ${validStyling.join(', ')}`
      );
    }
  }

  return result;
}

function validateTargetIDEs(targetIDEs: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!Array.isArray(targetIDEs)) {
    result.errors.push('Target IDEs must be an array');
    return result;
  }

  if (targetIDEs.length === 0) {
    result.errors.push('At least one target IDE must be specified');
    return result;
  }

  const supportedIDEs = getSupportedIDEs();
  for (const ide of targetIDEs) {
    if (!supportedIDEs.includes(ide as SupportedIDE)) {
      result.errors.push(`Invalid IDE: ${ide}. Valid options: ${supportedIDEs.join(', ')}`);
    }
  }

  return result;
}

function validateFeatures(features: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!Array.isArray(features)) {
    result.errors.push('Features must be an array');
    return result;
  }

  const validPriorities = ['must-have', 'should-have', 'nice-to-have'];
  const validComplexities = ['simple', 'medium', 'complex', 'very-complex'];
  const validCategories = [
    'auth',
    'ui',
    'data',
    'integration',
    'infrastructure',
    'api',
    'database',
    'security',
    'testing',
    'feature',
  ];

  features.forEach((feature, index) => {
    const featurePrefix = `Feature ${index + 1}`;

    // Required fields for features
    if (!feature.id) {
      result.errors.push(`${featurePrefix}: Missing required field 'id'`);
    }
    if (!feature.name) {
      result.errors.push(`${featurePrefix}: Missing required field 'name'`);
    }
    if (!feature.description) {
      result.errors.push(`${featurePrefix}: Missing required field 'description'`);
    }

    // Validate priority
    if (feature.priority && !validPriorities.includes(feature.priority)) {
      result.errors.push(
        `${featurePrefix}: Invalid priority '${feature.priority}'. Valid options: ${validPriorities.join(', ')}`
      );
    }

    // Validate complexity
    if (feature.complexity && !validComplexities.includes(feature.complexity)) {
      result.errors.push(
        `${featurePrefix}: Invalid complexity '${feature.complexity}'. Valid options: ${validComplexities.join(', ')}`
      );
    }

    // Validate category
    if (feature.category && !validCategories.includes(feature.category)) {
      result.errors.push(
        `${featurePrefix}: Invalid category '${feature.category}'. Valid options: ${validCategories.join(', ')}`
      );
    }

    // Validate subtasks is array
    if (feature.subtasks && !Array.isArray(feature.subtasks)) {
      result.errors.push(`${featurePrefix}: Subtasks must be an array`);
    }

    // Validate dependencies is array
    if (feature.dependencies && !Array.isArray(feature.dependencies)) {
      result.errors.push(`${featurePrefix}: Dependencies must be an array`);
    }

    // Validate acceptance criteria is array
    if (feature.acceptanceCriteria && !Array.isArray(feature.acceptanceCriteria)) {
      result.errors.push(`${featurePrefix}: Acceptance criteria must be an array`);
    }

    // Validate technical requirements is array
    if (feature.technicalRequirements && !Array.isArray(feature.technicalRequirements)) {
      result.errors.push(`${featurePrefix}: Technical requirements must be an array`);
    }
  });

  return result;
}

function validateExtras(extras: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (typeof extras !== 'object' || extras === null) {
    result.errors.push('Extras must be an object');
    return result;
  }

  // All extras fields should be boolean
  const booleanFields = [
    'docker',
    'cicd',
    'testing',
    'linting',
    'examples',
    'prp',
    'aiPrp',
    'aiDocs',
    'claudeCommands',
    'hooks',
    'checkpoints',
    'dartIntegration',
  ];

  for (const field of booleanFields) {
    if (extras[field] !== undefined && typeof extras[field] !== 'boolean') {
      result.errors.push(`Extras.${field} must be a boolean value`);
    }
  }

  return result;
}

export function printValidationResults(results: ValidationResult, configPath: string): void {
  if (results.isValid) {
    console.log(chalk.green('✅ Template validation passed'));
    if (results.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      results.warnings.forEach((warning) => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }
  } else {
    console.log(chalk.red('❌ Template validation failed'));
    console.log(chalk.red('\nErrors:'));
    results.errors.forEach((error) => {
      console.log(chalk.red(`   • ${error}`));
    });

    if (results.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      results.warnings.forEach((warning) => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }

    console.log(chalk.blue('\n💡 Tips:'));
    console.log(chalk.gray('   • Check the template file syntax and structure'));
    console.log(chalk.gray('   • Refer to the generated template for valid field values'));
    console.log(chalk.gray(`   • Template location: ${configPath}`));
  }
}

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { validatePRD } from '../../utils/validator';

interface PRDResult {
  content: string;
  problemStatement?: string;
  targetUsers?: string;
  userStories?: string[];
}

export async function prdInput(): Promise<PRDResult> {
  const { hasPRD } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasPRD',
      message: 'Do you have a Product Requirements Document (PRD)?',
      default: true,
    },
  ]);

  if (hasPRD) {
    const { inputMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'inputMethod',
        message: 'How would you like to provide the PRD?',
        choices: [
          { name: 'Type/paste it here', value: 'type' },
          { name: 'Load from file (prd.md)', value: 'file' },
          { name: 'Create one through guided questions', value: 'guided' },
        ],
      },
    ]);

    switch (inputMethod) {
      case 'type':
        return await typePRD();
      case 'file':
        return await loadPRDFromFile();
      case 'guided':
        return await guidedPRD();
    }
  }

  // If no PRD, use guided questions
  return await guidedPRD();
}

async function typePRD(): Promise<PRDResult> {
  console.log('\n📝 Please paste your PRD content below.');
  console.log('   (Press Enter twice when done)\n');

  const { prdContent } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'prdContent',
      message: 'PRD content:',
      validate: validatePRD,
    },
  ]);

  return {
    content: prdContent,
  };
}

async function loadPRDFromFile(): Promise<PRDResult> {
  const { filePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Path to PRD file:',
      default: 'prd.md',
      validate: async (input) => {
        const resolvedPath = path.resolve(input);
        const exists = await fs.pathExists(resolvedPath);
        if (!exists) {
          return `File not found: ${resolvedPath}`;
        }
        const stats = await fs.stat(resolvedPath);
        if (!stats.isFile()) {
          return 'Path must be a file, not a directory';
        }
        return true;
      },
    },
  ]);

  try {
    const content = await fs.readFile(path.resolve(filePath), 'utf-8');
    return {
      content,
    };
  } catch (error) {
    throw new Error(
      `Failed to read PRD file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function guidedPRD(): Promise<PRDResult> {
  console.log("\n🎯 Let's create a PRD through guided questions.\n");

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'problemStatement',
      message: 'What problem does this solve?',
      validate: (input) => input.length > 10 || 'Please provide a detailed problem statement',
    },
    {
      type: 'input',
      name: 'targetUsers',
      message: 'Who are the target users?',
      validate: (input) => input.length > 5 || 'Please describe your target users',
    },
    {
      type: 'editor',
      name: 'userStories',
      message: 'What are the main user stories? (one per line)',
      validate: (input) => input.trim().length > 0 || 'Please provide at least one user story',
    },
    {
      type: 'editor',
      name: 'coreFeatures',
      message: 'List the core features (one per line):',
      validate: (input) => input.trim().length > 0 || 'Please list at least one core feature',
    },
    {
      type: 'input',
      name: 'successMetrics',
      message: 'How will you measure success?',
      default: 'User engagement, task completion rate, user satisfaction',
    },
    {
      type: 'list',
      name: 'scope',
      message: 'Project scope:',
      choices: [
        { name: 'MVP - Essential features only', value: 'mvp' },
        { name: 'Standard - Core features + nice-to-haves', value: 'standard' },
        { name: 'Full Product - All features', value: 'full' },
      ],
    },
  ]);

  // Parse user stories
  const userStories = answers.userStories
    .split('\n')
    .map((story: string) => story.trim())
    .filter((story: string) => story.length > 0);

  // Parse core features
  const coreFeatures = answers.coreFeatures
    .split('\n')
    .map((feature: string) => feature.trim())
    .filter((feature: string) => feature.length > 0);

  // Generate PRD content
  const content = `# Product Requirements Document

## Problem Statement
${answers.problemStatement}

## Target Users
${answers.targetUsers}

## User Stories
${userStories.map((story: string) => `- ${story}`).join('\n')}

## Core Features
${coreFeatures.map((feature: string) => `- ${feature}`).join('\n')}

## Success Metrics
${answers.successMetrics}

## Project Scope
${answers.scope === 'mvp' ? 'MVP - Essential features only' : answers.scope === 'standard' ? 'Standard - Core features + nice-to-haves' : 'Full Product - All features'}

## Technical Requirements
- Must be scalable and maintainable
- Should follow best practices for the chosen tech stack
- Must include proper error handling and logging
- Should have comprehensive testing coverage

## Timeline
Based on the ${answers.scope} scope, estimated timeline will be determined during implementation planning.
`;

  return {
    content,
    problemStatement: answers.problemStatement,
    targetUsers: answers.targetUsers,
    userStories,
  };
}

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function validateOutputPath(outputPath: string): Promise<void> {
  try {
    await fs.ensureDir(outputPath);

    // Check if directory is writable
    await fs.access(outputPath, fs.constants.W_OK);

    // Check if docs already exist
    const claudePath = path.join(outputPath, 'CLAUDE.md');
    const docsPath = path.join(outputPath, 'Docs');

    if ((await fs.pathExists(claudePath)) || (await fs.pathExists(docsPath))) {
      console.log(chalk.yellow('\n⚠️  Context engineering files already exist in this directory.'));
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

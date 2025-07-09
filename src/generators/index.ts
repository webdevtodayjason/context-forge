import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { ProjectConfig } from '../types';
import { generateClaudeMd } from './claudeMd';
import { generateImplementation } from './implementation';
import { generateProjectStructure } from './projectStructure';
import { generateUiUx } from './uiUx';
import { generateBugTracking } from './bugTracking';
import { generatePRP } from './prp';

export async function generateDocumentation(
  config: ProjectConfig,
  outputPath: string
): Promise<void> {
  const docsPath = path.join(outputPath, 'Docs');

  // Ensure directories exist
  await fs.ensureDir(outputPath);
  await fs.ensureDir(docsPath);

  // Create additional directories based on extras
  if (config.extras.prp) {
    await fs.ensureDir(path.join(outputPath, 'PRPs'));
  }
  if (config.extras.aiDocs) {
    await fs.ensureDir(path.join(outputPath, 'ai_docs'));
  }
  if (config.extras.claudeCommands) {
    await fs.ensureDir(path.join(outputPath, '.claude', 'commands'));
  }

  const generators = [
    {
      name: 'CLAUDE.md',
      path: path.join(outputPath, 'CLAUDE.md'),
      generator: () => generateClaudeMd(config),
    },
    {
      name: 'Implementation.md',
      path: path.join(docsPath, 'Implementation.md'),
      generator: () => generateImplementation(config),
    },
    {
      name: 'project_structure.md',
      path: path.join(docsPath, 'project_structure.md'),
      generator: () => generateProjectStructure(config),
    },
    {
      name: 'UI_UX_doc.md',
      path: path.join(docsPath, 'UI_UX_doc.md'),
      generator: () => generateUiUx(config),
    },
    {
      name: 'Bug_tracking.md',
      path: path.join(docsPath, 'Bug_tracking.md'),
      generator: () => generateBugTracking(config),
    },
  ];

  // Add PRP generation if enabled
  if (config.extras.prp) {
    generators.push({
      name: 'PRP (Base)',
      path: path.join(
        outputPath,
        'PRPs',
        `${config.projectName.toLowerCase().replace(/\s+/g, '-')}-prp.md`
      ),
      generator: () => generatePRP(config, 'base'),
    });

    // Generate planning PRP if it's a complex project
    if (config.timeline === 'enterprise' || config.teamSize !== 'solo') {
      generators.push({
        name: 'PRP (Planning)',
        path: path.join(
          outputPath,
          'PRPs',
          `${config.projectName.toLowerCase().replace(/\s+/g, '-')}-planning.md`
        ),
        generator: () => generatePRP(config, 'planning'),
      });
    }
  }

  // Generate AI docs readme if enabled
  if (config.extras.aiDocs) {
    generators.push({
      name: 'AI Docs README',
      path: path.join(outputPath, 'ai_docs', 'README.md'),
      generator: () => generateAIDocsReadme(config),
    });
  }

  for (const { name, path: filePath, generator } of generators) {
    const spinner = ora(`Generating ${name}...`).start();
    try {
      const content = await generator();
      await fs.writeFile(filePath, content, 'utf-8');
      spinner.succeed(`Generated ${name}`);
    } catch (error) {
      spinner.fail(`Failed to generate ${name}`);
      throw error;
    }
  }

  console.log(chalk.green('\n✅ All documentation files generated successfully!'));
}

async function generateAIDocsReadme(config: ProjectConfig): Promise<string> {
  return `# AI Documentation

This directory contains curated documentation for AI-assisted development with Claude Code.

## Purpose

Place library documentation, API references, and other technical documentation here that should be included in the AI's context when working on this project.

## Usage

1. Add markdown files with relevant documentation
2. Reference these files in your PRPs using:
   \`\`\`yaml
   - docfile: ai_docs/library-name.md
     why: Specific sections or methods needed
   \`\`\`

## Recommended Documentation

Based on your tech stack (${Object.values(config.techStack).filter(Boolean).join(', ')}), consider adding:

${generateRecommendedDocs(config.techStack)}

## File Naming Convention

- Use lowercase with hyphens: \`library-name.md\`
- Be descriptive: \`fastapi-security-best-practices.md\`
- Version if needed: \`react-19-hooks.md\`
`;
}

function generateRecommendedDocs(techStack: ProjectConfig['techStack']): string {
  const recommendations = [];

  if (techStack.frontend === 'nextjs') {
    recommendations.push('- Next.js 15 App Router patterns');
    recommendations.push('- React Server Components guide');
  }

  if (techStack.backend === 'fastapi') {
    recommendations.push('- FastAPI async patterns');
    recommendations.push('- Pydantic v2 migration guide');
  }

  if (techStack.database === 'postgresql') {
    recommendations.push('- PostgreSQL optimization tips');
    recommendations.push('- Common SQL patterns');
  }

  if (techStack.auth === 'jwt') {
    recommendations.push('- JWT best practices');
    recommendations.push('- Security considerations');
  }

  return recommendations.join('\n') || '- Add relevant documentation for your tech stack';
}

import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { ProjectConfig } from '../types';
import { createAdapter, getIDEInfo } from '../adapters';

export async function generateDocumentation(
  config: ProjectConfig,
  outputPath: string
): Promise<void> {
  // Ensure output directory exists
  await fs.ensureDir(outputPath);

  // Default to Claude if no IDEs specified
  const targetIDEs = config.targetIDEs || ['claude'];

  console.log(chalk.blue(`\n📝 Generating documentation for ${targetIDEs.length} IDE(s)...\n`));

  // Generate files for each selected IDE
  for (const ide of targetIDEs) {
    const ideInfo = getIDEInfo(ide);
    console.log(chalk.cyan(`\nGenerating ${ideInfo.name} configuration...`));

    try {
      const adapter = createAdapter(ide, config);
      const files = await adapter.generateFiles(outputPath);

      // Create necessary directories and write files
      for (const file of files) {
        const spinner = ora(`Creating ${path.basename(file.path)}...`).start();
        try {
          await fs.ensureDir(path.dirname(file.path));
          
          // Check if file already exists
          if (await fs.pathExists(file.path)) {
            // Special handling for CLAUDE.md in retrofit mode
            if (config.isRetrofit && path.basename(file.path) === 'CLAUDE.md') {
              spinner.info(`Appending to existing ${path.basename(file.path)}...`);
              const existingContent = await fs.readFile(file.path, 'utf-8');
              const retrofitSection = `\n\n<!-- ===== APPENDED BY CONTEXT FORGE RETROFIT - ${new Date().toLocaleDateString()} ===== -->\n\n## Retrofit Updates - ${new Date().toLocaleDateString()}\n\n${file.content}`;
              await fs.writeFile(file.path, existingContent + retrofitSection, 'utf-8');
              spinner.succeed(`Updated ${path.basename(file.path)}`);
            } else {
              spinner.warn(`Skipped ${path.basename(file.path)} - file already exists`);
            }
            continue;
          }
          
          await fs.writeFile(file.path, file.content, 'utf-8');
          spinner.succeed(`Created ${path.basename(file.path)}`);
        } catch (error) {
          spinner.fail(`Failed to create ${path.basename(file.path)}`);
          throw error;
        }
      }

      console.log(chalk.green(`✓ ${ideInfo.name} configuration complete`));
    } catch (error) {
      if ((error as Error).message.includes('not yet implemented')) {
        console.log(chalk.yellow(`⚠️  ${ideInfo.name} adapter coming soon`));
      } else {
        throw error;
      }
    }
  }

  // Generate common directories if needed
  if (config.extras.aiDocs) {
    await fs.ensureDir(path.join(outputPath, 'ai_docs'));
    const aiDocsContent = await generateAIDocsReadme(config);
    await fs.writeFile(path.join(outputPath, 'ai_docs', 'README.md'), aiDocsContent, 'utf-8');
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

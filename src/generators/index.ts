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

export async function generateDocumentation(
  config: ProjectConfig,
  outputPath: string
): Promise<void> {
  const docsPath = path.join(outputPath, 'Docs');

  // Ensure directories exist
  await fs.ensureDir(outputPath);
  await fs.ensureDir(docsPath);

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

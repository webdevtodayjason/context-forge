import { IDEAdapter, GeneratedFile } from './base';
import path from 'path';
import fs from 'fs-extra';
import { generateClaudeMd } from '../generators/claudeMd';
import { generateImplementation } from '../generators/implementation';
import { generateProjectStructure } from '../generators/projectStructure';
import { generateUiUx } from '../generators/uiUx';
import { generateBugTracking } from '../generators/bugTracking';
import { generatePRP } from '../generators/prp';
import { generateAIEnhancedPRP } from '../generators/aiPrp';
import { generateSlashCommands, generateSlashCommandFiles } from '../generators/slashCommands';

export class ClaudeAdapter extends IDEAdapter {
  get name(): string {
    return 'Claude Code';
  }

  get description(): string {
    return "Anthropic's official CLI for Claude (recommended)";
  }

  get configFiles(): string[] {
    return ['CLAUDE.md', 'Docs/', 'PRPs/', '.claude/'];
  }

  get supportsValidation(): boolean {
    return true;
  }

  get supportsPRP(): boolean {
    return true;
  }

  async generateFiles(outputPath: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const docsPath = path.join(outputPath, 'Docs');

    // Generate CLAUDE.md
    files.push({
      path: path.join(outputPath, 'CLAUDE.md'),
      content: await generateClaudeMd(this.config),
      description: 'Main context file for Claude Code',
    });

    // Generate Docs files
    files.push({
      path: path.join(docsPath, 'Implementation.md'),
      content: await generateImplementation(this.config),
      description: 'Staged development plan',
    });

    files.push({
      path: path.join(docsPath, 'project_structure.md'),
      content: await generateProjectStructure(this.config),
      description: 'Project organization guide',
    });

    files.push({
      path: path.join(docsPath, 'UI_UX_doc.md'),
      content: await generateUiUx(this.config),
      description: 'Design specifications',
    });

    files.push({
      path: path.join(docsPath, 'Bug_tracking.md'),
      content: await generateBugTracking(this.config),
      description: 'Bug tracking template',
    });

    // Generate PRPs if enabled
    if (this.config.extras.prp) {
      const prpPath = path.join(outputPath, 'PRPs');
      const projectSlug = this.config.projectName.toLowerCase().replace(/\s+/g, '-');

      // In retrofit mode, generate PRPs for planned features
      if (
        this.config.isRetrofit &&
        this.config.plannedFeatures &&
        this.config.plannedFeatures.length > 0
      ) {
        // Generate a PRP for each planned feature
        for (const feature of this.config.plannedFeatures) {
          const featureName = feature.split(':')[0].toLowerCase().replace(/\s+/g, '-');
          files.push({
            path: path.join(prpPath, `${featureName}-prp.md`),
            content: await generatePRP(
              {
                ...this.config,
                prd: {
                  ...this.config.prd,
                  content: `Feature: ${feature}`,
                },
              },
              'base'
            ),
            description: `PRP for: ${feature}`,
          });
        }
      } else {
        // Regular mode - generate base PRP
        files.push({
          path: path.join(prpPath, `${projectSlug}-prp.md`),
          content: await generatePRP(this.config, 'base'),
          description: 'Base implementation PRP',
        });

        // Generate individual PRPs for each feature
        if (this.config.features && this.config.features.length > 0) {
          // Ensure PRP directory exists
          await fs.ensureDir(prpPath);
          
          for (const feature of this.config.features) {
            const featureSlug = feature.id || feature.name.toLowerCase().replace(/\s+/g, '-');
            const useAI = this.config.extras.aiPrp || false;
            const filePath = path.join(prpPath, `feature-${featureSlug}-prp.md`);
            
            // Generate content
            const content = useAI 
              ? await generateAIEnhancedPRP(this.config, 'base', feature, true)
              : await generatePRP(this.config, 'base', feature);
            
            // Write file immediately so user can see progress
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`📝 Generated: ${path.relative(process.cwd(), filePath)}`);
            
            // Still add to files array for logging
            files.push({
              path: filePath,
              content: content,
              description: `PRP for ${feature.name} feature${useAI ? ' (AI-enhanced)' : ''}`,
            });
          }
        }

        // Add planning PRP for complex projects
        if (this.config.timeline === 'enterprise' || this.config.teamSize !== 'solo') {
          files.push({
            path: path.join(prpPath, `${projectSlug}-planning.md`),
            content: await generatePRP(this.config, 'planning'),
            description: 'Architecture planning PRP',
          });
        }
      }
    }

    // Generate slash commands
    const slashCommands = await generateSlashCommands(this.config);
    const commandFiles = generateSlashCommandFiles(slashCommands);
    files.push(...commandFiles);

    return files;
  }
}

import path from 'path';
import fs from 'fs-extra';
import { SupportedIDE } from '../types';
import { getSupportedIDEs } from '../adapters';

export interface TemplateGeneratorOptions {
  outputPath?: string;
  format?: 'json' | 'yaml';
  variant?: 'minimal' | 'standard' | 'comprehensive';
  includeComments?: boolean;
  aiSuggestions?: any;
}

export class TemplateGenerator {
  async generateTemplate(options: TemplateGeneratorOptions = {}): Promise<string> {
    const {
      outputPath = process.cwd(),
      format = 'json',
      variant = 'comprehensive',
      includeComments = true,
      aiSuggestions = null,
    } = options;

    const template = this.createTemplate(variant, aiSuggestions);
    const filename = `context-forge-template.${format}`;
    const filePath = path.join(outputPath, filename);

    if (format === 'json') {
      const jsonContent = this.generateJSONWithComments(template, includeComments);
      await fs.writeFile(filePath, jsonContent, 'utf-8');
    } else {
      // YAML support could be added here in the future
      throw new Error('YAML format not yet implemented');
    }

    return filePath;
  }

  private createTemplate(variant: string, aiSuggestions: any): any {
    const baseTemplate = {
      // Project Information (Required)
      projectName: aiSuggestions?.projectName || 'my-awesome-project',
      projectType: aiSuggestions?.projectType || 'web',
      description: aiSuggestions?.description || 'Brief description of your project',

      // PRD (Optional)
      prd: {
        content: 'Detailed product requirements document...',
        problemStatement: 'What problem does this project solve?',
        targetUsers: 'Who are the target users?',
        userStories: ['As a user, I want to...', 'As an admin, I need to...'],
      },

      // Tech Stack Configuration
      techStack: {
        frontend: aiSuggestions?.techStack?.frontend || 'react',
        backend: aiSuggestions?.techStack?.backend || 'express',
        database: aiSuggestions?.techStack?.database || 'postgresql',
        auth: aiSuggestions?.techStack?.auth || 'jwt',
        styling: aiSuggestions?.techStack?.styling || 'tailwind',
        stateManagement: aiSuggestions?.techStack?.stateManagement || 'redux-toolkit',
        orm: 'prisma',
      },

      // Features
      features: [
        {
          id: 'auth-system',
          name: 'Authentication System',
          description: 'User login, registration, and profile management',
          priority: 'must-have',
          complexity: 'medium',
          category: 'auth',
          subtasks: ['User registration', 'Login/logout', 'Password reset', 'Profile management'],
          dependencies: [],
          acceptanceCriteria: [
            'Users can register with email',
            'Users can login and logout',
            'Password reset functionality works',
          ],
          technicalRequirements: [
            'JWT token authentication',
            'Password hashing with bcrypt',
            'Email validation',
          ],
          risks: [
            {
              type: 'security',
              description: 'Password security vulnerabilities',
              mitigation: 'Use strong hashing algorithms and validation',
            },
          ],
          estimatedEffort: '1-2 weeks',
        },
      ],

      // Project Configuration
      timeline: 'standard',
      teamSize: 'solo',
      deployment: 'vercel',

      // Target IDE(s)
      targetIDEs: ['claude'],

      // Extras Configuration
      extras: {
        docker: false,
        cicd: false,
        testing: true,
        linting: true,
        examples: true,
        prp: true,
        aiPrp: false,
        aiDocs: false,
        claudeCommands: true,
        hooks: true,
        checkpoints: true,
        dartIntegration: false,
      },

      // Checkpoint Configuration (Optional)
      checkpointConfig: {
        enabled: true,
        triggers: [
          {
            id: 'feature-complete',
            name: 'Feature Complete',
            description: 'Triggered when a major feature is completed',
            category: 'important',
            autoTrigger: false,
            conditions: ['All tests pass', 'Code review completed'],
          },
        ],
        customMilestones: [
          {
            name: 'MVP Milestone',
            description: 'Core features are implemented and tested',
            testInstructions: [
              'Run full test suite',
              'Manual testing of core user flows',
              'Performance testing',
            ],
            verificationPoints: [
              'All critical features work',
              'No blocking bugs',
              'Performance meets requirements',
            ],
            triggerAfter: ['auth-system', 'core-features'],
            blocksUntilApproved: true,
          },
        ],
        notifications: {
          slack: {
            webhook: '',
            channel: '#dev-updates',
          },
        },
        customCommands: [],
      },
    };

    if (variant === 'minimal') {
      return {
        projectName: baseTemplate.projectName,
        projectType: baseTemplate.projectType,
        description: baseTemplate.description,
        techStack: {
          frontend: baseTemplate.techStack.frontend,
          backend: baseTemplate.techStack.backend,
          database: baseTemplate.techStack.database,
        },
        features: [],
        timeline: baseTemplate.timeline,
        teamSize: baseTemplate.teamSize,
        targetIDEs: baseTemplate.targetIDEs,
        extras: {
          testing: true,
          linting: true,
          prp: true,
        },
      };
    }

    if (variant === 'standard') {
      return {
        ...baseTemplate,
        checkpointConfig: undefined, // Remove advanced checkpoint config
      };
    }

    return baseTemplate; // comprehensive
  }

  private generateJSONWithComments(template: any, includeComments: boolean): string {
    if (!includeComments) {
      return JSON.stringify(template, null, 2);
    }

    // Generate JSON with extensive comments
    const lines: string[] = [];

    lines.push('{');
    lines.push('  // ========================================');
    lines.push('  // CONTEXT FORGE CONFIGURATION TEMPLATE');
    lines.push('  // ========================================');
    lines.push('  // Fill out this template and run:');
    lines.push('  // context-forge init --config context-forge-template.json');
    lines.push('  //');
    lines.push('  // For more information, visit:');
    lines.push('  // https://github.com/webdevtodayjason/context-forge');
    lines.push('  //');
    lines.push('');

    lines.push('  // ========================================');
    lines.push('  // PROJECT INFORMATION (Required)');
    lines.push('  // ========================================');
    lines.push('');
    lines.push('  // Project name - used for file generation and documentation');
    lines.push('  // Must be a valid identifier (letters, numbers, hyphens, underscores)');
    lines.push(`  "projectName": "${template.projectName}",`);
    lines.push('');
    lines.push('  // Project type - determines available tech stacks and features');
    lines.push('  // Options: "web", "mobile", "desktop", "api", "fullstack"');
    lines.push(`  "projectType": "${template.projectType}",`);
    lines.push('');
    lines.push('  // Brief description of your project (minimum 10 characters)');
    lines.push(`  "description": "${template.description}",`);
    lines.push('');

    // PRD Section
    if (template.prd) {
      lines.push('  // ========================================');
      lines.push('  // PRODUCT REQUIREMENTS DOCUMENT (Optional)');
      lines.push('  // ========================================');
      lines.push('  // Detailed project requirements - remove this section if not needed');
      lines.push('');
      lines.push('  "prd": {');
      lines.push('    // Detailed product requirements document content');
      lines.push(`    "content": "${template.prd.content}",`);
      lines.push('');
      lines.push('    // Core problem this project solves');
      lines.push(`    "problemStatement": "${template.prd.problemStatement}",`);
      lines.push('');
      lines.push('    // Target user personas');
      lines.push(`    "targetUsers": "${template.prd.targetUsers}",`);
      lines.push('');
      lines.push('    // User stories describing functionality');
      lines.push('    "userStories": [');
      template.prd.userStories.forEach((story: string, index: number) => {
        const comma = index < template.prd.userStories.length - 1 ? ',' : '';
        lines.push(`      "${story}"${comma}`);
      });
      lines.push('    ]');
      lines.push('  },');
      lines.push('');
    }

    // Tech Stack Section
    lines.push('  // ========================================');
    lines.push('  // TECHNOLOGY STACK');
    lines.push('  // ========================================');
    lines.push("  // Configure your project's technology stack");
    lines.push('');
    lines.push('  "techStack": {');
    lines.push('    // Frontend framework');
    lines.push(
      '    // Options: "react", "nextjs", "vue", "nuxt4", "angular", "svelte", "vanilla", "none"'
    );
    lines.push(`    "frontend": "${template.techStack.frontend}",`);
    lines.push('');
    lines.push('    // Backend framework');
    lines.push(
      '    // Options: "express", "fastapi", "django", "flask", "spring-boot", "rails", "aspnet", "go", "none"'
    );
    lines.push(`    "backend": "${template.techStack.backend}",`);
    lines.push('');
    lines.push('    // Database system');
    lines.push(
      '    // Options: "postgresql", "mysql", "mongodb", "sqlite", "redis-postgresql", "redis-mongodb", "supabase", "firebase", "none"'
    );
    lines.push(`    "database": "${template.techStack.database}",`);
    lines.push('');
    lines.push('    // Authentication method');
    lines.push(
      '    // Options: "jwt", "oauth", "session", "magic-links", "supabase-auth", "firebase-auth", "auth0", "clerk", "none"'
    );
    lines.push(`    "auth": "${template.techStack.auth}",`);
    lines.push('');
    lines.push('    // Styling framework');
    lines.push(
      '    // Options: "tailwind", "css-modules", "styled-components", "emotion", "sass", "css"'
    );
    lines.push(`    "styling": "${template.techStack.styling}",`);
    lines.push('');
    lines.push('    // State management (for React/Vue/Angular)');
    lines.push(
      '    // React: "redux-toolkit", "zustand", "mobx", "recoil", "context", "tanstack-query", "none"'
    );
    lines.push('    // Vue: "vuex", "pinia", "none"');
    lines.push('    // Nuxt: "pinia", "vuex", "nuxt-usestate", "nuxt-usecookie", "none"');
    lines.push('    // Angular: "ngrx", "akita", "rxjs", "none"');
    lines.push(`    "stateManagement": "${template.techStack.stateManagement}",`);
    lines.push('');
    lines.push('    // ORM/Database toolkit (optional)');
    lines.push(
      '    // Options: "prisma", "typeorm", "sequelize", "mongoose", "sqlalchemy", "none"'
    );
    lines.push(`    "orm": "${template.techStack.orm}"`);
    lines.push('  },');
    lines.push('');

    // Features Section
    lines.push('  // ========================================');
    lines.push('  // FEATURES');
    lines.push('  // ========================================');
    lines.push('  // Define the features for your project');
    lines.push('  // Each feature should have the structure shown below');
    lines.push('');
    lines.push('  "features": [');
    if (template.features && template.features.length > 0) {
      template.features.forEach((feature: any, index: number) => {
        const comma = index < template.features.length - 1 ? ',' : '';
        lines.push('    {');
        lines.push('      // Unique identifier for this feature');
        lines.push(`      "id": "${feature.id}",`);
        lines.push('');
        lines.push('      // Human-readable name');
        lines.push(`      "name": "${feature.name}",`);
        lines.push('');
        lines.push('      // Detailed description');
        lines.push(`      "description": "${feature.description}",`);
        lines.push('');
        lines.push('      // Priority: "must-have", "should-have", "nice-to-have"');
        lines.push(`      "priority": "${feature.priority}",`);
        lines.push('');
        lines.push('      // Complexity: "simple", "medium", "complex", "very-complex"');
        lines.push(`      "complexity": "${feature.complexity}",`);
        lines.push('');
        lines.push(
          '      // Category: "auth", "ui", "data", "integration", "infrastructure", "api", "database", "security", "testing", "feature"'
        );
        lines.push(`      "category": "${feature.category}",`);
        lines.push('');
        lines.push('      // List of subtasks');
        lines.push('      "subtasks": [');
        feature.subtasks.forEach((subtask: string, subIndex: number) => {
          const subComma = subIndex < feature.subtasks.length - 1 ? ',' : '';
          lines.push(`        "${subtask}"${subComma}`);
        });
        lines.push('      ],');
        lines.push('');
        lines.push('      // Dependencies on other feature IDs');
        lines.push('      "dependencies": [],');
        lines.push('');
        lines.push('      // Acceptance criteria');
        lines.push('      "acceptanceCriteria": [');
        feature.acceptanceCriteria.forEach((criteria: string, critIndex: number) => {
          const critComma = critIndex < feature.acceptanceCriteria.length - 1 ? ',' : '';
          lines.push(`        "${criteria}"${critComma}`);
        });
        lines.push('      ],');
        lines.push('');
        lines.push('      // Technical requirements');
        lines.push('      "technicalRequirements": [');
        feature.technicalRequirements.forEach((req: string, reqIndex: number) => {
          const reqComma = reqIndex < feature.technicalRequirements.length - 1 ? ',' : '';
          lines.push(`        "${req}"${reqComma}`);
        });
        lines.push('      ],');
        lines.push('');
        lines.push('      // Potential risks and mitigation strategies');
        lines.push('      "risks": [');
        feature.risks.forEach((risk: any, riskIndex: number) => {
          const riskComma = riskIndex < feature.risks.length - 1 ? ',' : '';
          lines.push('        {');
          lines.push(`          "type": "${risk.type}",`);
          lines.push(`          "description": "${risk.description}",`);
          lines.push(`          "mitigation": "${risk.mitigation}"`);
          lines.push(`        }${riskComma}`);
        });
        lines.push('      ],');
        lines.push('');
        lines.push('      // Estimated time to complete');
        lines.push(`      "estimatedEffort": "${feature.estimatedEffort}"`);
        lines.push(`    }${comma}`);
      });
    } else {
      lines.push('    // Add your features here using the structure above');
    }
    lines.push('  ],');
    lines.push('');

    // Project Configuration
    lines.push('  // ========================================');
    lines.push('  // PROJECT CONFIGURATION');
    lines.push('  // ========================================');
    lines.push('');
    lines.push('  // Development timeline');
    lines.push(
      '  // Options: "mvp" (minimal), "standard" (recommended), "enterprise" (comprehensive)'
    );
    lines.push(`  "timeline": "${template.timeline}",`);
    lines.push('');
    lines.push('  // Team size');
    lines.push('  // Options: "solo", "small" (2-5), "medium" (6-15), "large" (16+)');
    lines.push(`  "teamSize": "${template.teamSize}",`);
    lines.push('');
    lines.push('  // Deployment platform');
    lines.push(
      '  // Options: "vercel", "netlify", "railway", "heroku", "aws", "gcp", "azure", "docker", "none"'
    );
    lines.push(`  "deployment": "${template.deployment}",`);
    lines.push('');

    // Target IDEs
    lines.push('  // ========================================');
    lines.push('  // TARGET AI IDES');
    lines.push('  // ========================================');
    lines.push('  // AI IDEs to generate configurations for');
    lines.push(`  // Available options: ${JSON.stringify(getSupportedIDEs())}`);
    lines.push('');
    lines.push('  "targetIDEs": [');
    template.targetIDEs.forEach((ide: string, index: number) => {
      const comma = index < template.targetIDEs.length - 1 ? ',' : '';
      lines.push(`    "${ide}"${comma}`);
    });
    lines.push('  ],');
    lines.push('');

    // Extras Configuration
    lines.push('  // ========================================');
    lines.push('  // ADDITIONAL OPTIONS');
    lines.push('  // ========================================');
    lines.push('  // Additional features and integrations');
    lines.push('');
    lines.push('  "extras": {');
    lines.push('    // Include Docker configuration');
    lines.push(`    "docker": ${template.extras.docker},`);
    lines.push('');
    lines.push('    // Include CI/CD pipeline configuration');
    lines.push(`    "cicd": ${template.extras.cicd},`);
    lines.push('');
    lines.push('    // Include testing setup and examples');
    lines.push(`    "testing": ${template.extras.testing},`);
    lines.push('');
    lines.push('    // Include linting and formatting configuration');
    lines.push(`    "linting": ${template.extras.linting},`);
    lines.push('');
    lines.push('    // Include code examples and tutorials');
    lines.push(`    "examples": ${template.extras.examples},`);
    lines.push('');
    lines.push('    // Include Project Requirements Planning (PRP) templates');
    lines.push(`    "prp": ${template.extras.prp},`);
    lines.push('');
    lines.push('    // Enable AI-powered PRP generation (requires API keys)');
    lines.push(`    "aiPrp": ${template.extras.aiPrp},`);
    lines.push('');
    lines.push('    // Include AI documentation helpers');
    lines.push(`    "aiDocs": ${template.extras.aiDocs},`);
    lines.push('');
    lines.push('    // Include Claude-specific slash commands');
    lines.push(`    "claudeCommands": ${template.extras.claudeCommands},`);
    lines.push('');
    lines.push('    // Include git hooks for automation');
    lines.push(`    "hooks": ${template.extras.hooks},`);
    lines.push('');
    lines.push('    // Include checkpoint system for milestone tracking');
    lines.push(`    "checkpoints": ${template.extras.checkpoints},`);
    lines.push('');
    lines.push('    // Include Dart language integration (experimental)');
    lines.push(`    "dartIntegration": ${template.extras.dartIntegration}`);
    lines.push('  }');

    // Checkpoint Configuration (if comprehensive)
    if (template.checkpointConfig) {
      lines.push(',');
      lines.push('');
      lines.push('  // ========================================');
      lines.push('  // CHECKPOINT CONFIGURATION (Advanced)');
      lines.push('  // ========================================');
      lines.push('  // Configure milestone tracking and validation');
      lines.push("  // Remove this section if you don't need advanced checkpoints");
      lines.push('');
      lines.push('  "checkpointConfig": {');
      lines.push('    // Enable checkpoint system');
      lines.push(`    "enabled": ${template.checkpointConfig.enabled},`);
      lines.push('');
      lines.push('    // Automated checkpoint triggers');
      lines.push('    "triggers": [');
      template.checkpointConfig.triggers.forEach((trigger: any, index: number) => {
        const comma = index < template.checkpointConfig.triggers.length - 1 ? ',' : '';
        lines.push('      {');
        lines.push(`        "id": "${trigger.id}",`);
        lines.push(`        "name": "${trigger.name}",`);
        lines.push(`        "description": "${trigger.description}",`);
        lines.push('        // Category: "critical", "important", "normal"');
        lines.push(`        "category": "${trigger.category}",`);
        lines.push(`        "autoTrigger": ${trigger.autoTrigger},`);
        lines.push('        "conditions": [');
        trigger.conditions.forEach((condition: string, condIndex: number) => {
          const condComma = condIndex < trigger.conditions.length - 1 ? ',' : '';
          lines.push(`          "${condition}"${condComma}`);
        });
        lines.push('        ]');
        lines.push(`      }${comma}`);
      });
      lines.push('    ],');
      lines.push('');
      lines.push('    // Custom milestone definitions');
      lines.push('    "customMilestones": [');
      template.checkpointConfig.customMilestones.forEach((milestone: any, index: number) => {
        const comma = index < template.checkpointConfig.customMilestones.length - 1 ? ',' : '';
        lines.push('      {');
        lines.push(`        "name": "${milestone.name}",`);
        lines.push(`        "description": "${milestone.description}",`);
        lines.push('        "testInstructions": [');
        milestone.testInstructions.forEach((instruction: string, instIndex: number) => {
          const instComma = instIndex < milestone.testInstructions.length - 1 ? ',' : '';
          lines.push(`          "${instruction}"${instComma}`);
        });
        lines.push('        ],');
        lines.push('        "verificationPoints": [');
        milestone.verificationPoints.forEach((point: string, pointIndex: number) => {
          const pointComma = pointIndex < milestone.verificationPoints.length - 1 ? ',' : '';
          lines.push(`          "${point}"${pointComma}`);
        });
        lines.push('        ],');
        lines.push('        "triggerAfter": [');
        milestone.triggerAfter.forEach((trigger: string, triggerIndex: number) => {
          const triggerComma = triggerIndex < milestone.triggerAfter.length - 1 ? ',' : '';
          lines.push(`          "${trigger}"${triggerComma}`);
        });
        lines.push('        ],');
        lines.push(`        "blocksUntilApproved": ${milestone.blocksUntilApproved}`);
        lines.push(`      }${comma}`);
      });
      lines.push('    ],');
      lines.push('');
      lines.push('    // Notification settings (optional)');
      lines.push('    "notifications": {');
      lines.push('      "slack": {');
      lines.push(
        `        "webhook": "${template.checkpointConfig.notifications?.slack?.webhook || ''}",`
      );
      lines.push(
        `        "channel": "${template.checkpointConfig.notifications?.slack?.channel || '#dev-updates'}"`
      );
      lines.push('      }');
      lines.push('    },');
      lines.push('');
      lines.push('    // Custom commands (advanced)');
      lines.push('    "customCommands": []');
      lines.push('  }');
    }

    lines.push('}');

    return lines.join('\n');
  }
}

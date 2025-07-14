import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ApiConfig } from './apiKeyManager';

export interface BasicAnalysis extends Record<string, unknown> {
  projectType: string;
  techStack: string[];
  fileStats: {
    total: number;
    components: number;
    routes: number;
    tests: number;
    config: number;
  };
  summary: string;
  existingDocs: string[];
  packageManagers: string[];
  frameworks: string[];
}

export interface DetailedAnalysis {
  insights: string[];
  recommendations: string[];
  architecture: {
    patterns: string[];
    structure: string;
    complexity: 'low' | 'medium' | 'high';
  };
  codeQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export class ProjectAnalyzer {
  constructor(private projectPath: string) {}

  async analyzeBasic(): Promise<BasicAnalysis> {
    const files = await this.getAllFiles(this.projectPath);
    const packageJson = await this.readPackageJson();

    const analysis: BasicAnalysis = {
      projectType: this.detectProjectType(files, packageJson),
      techStack: this.detectTechStack(files, packageJson),
      fileStats: this.calculateFileStats(files),
      summary: '',
      existingDocs: this.findExistingDocs(files),
      packageManagers: this.detectPackageManagers(),
      frameworks: this.detectFrameworks(files, packageJson),
    };

    analysis.summary = this.generateSummary(analysis);
    return analysis;
  }

  async shouldUseAI(): Promise<boolean> {
    const { useAI } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useAI',
        message: 'Enable AI-powered analysis for deeper insights?',
        default: true,
      },
    ]);

    if (!useAI) {
      console.log(chalk.gray('Using pattern-based analysis only.'));
    }

    return useAI;
  }

  async analyzeDeep(_apiConfig: ApiConfig): Promise<DetailedAnalysis> {
    // This would integrate with AI providers for deeper analysis
    // For now, return mock analysis based on basic patterns
    const basicAnalysis = await this.analyzeBasic();

    return {
      insights: [
        `Detected ${basicAnalysis.techStack.join(' + ')} architecture`,
        `Found ${basicAnalysis.fileStats.components} components - good modular structure`,
        `${basicAnalysis.fileStats.tests} test files found - consider increasing coverage`,
      ],
      recommendations: [
        'Add comprehensive README with setup instructions',
        'Consider adding TypeScript for better type safety',
        'Implement error boundary components for React apps',
        'Add API documentation for backend routes',
      ],
      architecture: {
        patterns: this.detectArchitecturalPatterns(basicAnalysis),
        structure: this.analyzeStructure(basicAnalysis),
        complexity: this.assessComplexity(basicAnalysis),
      },
      codeQuality: {
        score: this.calculateQualityScore(basicAnalysis),
        issues: this.identifyIssues(basicAnalysis),
        suggestions: this.generateSuggestions(basicAnalysis),
      },
    };
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      if (item.startsWith('.') && item !== '.env.example') continue;
      if (item === 'node_modules' || item === 'dist' || item === 'build') continue;

      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async readPackageJson(): Promise<Record<string, unknown> | null> {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        return await fs.readJson(packagePath);
      }
    } catch {
      // Package.json not found or invalid
    }
    return null;
  }

  private detectProjectType(files: string[], packageJson: Record<string, unknown> | null): string {
    if (packageJson) {
      const deps = {
        ...(packageJson.dependencies as Record<string, unknown>),
        ...(packageJson.devDependencies as Record<string, unknown>),
      };

      if (deps.next || deps['@next/core-web-vitals']) return 'Next.js';
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue.js';
      if (deps.angular || deps['@angular/core']) return 'Angular';
      if (deps.express) return 'Express.js';
      if (deps.fastapi) return 'FastAPI';
      if (deps.django) return 'Django';
    }

    const extensions = files.map((f) => path.extname(f));

    if (extensions.includes('.tsx') || extensions.includes('.jsx')) return 'React/JSX';
    if (extensions.includes('.vue')) return 'Vue.js';
    if (extensions.includes('.py')) return 'Python';
    if (extensions.includes('.rs')) return 'Rust';
    if (extensions.includes('.go')) return 'Go';
    if (extensions.includes('.java')) return 'Java';
    if (extensions.includes('.ts') || extensions.includes('.js')) return 'JavaScript/TypeScript';

    return 'Mixed/Unknown';
  }

  private detectTechStack(files: string[], packageJson: Record<string, unknown> | null): string[] {
    const stack: string[] = [];

    if (packageJson) {
      const deps = {
        ...(packageJson.dependencies as Record<string, unknown>),
        ...(packageJson.devDependencies as Record<string, unknown>),
      };

      // Frontend frameworks
      if (deps.next) stack.push('Next.js');
      else if (deps.react) stack.push('React');
      if (deps.vue) stack.push('Vue.js');
      if (deps['@angular/core']) stack.push('Angular');

      // Backend frameworks
      if (deps.express) stack.push('Express.js');
      if (deps.fastify) stack.push('Fastify');

      // Databases
      if (deps.mongoose || deps.mongodb) stack.push('MongoDB');
      if (deps.pg || deps.postgres) stack.push('PostgreSQL');
      if (deps.mysql2 || deps.mysql) stack.push('MySQL');
      if (deps.sqlite3) stack.push('SQLite');

      // Tools
      if (deps.typescript) stack.push('TypeScript');
      if (deps.tailwindcss) stack.push('Tailwind CSS');
      if (deps.prisma) stack.push('Prisma');
    }

    // Detect from file extensions and names
    const extensions = files.map((f) => path.extname(f));
    const filenames = files.map((f) => path.basename(f));

    if (extensions.includes('.py')) stack.push('Python');
    if (extensions.includes('.rs')) stack.push('Rust');
    if (extensions.includes('.go')) stack.push('Go');
    if (filenames.includes('Dockerfile')) stack.push('Docker');
    if (filenames.includes('docker-compose.yml')) stack.push('Docker Compose');

    return [...new Set(stack)];
  }

  private calculateFileStats(files: string[]): BasicAnalysis['fileStats'] {
    return {
      total: files.length,
      components: files.filter(
        (f) =>
          f.includes('component') ||
          /\.(jsx|tsx)$/.test(f) ||
          (f.includes('/src/') && /\.(js|ts)$/.test(f))
      ).length,
      routes: files.filter(
        (f) =>
          f.includes('route') ||
          f.includes('api/') ||
          f.includes('pages/') ||
          (f.includes('app/') && f.includes('route.'))
      ).length,
      tests: files.filter(
        (f) => f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
      ).length,
      config: files.filter((f) => f.includes('config') || /\.(json|yaml|yml|toml|ini)$/.test(f))
        .length,
    };
  }

  private findExistingDocs(files: string[]): string[] {
    return files
      .filter((f) => /\.(md|txt|rst)$/i.test(f))
      .map((f) => path.basename(f))
      .filter((f) => !f.startsWith('.'));
  }

  private detectPackageManagers(): string[] {
    const managers: string[] = [];
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];

    lockFiles.forEach((lockFile) => {
      if (fs.pathExistsSync(path.join(this.projectPath, lockFile))) {
        managers.push(lockFile.split('-')[0] || lockFile.split('.')[0]);
      }
    });

    return managers.length > 0 ? managers : ['npm'];
  }

  private detectFrameworks(files: string[], packageJson: Record<string, unknown> | null): string[] {
    const frameworks: string[] = [];

    if (packageJson) {
      const deps = {
        ...(packageJson.dependencies as Record<string, unknown>),
        ...(packageJson.devDependencies as Record<string, unknown>),
      };
      Object.keys(deps).forEach((dep) => {
        if (dep.startsWith('@angular/')) frameworks.push('Angular');
        if (dep === 'vue') frameworks.push('Vue.js');
        if (dep === 'react') frameworks.push('React');
        if (dep === 'next') frameworks.push('Next.js');
      });
    }

    return [...new Set(frameworks)];
  }

  private generateSummary(analysis: BasicAnalysis): string {
    const { projectType, techStack, fileStats } = analysis;
    return `${projectType} project with ${techStack.join(', ')} (${fileStats.total} files)`;
  }

  private detectArchitecturalPatterns(analysis: BasicAnalysis): string[] {
    const patterns: string[] = [];

    if (analysis.techStack.includes('React')) patterns.push('Component-based');
    if (analysis.fileStats.routes > 0) patterns.push('Route-based');
    if (analysis.techStack.includes('Prisma')) patterns.push('ORM-based');
    if (analysis.techStack.includes('Next.js')) patterns.push('Full-stack');

    return patterns;
  }

  private analyzeStructure(analysis: BasicAnalysis): string {
    if (analysis.fileStats.components > 20) return 'Large modular structure';
    if (analysis.fileStats.components > 5) return 'Medium modular structure';
    return 'Small/simple structure';
  }

  private assessComplexity(analysis: BasicAnalysis): 'low' | 'medium' | 'high' {
    const score = analysis.fileStats.total + analysis.techStack.length * 5;
    if (score > 100) return 'high';
    if (score > 30) return 'medium';
    return 'low';
  }

  private calculateQualityScore(analysis: BasicAnalysis): number {
    let score = 50; // Base score

    if (analysis.techStack.includes('TypeScript')) score += 20;
    if (analysis.fileStats.tests > 0) score += 15;
    if (analysis.existingDocs.length > 0) score += 10;
    if (analysis.techStack.includes('Prisma')) score += 5;

    return Math.min(100, score);
  }

  private identifyIssues(analysis: BasicAnalysis): string[] {
    const issues: string[] = [];

    if (analysis.fileStats.tests === 0) issues.push('No test files found');
    if (analysis.existingDocs.length === 0) issues.push('No documentation files found');
    if (!analysis.techStack.includes('TypeScript') && analysis.projectType.includes('JavaScript')) {
      issues.push('Consider TypeScript for better type safety');
    }

    return issues;
  }

  private generateSuggestions(analysis: BasicAnalysis): string[] {
    const suggestions: string[] = [];

    suggestions.push('Add comprehensive README.md');
    suggestions.push('Create API documentation');

    if (analysis.fileStats.tests === 0) {
      suggestions.push('Add unit and integration tests');
    }

    if (!analysis.techStack.includes('TypeScript')) {
      suggestions.push('Consider migrating to TypeScript');
    }

    return suggestions;
  }
}

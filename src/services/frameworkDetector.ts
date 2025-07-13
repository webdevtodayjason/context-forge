import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface FrameworkPattern {
  framework: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  content?: ContentPattern[];
  structure?: string[];
  priority: number;
  variants?: VariantPattern[];
}

export interface ContentPattern {
  file: string;
  pattern: RegExp;
  weight: number;
}

export interface VariantPattern {
  name: string;
  dependencies?: string[];
  files?: string[];
  content?: ContentPattern[];
}

export interface DetectedFramework {
  framework: string;
  version?: string;
  variant?: string;
  confidence: number;
}

export interface FrameworkDetectionResult {
  primary?: DetectedFramework;
  secondary: DetectedFramework[];
  allDetected: DetectedFramework[];
}

export class FrameworkDetector {
  private projectPath: string;
  private patterns: FrameworkPattern[];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.patterns = this.initializePatterns();
  }

  private initializePatterns(): FrameworkPattern[] {
    return [
      // React
      {
        framework: 'react',
        files: ['package.json'],
        dependencies: ['react', 'react-dom'],
        content: [
          { file: '**/*.{js,jsx,ts,tsx}', pattern: /from ['"]react['"]/, weight: 10 },
          { file: '**/*.{js,jsx,ts,tsx}', pattern: /React\.Component/, weight: 5 },
        ],
        structure: ['src'],
        priority: 100,
        variants: [
          {
            name: 'next.js',
            dependencies: ['next'],
            files: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
          },
          {
            name: 'gatsby',
            dependencies: ['gatsby'],
            files: ['gatsby-config.js'],
          },
          {
            name: 'create-react-app',
            files: ['public/index.html'],
            devDependencies: ['react-scripts'],
          },
        ],
      },
      // Vue
      {
        framework: 'vue',
        files: ['package.json'],
        dependencies: ['vue'],
        content: [
          { file: '**/*.vue', pattern: /<template>/, weight: 20 },
          { file: '**/*.{js,ts}', pattern: /from ['"]vue['"]/, weight: 10 },
          { file: '**/*.{js,ts}', pattern: /createApp|Vue\.component/, weight: 15 },
        ],
        priority: 95,
        variants: [
          {
            name: 'nuxt',
            dependencies: ['nuxt'],
            files: ['nuxt.config.js', 'nuxt.config.ts'],
          },
          {
            name: 'vue-cli',
            files: ['vue.config.js'],
          },
          {
            name: 'vite-vue',
            devDependencies: ['@vitejs/plugin-vue'],
            files: ['vite.config.js', 'vite.config.ts'],
          },
        ],
      },
      // Angular
      {
        framework: 'angular',
        files: ['angular.json', 'package.json'],
        dependencies: ['@angular/core', '@angular/common'],
        content: [
          { file: '**/*.ts', pattern: /@Component\({/, weight: 20 },
          { file: '**/*.ts', pattern: /from ['"]@angular/, weight: 10 },
        ],
        structure: ['src/app'],
        priority: 90,
      },
      // Express
      {
        framework: 'express',
        files: ['package.json'],
        dependencies: ['express'],
        content: [
          { file: '**/*.{js,ts}', pattern: /require\(['"]express['"]\)/, weight: 15 },
          { file: '**/*.{js,ts}', pattern: /from ['"]express['"]/, weight: 15 },
          { file: '**/*.{js,ts}', pattern: /app\.(get|post|put|delete|use)\(/, weight: 10 },
        ],
        priority: 80,
      },
      // NestJS
      {
        framework: 'nestjs',
        files: ['package.json', 'nest-cli.json'],
        dependencies: ['@nestjs/core', '@nestjs/common'],
        content: [
          { file: '**/*.ts', pattern: /@Module\({/, weight: 20 },
          { file: '**/*.ts', pattern: /@Controller\(/, weight: 15 },
          { file: '**/*.ts', pattern: /from ['"]@nestjs/, weight: 10 },
        ],
        priority: 85,
      },
      // Django
      {
        framework: 'django',
        files: ['manage.py', 'requirements.txt'],
        content: [
          { file: 'manage.py', pattern: /django/, weight: 30 },
          { file: 'requirements.txt', pattern: /django/i, weight: 20 },
          { file: '**/*.py', pattern: /from django/, weight: 10 },
          { file: '**/settings.py', pattern: /INSTALLED_APPS/, weight: 15 },
        ],
        structure: ['apps', 'templates'],
        priority: 85,
      },
      // FastAPI
      {
        framework: 'fastapi',
        files: ['requirements.txt', 'pyproject.toml'],
        content: [
          { file: 'requirements.txt', pattern: /fastapi/i, weight: 25 },
          { file: 'pyproject.toml', pattern: /fastapi/, weight: 25 },
          { file: '**/*.py', pattern: /from fastapi import/, weight: 20 },
          { file: '**/*.py', pattern: /FastAPI\(\)/, weight: 15 },
        ],
        priority: 75,
      },
      // Ruby on Rails
      {
        framework: 'rails',
        files: ['Gemfile', 'config/routes.rb'],
        content: [
          { file: 'Gemfile', pattern: /gem ['"]rails['"]/, weight: 30 },
          { file: 'config/routes.rb', pattern: /Rails\.application\.routes/, weight: 20 },
        ],
        structure: ['app/controllers', 'app/models', 'app/views'],
        priority: 85,
      },
      // Laravel
      {
        framework: 'laravel',
        files: ['composer.json', 'artisan'],
        content: [
          { file: 'composer.json', pattern: /"laravel\/framework"/, weight: 30 },
          { file: 'artisan', pattern: /Laravel/, weight: 20 },
        ],
        structure: ['app/Http/Controllers', 'resources/views'],
        priority: 80,
      },
      // Spring Boot
      {
        framework: 'spring-boot',
        files: ['pom.xml', 'build.gradle'],
        content: [
          { file: 'pom.xml', pattern: /spring-boot-starter/, weight: 30 },
          { file: 'build.gradle', pattern: /org\.springframework\.boot/, weight: 30 },
          { file: '**/*.java', pattern: /@SpringBootApplication/, weight: 25 },
          { file: '**/*.java', pattern: /@RestController/, weight: 15 },
        ],
        structure: ['src/main/java', 'src/main/resources'],
        priority: 80,
      },
    ].sort((a, b) => b.priority - a.priority);
  }

  async detectFrameworks(): Promise<FrameworkDetectionResult> {
    const detectedFrameworks: DetectedFramework[] = [];

    for (const pattern of this.patterns) {
      const confidence = await this.calculateConfidence(pattern);
      if (confidence > 30) {
        const version = await this.detectVersion(pattern);
        const variant = await this.detectVariant(pattern);

        detectedFrameworks.push({
          framework: pattern.framework,
          version,
          variant,
          confidence,
        });
      }
    }

    // Sort by confidence
    detectedFrameworks.sort((a, b) => b.confidence - a.confidence);

    const primary = detectedFrameworks.find((f) => f.confidence >= 70);
    const secondary = detectedFrameworks.filter(
      (f) => f.confidence >= 50 && f.framework !== primary?.framework
    );

    return {
      primary,
      secondary,
      allDetected: detectedFrameworks,
    };
  }

  private async calculateConfidence(pattern: FrameworkPattern): Promise<number> {
    let confidence = 0;

    // Check required files
    for (const file of pattern.files) {
      const exists = await this.fileExists(file);
      if (exists) {
        confidence += 30 / pattern.files.length;
      }
    }

    // Check dependencies
    if (pattern.dependencies || pattern.devDependencies) {
      const packageJson = await this.readPackageJson();
      if (packageJson) {
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});

        pattern.dependencies?.forEach((dep) => {
          if (deps.includes(dep)) {
            confidence += Math.min(20, 40 / (pattern.dependencies?.length || 1));
          }
        });

        pattern.devDependencies?.forEach((dep) => {
          if (devDeps.includes(dep)) {
            confidence += Math.min(10, 20 / (pattern.devDependencies?.length || 1));
          }
        });
      }
    }

    // Check content patterns
    if (pattern.content) {
      for (const contentPattern of pattern.content) {
        const matches = await this.checkContentPattern(contentPattern);
        if (matches) {
          confidence += contentPattern.weight;
        }
      }
    }

    // Check directory structure
    if (pattern.structure) {
      for (const dir of pattern.structure) {
        const exists = await this.directoryExists(dir);
        if (exists) {
          confidence += 10 / pattern.structure.length;
        }
      }
    }

    return Math.min(100, Math.round(confidence));
  }

  private async detectVersion(pattern: FrameworkPattern): Promise<string | undefined> {
    // Try package.json first
    const packageJson = await this.readPackageJson();
    if (packageJson) {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check main framework dependency
      if (pattern.dependencies) {
        for (const dep of pattern.dependencies) {
          if (allDeps[dep]) {
            return this.cleanVersion(allDeps[dep]);
          }
        }
      }
    }

    // Try lock files for exact versions
    const lockFile = await this.readLockFile();
    if (lockFile && pattern.dependencies) {
      for (const dep of pattern.dependencies) {
        const version = this.extractVersionFromLock(lockFile, dep);
        if (version) return version;
      }
    }

    return undefined;
  }

  private async detectVariant(pattern: FrameworkPattern): Promise<string | undefined> {
    if (!pattern.variants) return undefined;

    for (const variant of pattern.variants) {
      let isVariant = false;

      // Check variant-specific files
      if (variant.files) {
        for (const file of variant.files) {
          if (await this.fileExists(file)) {
            isVariant = true;
            break;
          }
        }
      }

      // Check variant dependencies
      if (!isVariant && variant.dependencies) {
        const packageJson = await this.readPackageJson();
        if (packageJson) {
          const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };

          for (const dep of variant.dependencies) {
            if (allDeps[dep]) {
              isVariant = true;
              break;
            }
          }
        }
      }

      if (isVariant) {
        return variant.name;
      }
    }

    return undefined;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectPath, filePath));
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path.join(this.projectPath, dirPath));
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile(path.join(this.projectPath, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async readLockFile(): Promise<string | null> {
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

    for (const lockFile of lockFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectPath, lockFile), 'utf-8');
        return content;
      } catch {
        continue;
      }
    }

    return null;
  }

  private async checkContentPattern(pattern: ContentPattern): Promise<boolean> {
    try {
      const files = await glob(pattern.file, {
        cwd: this.projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
        nodir: true,
      });

      for (const file of files.slice(0, 10)) {
        // Check first 10 files
        try {
          const content = await fs.readFile(path.join(this.projectPath, file), 'utf-8');
          if (pattern.pattern.test(content)) {
            return true;
          }
        } catch {
          continue;
        }
      }
    } catch {
      return false;
    }

    return false;
  }

  private cleanVersion(version: string): string {
    // Remove version prefixes like ^, ~, >=, etc.
    return version.replace(/^[\^~>=<\s]+/, '');
  }

  private extractVersionFromLock(lockContent: string, packageName: string): string | undefined {
    // Simple extraction for different lock file formats
    const patterns = [
      new RegExp(`"${packageName}"[^"]*"version"[^"]*"([^"]+)"`, 'i'),
      new RegExp(`${packageName}@([^\\s]+)`, 'i'),
      new RegExp(`${packageName}:\\s*version[^\\d]*(\\d+\\.\\d+\\.\\d+)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = lockContent.match(pattern);
      if (match && match[1]) {
        return this.cleanVersion(match[1]);
      }
    }

    return undefined;
  }
}

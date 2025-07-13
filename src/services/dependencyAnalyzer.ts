import * as fs from 'fs/promises';
import * as path from 'path';

export interface DependencyMapping {
  from: PackageInfo;
  to: PackageInfo[];
  migrationNotes?: string;
  breakingChanges?: string[];
  compatible?: boolean;
}

export interface PackageInfo {
  name: string;
  versionRange?: string;
  framework?: string;
}

export interface DependencyAnalysis {
  dependencies: DependencyInfo[];
  incompatible: IncompatibilityInfo[];
  replacements: ReplacementSuggestion[];
  migrationComplexity: 'low' | 'medium' | 'high';
  totalDependencies: number;
  incompatibleCount: number;
  hasReplacements: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  framework: string;
  hasReplacement: boolean;
  isCompatible: boolean;
  replacements?: PackageInfo[];
}

export interface IncompatibilityInfo {
  package: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
}

export interface ReplacementSuggestion {
  from: string;
  to: string;
  confidence: 'high' | 'medium' | 'low';
  migrationEffort: 'trivial' | 'small' | 'medium' | 'large';
  notes?: string;
}

export class DependencyAnalyzer {
  private mappings: DependencyMapping[];

  constructor() {
    this.mappings = this.initializeMappings();
  }

  private initializeMappings(): DependencyMapping[] {
    return [
      // React ecosystem migrations
      {
        from: { name: 'react-scripts', framework: 'react' },
        to: [
          { name: '@vitejs/plugin-react', framework: 'react' },
          { name: 'vite', framework: 'agnostic' },
        ],
        migrationNotes: 'Migrate from Create React App to Vite for better performance',
        compatible: false,
      },
      {
        from: { name: 'enzyme', framework: 'react' },
        to: [
          { name: '@testing-library/react', framework: 'react' },
          { name: '@testing-library/jest-dom', framework: 'react' },
        ],
        migrationNotes: 'Enzyme is deprecated for React 18+, use React Testing Library',
        breakingChanges: ['Different API for component testing', 'No shallow rendering'],
        compatible: false,
      },
      {
        from: { name: 'react-router', versionRange: '<6', framework: 'react' },
        to: [{ name: 'react-router-dom', versionRange: '^6', framework: 'react' }],
        migrationNotes: 'React Router v6 has significant API changes',
        breakingChanges: ['Switch replaced with Routes', 'Route component API changed'],
        compatible: false,
      },

      // Vue ecosystem migrations
      {
        from: { name: 'vue-cli-service', framework: 'vue' },
        to: [
          { name: '@vitejs/plugin-vue', framework: 'vue' },
          { name: 'vite', framework: 'agnostic' },
        ],
        migrationNotes: 'Vue CLI is in maintenance mode, migrate to Vite',
        compatible: false,
      },
      {
        from: { name: 'vuex', versionRange: '<4', framework: 'vue' },
        to: [{ name: 'pinia', framework: 'vue' }],
        migrationNotes: 'Pinia is the recommended state management for Vue 3',
        compatible: false,
      },
      {
        from: { name: 'vue-router', versionRange: '<4', framework: 'vue' },
        to: [{ name: 'vue-router', versionRange: '^4', framework: 'vue' }],
        migrationNotes: 'Vue Router 4 required for Vue 3',
        breakingChanges: ['Different route configuration', 'Composition API support'],
        compatible: false,
      },

      // Angular to React migrations
      {
        from: { name: '@angular/common', framework: 'angular' },
        to: [{ name: 'react', framework: 'react' }],
        migrationNotes: 'Core framework change from Angular to React',
        compatible: false,
      },
      {
        from: { name: '@angular/router', framework: 'angular' },
        to: [{ name: 'react-router-dom', framework: 'react' }],
        migrationNotes: 'Replace Angular Router with React Router',
        compatible: false,
      },
      {
        from: { name: '@angular/forms', framework: 'angular' },
        to: [
          { name: 'react-hook-form', framework: 'react' },
          { name: 'formik', framework: 'react' },
        ],
        migrationNotes: 'Form handling libraries for React',
        compatible: false,
      },
      {
        from: { name: '@angular/http', framework: 'angular' },
        to: [
          { name: 'axios', framework: 'agnostic' },
          { name: 'swr', framework: 'react' },
          { name: '@tanstack/react-query', framework: 'react' },
        ],
        migrationNotes: 'HTTP client alternatives for React',
        compatible: false,
      },

      // Express to modern alternatives
      {
        from: { name: 'express', framework: 'express' },
        to: [
          { name: 'fastify', framework: 'fastify' },
          { name: '@nestjs/core', framework: 'nestjs' },
          { name: 'koa', framework: 'koa' },
        ],
        migrationNotes: 'Modern alternatives to Express with better performance',
        compatible: true, // Can run side by side
      },
      {
        from: { name: 'body-parser', framework: 'express' },
        to: [],
        migrationNotes: 'Built into Express 4.16+ and not needed in modern frameworks',
        compatible: true,
      },

      // Build tool migrations
      {
        from: { name: 'webpack', versionRange: '<5' },
        to: [
          { name: 'webpack', versionRange: '^5' },
          { name: 'vite', framework: 'agnostic' },
          { name: 'esbuild', framework: 'agnostic' },
        ],
        migrationNotes: 'Modern build tools with better performance',
        compatible: false,
      },
      {
        from: { name: 'gulp' },
        to: [
          { name: 'vite', framework: 'agnostic' },
          { name: 'webpack', versionRange: '^5' },
        ],
        migrationNotes: 'Gulp is less commonly used, modern bundlers handle asset pipeline',
        compatible: true,
      },

      // Testing library migrations
      {
        from: { name: 'mocha' },
        to: [
          { name: 'vitest', framework: 'agnostic' },
          { name: 'jest', framework: 'agnostic' },
        ],
        migrationNotes: 'Modern testing frameworks with better DX',
        compatible: true,
      },
      {
        from: { name: 'karma' },
        to: [
          { name: 'vitest', framework: 'agnostic' },
          { name: '@playwright/test', framework: 'agnostic' },
        ],
        migrationNotes: 'Karma is deprecated, use modern test runners',
        compatible: false,
      },

      // CSS/Styling migrations
      {
        from: { name: 'node-sass' },
        to: [{ name: 'sass' }],
        migrationNotes: 'node-sass is deprecated, use Dart Sass',
        compatible: false,
      },
      {
        from: { name: 'styled-components', versionRange: '<5', framework: 'react' },
        to: [
          { name: 'styled-components', versionRange: '^5', framework: 'react' },
          { name: '@emotion/styled', framework: 'react' },
        ],
        migrationNotes: 'Update to v5 or consider Emotion for better performance',
        compatible: false,
      },

      // State management
      {
        from: { name: 'redux', framework: 'react' },
        to: [
          { name: '@reduxjs/toolkit', framework: 'react' },
          { name: 'zustand', framework: 'react' },
          { name: 'jotai', framework: 'react' },
        ],
        migrationNotes: 'Modern state management alternatives',
        compatible: true,
      },

      // Utility libraries
      {
        from: { name: 'moment' },
        to: [{ name: 'date-fns' }, { name: 'dayjs' }, { name: 'luxon' }],
        migrationNotes: 'Moment.js is in maintenance mode, use modern alternatives',
        compatible: true,
      },
      {
        from: { name: 'lodash' },
        to: [{ name: 'lodash-es' }, { name: 'ramda' }],
        migrationNotes: 'Consider ES modules version or functional alternatives',
        compatible: true,
      },
    ];
  }

  async analyzeDependencies(
    sourcePath: string,
    sourceFramework: string,
    targetFramework: string
  ): Promise<DependencyAnalysis> {
    const packageJson = await this.readPackageJson(sourcePath);
    if (!packageJson) {
      return this.emptyAnalysis();
    }

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const dependencies: DependencyInfo[] = [];
    const incompatible: IncompatibilityInfo[] = [];
    const replacements: ReplacementSuggestion[] = [];

    for (const [name, version] of Object.entries(allDeps)) {
      const depInfo = this.analyzeDependency(
        name,
        version as string,
        sourceFramework,
        targetFramework
      );

      dependencies.push(depInfo);

      if (!depInfo.isCompatible) {
        incompatible.push(this.getIncompatibilityInfo(name, sourceFramework, targetFramework));
      }

      if (depInfo.replacements && depInfo.replacements.length > 0) {
        replacements.push(...this.getReplacementSuggestions(name, depInfo.replacements));
      }
    }

    const hasReplacements = dependencies.filter((d) => d.hasReplacement).length;
    const migrationComplexity = this.calculateMigrationComplexity(
      dependencies.length,
      incompatible.length,
      hasReplacements
    );

    return {
      dependencies,
      incompatible,
      replacements,
      migrationComplexity,
      totalDependencies: dependencies.length,
      incompatibleCount: incompatible.length,
      hasReplacements,
    };
  }

  private analyzeDependency(
    name: string,
    version: string,
    sourceFramework: string,
    targetFramework: string
  ): DependencyInfo {
    const mapping = this.findMapping(name, sourceFramework);
    const isFrameworkSpecific = this.isFrameworkSpecific(name, sourceFramework);
    const isCompatible = !isFrameworkSpecific || sourceFramework === targetFramework;

    return {
      name,
      version,
      framework: this.detectPackageFramework(name),
      hasReplacement: !!mapping,
      isCompatible,
      replacements: mapping?.to,
    };
  }

  private findMapping(packageName: string, framework: string): DependencyMapping | undefined {
    return this.mappings.find(
      (m) => m.from.name === packageName && (!m.from.framework || m.from.framework === framework)
    );
  }

  private isFrameworkSpecific(packageName: string, framework: string): boolean {
    const frameworkPrefixes: Record<string, string[]> = {
      react: ['react', '@testing-library/react', 'react-dom', 'react-router'],
      vue: ['vue', '@vue/', 'vuex', 'vue-router', 'pinia'],
      angular: ['@angular/', '@ngrx/'],
      svelte: ['svelte', '@sveltejs/'],
      express: ['express-', 'body-parser', 'multer'],
      nestjs: ['@nestjs/'],
      nextjs: ['next'],
    };

    const prefixes = frameworkPrefixes[framework] || [];
    return prefixes.some((prefix) => packageName.startsWith(prefix));
  }

  private detectPackageFramework(packageName: string): string {
    if (packageName.startsWith('react') || packageName.includes('react')) return 'react';
    if (packageName.startsWith('vue') || packageName.startsWith('@vue/')) return 'vue';
    if (packageName.startsWith('@angular/')) return 'angular';
    if (packageName.startsWith('svelte') || packageName.startsWith('@sveltejs/')) return 'svelte';
    if (packageName.startsWith('@nestjs/')) return 'nestjs';
    if (packageName === 'next' || packageName.startsWith('next-')) return 'nextjs';
    if (packageName === 'express' || packageName.startsWith('express-')) return 'express';
    return 'agnostic';
  }

  private getIncompatibilityInfo(
    packageName: string,
    sourceFramework: string,
    targetFramework: string
  ): IncompatibilityInfo {
    const mapping = this.findMapping(packageName, sourceFramework);

    if (mapping && !mapping.compatible) {
      return {
        package: packageName,
        reason: mapping.migrationNotes || `Incompatible with ${targetFramework}`,
        severity: 'high',
        resolution:
          mapping.to.length > 0
            ? `Replace with: ${mapping.to.map((p) => p.name).join(', ')}`
            : 'Remove package',
      };
    }

    const framework = this.detectPackageFramework(packageName);
    if (framework !== 'agnostic' && framework !== targetFramework) {
      return {
        package: packageName,
        reason: `${framework} package incompatible with ${targetFramework}`,
        severity: 'critical',
        resolution: `Find ${targetFramework} equivalent or remove`,
      };
    }

    return {
      package: packageName,
      reason: 'May not be compatible with target framework',
      severity: 'low',
      resolution: 'Verify compatibility',
    };
  }

  private getReplacementSuggestions(
    packageName: string,
    replacements: PackageInfo[]
  ): ReplacementSuggestion[] {
    return replacements.map((replacement) => {
      const effort = this.estimateMigrationEffort(packageName, replacement.name);
      return {
        from: packageName,
        to: replacement.name,
        confidence: this.getReplacementConfidence(packageName, replacement.name),
        migrationEffort: effort,
        notes: this.getReplacementNotes(packageName, replacement.name),
      };
    });
  }

  private estimateMigrationEffort(
    from: string,
    to: string
  ): 'trivial' | 'small' | 'medium' | 'large' {
    // Direct version upgrades
    if (from === to.split('@')[0]) return 'trivial';

    // Similar packages
    if (from.includes(to) || to.includes(from)) return 'small';

    // Framework changes
    if (this.detectPackageFramework(from) !== this.detectPackageFramework(to)) return 'large';

    return 'medium';
  }

  private getReplacementConfidence(from: string, to: string): 'high' | 'medium' | 'low' {
    const mapping = this.mappings.find((m) => m.from.name === from);
    if (mapping && mapping.to.some((t) => t.name === to)) return 'high';

    if (from.includes(to) || to.includes(from)) return 'medium';

    return 'low';
  }

  private getReplacementNotes(from: string, to: string): string {
    const specificNotes: Record<string, string> = {
      'enzyme:@testing-library/react': 'Different testing philosophy - no shallow rendering',
      'moment:date-fns': 'Tree-shakeable, functional API',
      'moment:dayjs': 'Similar API to Moment.js, smaller bundle',
      'node-sass:sass': 'Direct replacement, may need to update import syntax',
      'react-scripts:vite': 'Complete build tool migration, significant config changes',
    };

    return specificNotes[`${from}:${to}`] || '';
  }

  private calculateMigrationComplexity(
    total: number,
    incompatible: number,
    replacements: number
  ): 'low' | 'medium' | 'high' {
    const incompatibleRatio = incompatible / total;
    const replacementRatio = replacements / total;

    if (incompatibleRatio > 0.5 || replacementRatio > 0.7) return 'high';
    if (incompatibleRatio > 0.2 || replacementRatio > 0.4) return 'medium';
    return 'low';
  }

  private async readPackageJson(projectPath: string): Promise<any> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private emptyAnalysis(): DependencyAnalysis {
    return {
      dependencies: [],
      incompatible: [],
      replacements: [],
      migrationComplexity: 'low',
      totalDependencies: 0,
      incompatibleCount: 0,
      hasReplacements: 0,
    };
  }

  generateDependencyReport(analysis: DependencyAnalysis): string {
    return `# Dependency Analysis Report

## Summary
- **Total Dependencies**: ${analysis.totalDependencies}
- **Incompatible**: ${analysis.incompatibleCount}
- **With Replacements**: ${analysis.hasReplacements}
- **Migration Complexity**: ${analysis.migrationComplexity.toUpperCase()}

## Incompatible Dependencies
${
  analysis.incompatible.length === 0
    ? 'No incompatible dependencies found.\n'
    : analysis.incompatible
        .map(
          (inc) => `
### ${inc.package}
- **Reason**: ${inc.reason}
- **Severity**: ${inc.severity}
- **Resolution**: ${inc.resolution}
`
        )
        .join('\n')
}

## Replacement Suggestions
${
  analysis.replacements.length === 0
    ? 'No replacement suggestions.\n'
    : analysis.replacements
        .map(
          (rep) => `
### ${rep.from} → ${rep.to}
- **Confidence**: ${rep.confidence}
- **Effort**: ${rep.migrationEffort}
${rep.notes ? `- **Notes**: ${rep.notes}` : ''}
`
        )
        .join('\n')
}

## All Dependencies
${analysis.dependencies
  .map((dep) => `- ${dep.name}@${dep.version} (${dep.framework}) ${dep.isCompatible ? '✓' : '✗'}`)
  .join('\n')}
`;
  }
}

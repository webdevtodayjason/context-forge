import { DetectedFramework } from './frameworkDetector';

export interface BreakingChange {
  id: string;
  category: 'api' | 'syntax' | 'structure' | 'dependency' | 'config' | 'behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFiles?: string[];
  searchPattern?: RegExp;
  replacement?: string;
  migrationGuide?: string;
  automatable: boolean;
  effort: 'trivial' | 'small' | 'medium' | 'large';
}

export interface BreakingChangePattern {
  from: FrameworkVersion;
  to: FrameworkVersion;
  changes: BreakingChange[];
}

export interface FrameworkVersion {
  framework: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface BreakingChangeAnalysis {
  source: DetectedFramework;
  target: DetectedFramework;
  breakingChanges: BreakingChange[];
  totalEffort: {
    trivial: number;
    small: number;
    medium: number;
    large: number;
  };
  criticalCount: number;
  automatableCount: number;
  estimatedHours: number;
}

export class BreakingChangeAnalyzer {
  private patterns: BreakingChangePattern[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  private initializePatterns(): BreakingChangePattern[] {
    return [
      // React 17 to React 18
      {
        from: { framework: 'react', minVersion: '17.0.0', maxVersion: '17.9.9' },
        to: { framework: 'react', minVersion: '18.0.0' },
        changes: [
          {
            id: 'react-18-root-api',
            category: 'api',
            severity: 'high',
            description: 'ReactDOM.render is deprecated. Use createRoot instead.',
            searchPattern: /ReactDOM\.render\(/g,
            replacement: 'Use ReactDOM.createRoot() and root.render()',
            migrationGuide: 'https://react.dev/blog/2022/03/08/react-18-upgrade-guide',
            automatable: true,
            effort: 'small',
          },
          {
            id: 'react-18-automatic-batching',
            category: 'behavior',
            severity: 'medium',
            description: 'Automatic batching may change component update behavior',
            migrationGuide: 'Review setState calls in event handlers and effects',
            automatable: false,
            effort: 'medium',
          },
          {
            id: 'react-18-strict-mode',
            category: 'behavior',
            severity: 'low',
            description: 'StrictMode now remounts components to test resilience',
            automatable: false,
            effort: 'small',
          },
        ],
      },
      // Vue 2 to Vue 3
      {
        from: { framework: 'vue', minVersion: '2.0.0', maxVersion: '2.9.9' },
        to: { framework: 'vue', minVersion: '3.0.0' },
        changes: [
          {
            id: 'vue-3-global-api',
            category: 'api',
            severity: 'critical',
            description:
              'Global API changes: Vue.component, Vue.directive, etc. moved to app instance',
            searchPattern: /Vue\.(component|directive|mixin|use)\(/g,
            replacement: 'app.$1(',
            migrationGuide: 'https://v3-migration.vuejs.org/breaking-changes/global-api.html',
            automatable: true,
            effort: 'medium',
          },
          {
            id: 'vue-3-filters',
            category: 'syntax',
            severity: 'high',
            description: 'Filters have been removed in Vue 3',
            searchPattern: /\{\{[^}]+\|[^}]+\}\}/g,
            migrationGuide: 'Replace with methods or computed properties',
            automatable: false,
            effort: 'large',
          },
          {
            id: 'vue-3-v-model',
            category: 'syntax',
            severity: 'high',
            description: 'v-model API has changed for custom components',
            searchPattern: /v-model(?!:)/g,
            migrationGuide: 'Update to use modelValue prop and update:modelValue event',
            automatable: false,
            effort: 'medium',
          },
          {
            id: 'vue-3-lifecycle',
            category: 'api',
            severity: 'medium',
            description:
              'Lifecycle hooks renamed: beforeDestroy -> beforeUnmount, destroyed -> unmounted',
            searchPattern: /(beforeDestroy|destroyed)/g,
            automatable: true,
            effort: 'trivial',
          },
        ],
      },
      // Angular to React
      {
        from: { framework: 'angular' },
        to: { framework: 'react' },
        changes: [
          {
            id: 'angular-to-react-components',
            category: 'structure',
            severity: 'critical',
            description: 'Angular components need to be rewritten as React components',
            searchPattern: /@Component\({/g,
            migrationGuide: 'Convert Angular components to React functional components',
            automatable: false,
            effort: 'large',
          },
          {
            id: 'angular-to-react-services',
            category: 'structure',
            severity: 'high',
            description: 'Angular services need to be converted to React patterns (hooks, context)',
            searchPattern: /@Injectable\({/g,
            migrationGuide: 'Convert services to custom hooks or context providers',
            automatable: false,
            effort: 'large',
          },
          {
            id: 'angular-to-react-routing',
            category: 'dependency',
            severity: 'high',
            description: 'Angular Router needs to be replaced with React Router',
            searchPattern: /RouterModule|router-outlet/g,
            migrationGuide: 'Implement React Router with Routes and Route components',
            automatable: false,
            effort: 'large',
          },
        ],
      },
      // Express to Fastify
      {
        from: { framework: 'express' },
        to: { framework: 'fastify' },
        changes: [
          {
            id: 'express-to-fastify-middleware',
            category: 'api',
            severity: 'high',
            description: 'Express middleware not directly compatible with Fastify',
            searchPattern: /app\.use\(/g,
            migrationGuide: 'Use fastify-express or rewrite middleware as Fastify plugins',
            automatable: false,
            effort: 'medium',
          },
          {
            id: 'express-to-fastify-routing',
            category: 'syntax',
            severity: 'medium',
            description: 'Route definition syntax differs between Express and Fastify',
            searchPattern: /app\.(get|post|put|delete)\(/g,
            replacement: 'fastify.$1(',
            automatable: true,
            effort: 'small',
          },
          {
            id: 'express-to-fastify-error-handling',
            category: 'api',
            severity: 'medium',
            description: 'Error handling patterns differ between frameworks',
            searchPattern: /app\.use\(\s*\(\s*err/g,
            migrationGuide: 'Use Fastify error handlers and hooks',
            automatable: false,
            effort: 'medium',
          },
        ],
      },
      // Next.js Pages to App Router
      {
        from: { framework: 'next.js', maxVersion: '12.9.9' },
        to: { framework: 'next.js', minVersion: '13.0.0' },
        changes: [
          {
            id: 'nextjs-app-router',
            category: 'structure',
            severity: 'critical',
            description: 'Pages Router to App Router migration requires restructuring',
            searchPattern: /pages\//g,
            migrationGuide: 'Move pages to app directory with new file conventions',
            automatable: false,
            effort: 'large',
          },
          {
            id: 'nextjs-data-fetching',
            category: 'api',
            severity: 'high',
            description: 'getServerSideProps/getStaticProps replaced with async components',
            searchPattern: /(getServerSideProps|getStaticProps|getStaticPaths)/g,
            migrationGuide: 'Use async/await in Server Components',
            automatable: false,
            effort: 'large',
          },
          {
            id: 'nextjs-layouts',
            category: 'structure',
            severity: 'medium',
            description: '_app.js and _document.js replaced with layout.js and RootLayout',
            searchPattern: /(_app|_document)\.(js|tsx)/g,
            migrationGuide: 'Create layout.js files in app directory',
            automatable: false,
            effort: 'medium',
          },
        ],
      },
      // Django 3 to Django 4
      {
        from: { framework: 'django', minVersion: '3.0', maxVersion: '3.9' },
        to: { framework: 'django', minVersion: '4.0' },
        changes: [
          {
            id: 'django-4-csrf',
            category: 'config',
            severity: 'high',
            description: 'CSRF_TRUSTED_ORIGINS now requires scheme',
            searchPattern: /CSRF_TRUSTED_ORIGINS/g,
            migrationGuide: 'Add https:// or http:// to all origins',
            automatable: true,
            effort: 'trivial',
          },
          {
            id: 'django-4-timezone',
            category: 'behavior',
            severity: 'medium',
            description: 'USE_L10N setting deprecated, localization now always enabled',
            searchPattern: /USE_L10N/g,
            migrationGuide: 'Remove USE_L10N from settings',
            automatable: true,
            effort: 'trivial',
          },
          {
            id: 'django-4-models',
            category: 'api',
            severity: 'low',
            description: 'NullBooleanField deprecated in favor of BooleanField(null=True)',
            searchPattern: /NullBooleanField/g,
            replacement: 'BooleanField(null=True)',
            automatable: true,
            effort: 'small',
          },
        ],
      },
    ];
  }

  async analyzeBreakingChanges(
    source: DetectedFramework,
    target: DetectedFramework
  ): Promise<BreakingChangeAnalysis> {
    const breakingChanges: BreakingChange[] = [];

    // Find applicable patterns
    for (const pattern of this.patterns) {
      if (
        this.matchesFramework(source, pattern.from) &&
        this.matchesFramework(target, pattern.to)
      ) {
        breakingChanges.push(...pattern.changes);
      }
    }

    // Calculate effort distribution
    const totalEffort = {
      trivial: 0,
      small: 0,
      medium: 0,
      large: 0,
    };

    let criticalCount = 0;
    let automatableCount = 0;

    for (const change of breakingChanges) {
      totalEffort[change.effort]++;
      if (change.severity === 'critical') criticalCount++;
      if (change.automatable) automatableCount++;
    }

    // Estimate hours based on effort
    const estimatedHours =
      totalEffort.trivial * 0.5 +
      totalEffort.small * 2 +
      totalEffort.medium * 8 +
      totalEffort.large * 24;

    return {
      source,
      target,
      breakingChanges,
      totalEffort,
      criticalCount,
      automatableCount,
      estimatedHours,
    };
  }

  private matchesFramework(detected: DetectedFramework, pattern: FrameworkVersion): boolean {
    // Match framework name
    const frameworkName = detected.variant || detected.framework;
    if (frameworkName.toLowerCase() !== pattern.framework.toLowerCase()) {
      return false;
    }

    // If no version constraints, match
    if (!pattern.minVersion && !pattern.maxVersion) {
      return true;
    }

    // Check version constraints
    const version = detected.version;
    if (!version) return false;

    if (pattern.minVersion && this.compareVersions(version, pattern.minVersion) < 0) {
      return false;
    }

    if (pattern.maxVersion && this.compareVersions(version, pattern.maxVersion) > 0) {
      return false;
    }

    return true;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  getBreakingChangesForFramework(framework: string): BreakingChangePattern[] {
    return this.patterns.filter(
      (pattern) => pattern.from.framework === framework || pattern.to.framework === framework
    );
  }

  generateMigrationScript(changes: BreakingChange[]): string {
    const automatableChanges = changes.filter((c) => c.automatable);

    if (automatableChanges.length === 0) {
      return '# No automatable changes found\n';
    }

    let script = `#!/bin/bash
# Auto-generated migration script
# WARNING: Review changes before applying

echo "Starting automated migration..."

`;

    for (const change of automatableChanges) {
      script += `# ${change.description}\n`;
      script += `echo "Applying: ${change.id}"\n`;

      if (change.searchPattern && change.replacement) {
        // Generate sed command for simple replacements
        const pattern = change.searchPattern.source;
        const replacement = change.replacement;
        script += `find . -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -exec sed -i '' 's/${pattern}/${replacement}/g' {} +\n`;
      }

      script += '\n';
    }

    script += 'echo "Automated migration complete. Please review changes and test thoroughly."\n';

    return script;
  }
}

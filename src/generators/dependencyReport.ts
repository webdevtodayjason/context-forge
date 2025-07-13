import { DependencyAnalysis } from '../services/dependencyAnalyzer';
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

export async function generateDependencyReport(
  config: ProjectConfig,
  analysis: DependencyAnalysis
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // Generate main dependency report
  const report = generateDependencyMarkdown(config, analysis);
  files.push({
    path: 'DEPENDENCY_MIGRATION.md',
    content: report,
    description: 'Dependency migration report',
  });

  // Generate package.json migration guide if needed
  if (analysis.replacements.length > 0) {
    const packageGuide = generatePackageJsonGuide(config, analysis);
    files.push({
      path: 'docs/package-migration.md',
      content: packageGuide,
      description: 'Package.json migration guide',
    });
  }

  // Generate dependency installation script
  if (analysis.replacements.length > 0) {
    const installScript = generateInstallScript(analysis);
    files.push({
      path: 'scripts/install-replacements.sh',
      content: installScript,
      description: 'Dependency replacement installation script',
    });
  }

  return files;
}

function generateDependencyMarkdown(config: ProjectConfig, analysis: DependencyAnalysis): string {
  return `# Dependency Migration Report

## Migration: ${config.migrationConfig?.sourceStack.name} → ${config.migrationConfig?.targetStack.name}

Generated: ${new Date().toISOString()}

## Summary

- **Total Dependencies**: ${analysis.totalDependencies}
- **Incompatible**: ${analysis.incompatibleCount} (${Math.round((analysis.incompatibleCount / analysis.totalDependencies) * 100)}%)
- **With Replacements**: ${analysis.hasReplacements}
- **Migration Complexity**: ${analysis.migrationComplexity.toUpperCase()}

## Risk Assessment

${getRiskAssessment(analysis)}

## Incompatible Dependencies

${
  analysis.incompatible.length === 0
    ? '✅ No incompatible dependencies found!\n'
    : generateIncompatibleSection(analysis.incompatible)
}

## Replacement Recommendations

${
  analysis.replacements.length === 0
    ? 'No replacement recommendations available.\n'
    : generateReplacementSection(analysis.replacements)
}

## Migration Strategy

${generateMigrationStrategy(analysis)}

## Verification Steps

1. **Before Migration**:
   - Run full test suite
   - Document current functionality
   - Create dependency snapshot: \`npm list --depth=0 > dependencies-before.txt\`

2. **During Migration**:
   - Replace dependencies one by one
   - Test after each replacement
   - Check for API differences

3. **After Migration**:
   - Run full test suite
   - Compare functionality
   - Check bundle size changes
   - Performance testing

## All Dependencies

<details>
<summary>Click to expand full dependency list</summary>

| Package | Version | Framework | Compatible | Replacement |
|---------|---------|-----------|------------|-------------|
${analysis.dependencies
  .map(
    (dep) =>
      `| ${dep.name} | ${dep.version} | ${dep.framework} | ${dep.isCompatible ? '✅' : '❌'} | ${dep.hasReplacement ? '✅' : '-'} |`
  )
  .join('\n')}

</details>

## Resources

- [Package Migration Guide](./docs/package-migration.md)
- [Installation Script](./scripts/install-replacements.sh)
- [Original Stack Docs](${config.migrationConfig?.sourceStack.docs || '#'})
- [Target Stack Docs](${config.migrationConfig?.targetStack.docs || '#'})
`;
}

function getRiskAssessment(analysis: DependencyAnalysis): string {
  const incompatibleRatio = analysis.incompatibleCount / analysis.totalDependencies;

  if (incompatibleRatio > 0.5) {
    return `### 🔴 HIGH RISK
- Over 50% of dependencies are incompatible
- Significant refactoring required
- Consider phased migration approach`;
  } else if (incompatibleRatio > 0.2) {
    return `### 🟡 MEDIUM RISK
- ${Math.round(incompatibleRatio * 100)}% of dependencies need replacement
- Moderate refactoring required
- Plan for thorough testing`;
  } else {
    return `### 🟢 LOW RISK
- Only ${Math.round(incompatibleRatio * 100)}% of dependencies affected
- Minimal changes required
- Standard migration approach suitable`;
  }
}

function generateIncompatibleSection(incompatible: any[]): string {
  const bySeverity = {
    critical: incompatible.filter((i) => i.severity === 'critical'),
    high: incompatible.filter((i) => i.severity === 'high'),
    medium: incompatible.filter((i) => i.severity === 'medium'),
    low: incompatible.filter((i) => i.severity === 'low'),
  };

  return `### Critical (${bySeverity.critical.length})
${
  bySeverity.critical.length === 0
    ? '*None*\n'
    : bySeverity.critical.map((dep) => formatIncompatible(dep)).join('\n\n')
}

### High (${bySeverity.high.length})
${
  bySeverity.high.length === 0
    ? '*None*\n'
    : bySeverity.high.map((dep) => formatIncompatible(dep)).join('\n\n')
}

### Medium (${bySeverity.medium.length})
${
  bySeverity.medium.length === 0
    ? '*None*\n'
    : bySeverity.medium.map((dep) => formatIncompatible(dep)).join('\n\n')
}

### Low (${bySeverity.low.length})
${
  bySeverity.low.length === 0
    ? '*None*\n'
    : bySeverity.low.map((dep) => formatIncompatible(dep)).join('\n\n')
}`;
}

function formatIncompatible(dep: any): string {
  return `#### ${dep.package}
- **Reason**: ${dep.reason}
- **Resolution**: ${dep.resolution || 'Manual review required'}`;
}

function generateReplacementSection(replacements: any[]): string {
  const byEffort = {
    trivial: replacements.filter((r) => r.migrationEffort === 'trivial'),
    small: replacements.filter((r) => r.migrationEffort === 'small'),
    medium: replacements.filter((r) => r.migrationEffort === 'medium'),
    large: replacements.filter((r) => r.migrationEffort === 'large'),
  };

  return `### By Migration Effort

#### Trivial (${byEffort.trivial.length} - < 1 hour each)
${byEffort.trivial.map((r) => formatReplacement(r)).join('\n')}

#### Small (${byEffort.small.length} - 1-4 hours each)
${byEffort.small.map((r) => formatReplacement(r)).join('\n')}

#### Medium (${byEffort.medium.length} - 1-3 days each)
${byEffort.medium.map((r) => formatReplacement(r)).join('\n')}

#### Large (${byEffort.large.length} - 1+ week each)
${byEffort.large.map((r) => formatReplacement(r)).join('\n')}`;
}

function formatReplacement(replacement: any): string {
  return `- **${replacement.from}** → **${replacement.to}** (${replacement.confidence} confidence)${
    replacement.notes ? `\n  - ${replacement.notes}` : ''
  }`;
}

function generateMigrationStrategy(analysis: DependencyAnalysis): string {
  if (analysis.migrationComplexity === 'high') {
    return `### Recommended Approach: Phased Migration

1. **Phase 1: Framework-Agnostic Dependencies**
   - Replace utility libraries first
   - These typically have fewer breaking changes

2. **Phase 2: Build Tools and Dev Dependencies**
   - Update build tools and testing frameworks
   - Ensure development workflow is stable

3. **Phase 3: Core Framework Dependencies**
   - Replace framework-specific packages
   - May require significant code changes

4. **Phase 4: Integration and Testing**
   - Full integration testing
   - Performance benchmarking
   - Security audit`;
  } else if (analysis.migrationComplexity === 'medium') {
    return `### Recommended Approach: Incremental Migration

1. **Week 1: Analysis and Planning**
   - Review all incompatible dependencies
   - Create detailed migration plan
   - Set up parallel development branch

2. **Week 2-3: Implementation**
   - Replace dependencies in order of complexity
   - Test each replacement thoroughly
   - Update documentation

3. **Week 4: Testing and Deployment**
   - Complete test coverage
   - Performance testing
   - Staged deployment`;
  } else {
    return `### Recommended Approach: Direct Migration

1. **Day 1: Preparation**
   - Review incompatible dependencies
   - Install replacements
   - Update imports

2. **Day 2-3: Implementation**
   - Update code for new APIs
   - Fix any breaking changes
   - Run tests

3. **Day 4: Verification**
   - Full test suite
   - Manual testing
   - Deploy to staging`;
  }
}

function generatePackageJsonGuide(config: ProjectConfig, analysis: DependencyAnalysis): string {
  return `# Package.json Migration Guide

## Overview

This guide shows how to update your package.json for the ${config.migrationConfig?.targetStack.name} migration.

## Dependencies to Remove

\`\`\`json
{
  "dependencies": {
${analysis.incompatible
  .filter((i) => i.resolution?.includes('Remove'))
  .map((i) => `    "${i.package}": "DELETE THIS LINE"`)
  .join(',\n')}
  }
}
\`\`\`

## Dependencies to Replace

\`\`\`json
{
  "dependencies": {
${analysis.replacements
  .filter((r) => r.confidence === 'high')
  .map((r) => `    // Replace "${r.from}" with:\n    "${r.to}": "^latest"`)
  .join(',\n')}
  }
}
\`\`\`

## New Dependencies to Add

Based on your target framework (${config.migrationConfig?.targetStack.name}), consider adding:

\`\`\`json
{
  "dependencies": {
${getFrameworkDependencies(config.migrationConfig?.targetStack.name || '')}
  }
}
\`\`\`

## Scripts to Update

Update your npm scripts for the new framework:

\`\`\`json
{
  "scripts": {
${getFrameworkScripts(config.migrationConfig?.targetStack.name || '')}
  }
}
\`\`\`

## Step-by-Step Instructions

1. **Backup current package.json**:
   \`\`\`bash
   cp package.json package.json.backup
   \`\`\`

2. **Remove incompatible packages**:
   \`\`\`bash
   npm uninstall ${analysis.incompatible.map((i) => i.package).join(' ')}
   \`\`\`

3. **Install replacements**:
   \`\`\`bash
   npm install ${analysis.replacements.map((r) => r.to).join(' ')}
   \`\`\`

4. **Verify installation**:
   \`\`\`bash
   npm list --depth=0
   \`\`\`

5. **Test the build**:
   \`\`\`bash
   npm run build
   \`\`\`
`;
}

function getFrameworkDependencies(framework: string): string {
  const deps: Record<string, string> = {
    react: `    "react": "^18.2.0",
    "react-dom": "^18.2.0"`,
    vue: `    "vue": "^3.3.0"`,
    angular: `    "@angular/core": "^16.0.0",
    "@angular/common": "^16.0.0"`,
    'next.js': `    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"`,
  };

  return deps[framework.toLowerCase()] || '    // Add framework dependencies';
}

function getFrameworkScripts(framework: string): string {
  const scripts: Record<string, string> = {
    react: `    "start": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"`,
    vue: `    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"`,
    'next.js': `    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"`,
  };

  return scripts[framework.toLowerCase()] || '    // Add framework scripts';
}

function generateInstallScript(analysis: DependencyAnalysis): string {
  return `#!/bin/bash
# Dependency Replacement Installation Script
# Generated: ${new Date().toISOString()}

set -e

echo "🔄 Starting dependency migration..."
echo ""

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Check if npm or yarn
if [ -f "yarn.lock" ]; then
  PKG_MANAGER="yarn"
  INSTALL_CMD="yarn add"
  UNINSTALL_CMD="yarn remove"
elif [ -f "pnpm-lock.yaml" ]; then
  PKG_MANAGER="pnpm"
  INSTALL_CMD="pnpm add"
  UNINSTALL_CMD="pnpm remove"
else
  PKG_MANAGER="npm"
  INSTALL_CMD="npm install"
  UNINSTALL_CMD="npm uninstall"
fi

echo "Using package manager: $PKG_MANAGER"
echo ""

# Backup package.json
echo "📦 Backing up package.json..."
cp package.json package.json.backup-$(date +%Y%m%d-%H%M%S)

# Remove incompatible packages
echo ""
echo "🗑️  Removing incompatible packages..."
REMOVE_PACKAGES="${analysis.incompatible.map((i) => i.package).join(' ')}"
if [ -n "$REMOVE_PACKAGES" ]; then
  echo "Removing: $REMOVE_PACKAGES"
  $UNINSTALL_CMD $REMOVE_PACKAGES || echo "\${YELLOW}Some packages could not be removed\${NC}"
fi

# Install replacements
echo ""
echo "📥 Installing replacement packages..."
${analysis.replacements
  .map(
    (r) => `
echo "Replacing \${RED}${r.from}\${NC} with \${GREEN}${r.to}\${NC}"
$INSTALL_CMD ${r.to} || echo "\${YELLOW}Failed to install ${r.to}\${NC}"`
  )
  .join('\n')}

# Verify installation
echo ""
echo "✅ Verifying installation..."
$PKG_MANAGER list --depth=0

echo ""
echo "🎉 Dependency migration complete!"
echo ""
echo "Next steps:"
echo "1. Update import statements in your code"
echo "2. Run your test suite"
echo "3. Check for TypeScript/ESLint errors"
echo "4. Test application functionality"
`;
}

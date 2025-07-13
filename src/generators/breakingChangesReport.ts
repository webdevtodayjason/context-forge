import { BreakingChange } from '../services/breakingChangeAnalyzer';
import { ProjectConfig } from '../types';
import { GeneratedFile } from '../adapters/base';

export async function generateBreakingChangesReport(
  config: ProjectConfig,
  breakingChanges: BreakingChange[]
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (breakingChanges.length === 0) {
    return files;
  }

  // Generate main breaking changes document
  const breakingChangesDoc = generateBreakingChangesMarkdown(config, breakingChanges);
  files.push({
    path: 'BREAKING_CHANGES.md',
    content: breakingChangesDoc,
    description: 'Breaking changes documentation',
  });

  // Generate automated migration script if applicable
  const automatableChanges = breakingChanges.filter((c) => c.automatable);
  if (automatableChanges.length > 0) {
    const migrationScript = generateMigrationScript(automatableChanges);
    files.push({
      path: 'scripts/auto-migrate.sh',
      content: migrationScript,
      description: 'Automated migration script',
    });
  }

  // Generate manual migration guide
  const manualChanges = breakingChanges.filter((c) => !c.automatable);
  if (manualChanges.length > 0) {
    const manualGuide = generateManualMigrationGuide(config, manualChanges);
    files.push({
      path: 'docs/manual-migration-guide.md',
      content: manualGuide,
      description: 'Manual migration guide',
    });
  }

  return files;
}

function generateBreakingChangesMarkdown(
  config: ProjectConfig,
  breakingChanges: BreakingChange[]
): string {
  const grouped = groupChangesBySeverity(breakingChanges);

  return `# Breaking Changes Report

## Migration: ${config.migrationConfig?.sourceStack.name} → ${config.migrationConfig?.targetStack.name}

Generated: ${new Date().toISOString()}

## Summary

- **Total Breaking Changes**: ${breakingChanges.length}
- **Critical**: ${grouped.critical.length}
- **High**: ${grouped.high.length}
- **Medium**: ${grouped.medium.length}
- **Low**: ${grouped.low.length}

### Automation Potential
- **Automatable**: ${breakingChanges.filter((c) => c.automatable).length}
- **Manual Required**: ${breakingChanges.filter((c) => !c.automatable).length}

### Effort Estimation
- **Trivial**: ${breakingChanges.filter((c) => c.effort === 'trivial').length} changes
- **Small**: ${breakingChanges.filter((c) => c.effort === 'small').length} changes
- **Medium**: ${breakingChanges.filter((c) => c.effort === 'medium').length} changes
- **Large**: ${breakingChanges.filter((c) => c.effort === 'large').length} changes

## Critical Changes
${generateChangeSection(grouped.critical)}

## High Priority Changes
${generateChangeSection(grouped.high)}

## Medium Priority Changes
${generateChangeSection(grouped.medium)}

## Low Priority Changes
${generateChangeSection(grouped.low)}

## Next Steps

1. Review all critical changes first
2. Run \`scripts/auto-migrate.sh\` for automated changes
3. Follow \`docs/manual-migration-guide.md\` for manual changes
4. Test thoroughly after each change
5. Update tests to reflect new patterns

## Resources

- [Migration Guide](./docs/manual-migration-guide.md)
- [Automated Migration Script](./scripts/auto-migrate.sh)
- [Original Documentation](${config.migrationConfig?.sourceStack.docs || '#'})
- [Target Documentation](${config.migrationConfig?.targetStack.docs || '#'})
`;
}

function generateChangeSection(changes: BreakingChange[]): string {
  if (changes.length === 0) {
    return '*No changes in this category*\n';
  }

  return changes
    .map(
      (change) => `
### ${change.id}

**Description**: ${change.description}  
**Category**: ${change.category}  
**Effort**: ${change.effort}  
**Automatable**: ${change.automatable ? '✅ Yes' : '❌ No'}

${change.searchPattern ? `**Pattern**: \`${change.searchPattern.source}\`  ` : ''}
${change.replacement ? `**Replacement**: \`${change.replacement}\`  ` : ''}
${change.migrationGuide ? `\n**Migration Guide**: ${change.migrationGuide}` : ''}
`
    )
    .join('\n');
}

function groupChangesBySeverity(changes: BreakingChange[]): {
  critical: BreakingChange[];
  high: BreakingChange[];
  medium: BreakingChange[];
  low: BreakingChange[];
} {
  return {
    critical: changes.filter((c) => c.severity === 'critical'),
    high: changes.filter((c) => c.severity === 'high'),
    medium: changes.filter((c) => c.severity === 'medium'),
    low: changes.filter((c) => c.severity === 'low'),
  };
}

function generateMigrationScript(automatableChanges: BreakingChange[]): string {
  return `#!/bin/bash
# Auto-generated migration script
# Generated: ${new Date().toISOString()}
# WARNING: Review changes before applying

set -e

echo "🚀 Starting automated migration..."
echo "This script will apply ${automatableChanges.length} automated changes"
echo ""

# Backup reminder
echo "⚠️  Have you backed up your code? (y/n)"
read -r response
if [[ "$response" != "y" ]]; then
  echo "Please backup your code before proceeding."
  exit 1
fi

# File extensions to process
EXTENSIONS="js jsx ts tsx py rb java"

${automatableChanges.map((change) => generateChangeScript(change)).join('\n\n')}

echo ""
echo "✅ Automated migration complete!"
echo "Please review all changes and run your test suite."
echo ""
echo "Next steps:"
echo "1. Review git diff"
echo "2. Run your linter"
echo "3. Run your test suite"
echo "4. Commit changes"
`;
}

function generateChangeScript(change: BreakingChange): string {
  let script = `# ${change.description}\necho "Applying: ${change.id}"`;

  if (change.searchPattern && change.replacement) {
    const pattern = escapeForSed(change.searchPattern.source);
    const replacement = escapeForSed(change.replacement);

    script += `
for ext in $EXTENSIONS; do
  find . -name "*.$ext" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | while read -r file; do
    if grep -q "${pattern}" "$file"; then
      echo "  Updating: $file"
      sed -i.bak 's/${pattern}/${replacement}/g' "$file"
      rm "$file.bak"
    fi
  done
done`;
  } else {
    script += `\necho "  ⚠️  No automated script available for this change"`;
  }

  return script;
}

function escapeForSed(str: string): string {
  return str.replace(/[[\]{}()*+?.\\^$|#\s]/g, '\\$&');
}

function generateManualMigrationGuide(
  config: ProjectConfig,
  manualChanges: BreakingChange[]
): string {
  return `# Manual Migration Guide

## Overview

This guide covers ${manualChanges.length} breaking changes that require manual intervention.

## Before You Start

1. **Backup Your Code**: Ensure you have a clean git state
2. **Understand the Changes**: Read through each change before implementing
3. **Test Incrementally**: Test after each major change
4. **Update Tests**: Modify tests to match new patterns

## Changes by Category

${groupByCategory(manualChanges)}

## Detailed Migration Steps

${manualChanges.map((change, index) => generateDetailedSteps(change, index + 1)).join('\n\n')}

## Verification Checklist

After completing all manual migrations:

- [ ] All files compile without errors
- [ ] Linter passes
- [ ] Test suite passes
- [ ] Application runs correctly
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] All features work as expected

## Common Issues and Solutions

### Issue: Import errors after migration
**Solution**: Update import paths and ensure all dependencies are installed

### Issue: Type errors in TypeScript
**Solution**: Update type definitions to match new framework APIs

### Issue: Runtime errors
**Solution**: Check for behavioral changes in the migration guide

## Need Help?

- Consult the [official migration guide](${manualChanges[0]?.migrationGuide || '#'})
- Check framework documentation
- Search for similar migration experiences
- Ask in community forums
`;
}

function groupByCategory(changes: BreakingChange[]): string {
  const categories = new Map<string, BreakingChange[]>();

  changes.forEach((change) => {
    const existing = categories.get(change.category) || [];
    existing.push(change);
    categories.set(change.category, existing);
  });

  return Array.from(categories.entries())
    .map(
      ([category, categoryChanges]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)} Changes (${categoryChanges.length})
${categoryChanges.map((c) => `- ${c.description}`).join('\n')}`
    )
    .join('\n');
}

function generateDetailedSteps(change: BreakingChange, number: number): string {
  return `## ${number}. ${change.description}

**Severity**: ${change.severity}  
**Effort**: ${change.effort}  
**Category**: ${change.category}

### What Changed
${change.description}

### How to Migrate
${change.migrationGuide || generateGenericSteps(change)}

### Example

**Before:**
\`\`\`javascript
// Add example of old pattern
${change.searchPattern ? `// Pattern: ${change.searchPattern.source}` : '// Old pattern here'}
\`\`\`

**After:**
\`\`\`javascript
// Add example of new pattern
${change.replacement || '// New pattern here'}
\`\`\`

### Verification
- Check that the code compiles
- Run related tests
- Test the specific feature manually
`;
}

function generateGenericSteps(change: BreakingChange): string {
  const steps = ['Locate all instances of the old pattern'];

  switch (change.category) {
    case 'api':
      steps.push(
        'Update method calls to use new API',
        'Update any type definitions',
        'Test API functionality'
      );
      break;
    case 'syntax':
      steps.push(
        'Update syntax to new format',
        'Ensure proper imports',
        'Check for linting errors'
      );
      break;
    case 'structure':
      steps.push(
        'Reorganize files/folders as needed',
        'Update import paths',
        'Update build configuration'
      );
      break;
    case 'dependency':
      steps.push(
        'Update package dependencies',
        'Install new packages',
        'Remove old packages',
        'Update import statements'
      );
      break;
    case 'config':
      steps.push(
        'Update configuration files',
        'Verify environment variables',
        'Test configuration loading'
      );
      break;
    case 'behavior':
      steps.push(
        'Understand the behavioral change',
        'Update code to handle new behavior',
        'Add tests for edge cases'
      );
      break;
  }

  return steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
}

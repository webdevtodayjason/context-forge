import chalk from 'chalk';
import { AIIntelligenceService, SmartSuggestion } from './aiIntelligenceService';
import { ProjectConfig } from '../types';

export interface ErrorContext {
  command: string;
  operation: string;
  projectPath: string;
  config?: ProjectConfig | Record<string, unknown>;
  stackTrace?: string;
}

export interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  action: () => Promise<boolean>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  automated: boolean;
}

export class ErrorRecoveryService {
  private aiService: AIIntelligenceService;

  constructor() {
    this.aiService = new AIIntelligenceService();
  }

  async handleError(error: Error, context: ErrorContext): Promise<void> {
    console.log(chalk.red.bold('\n❌ Error occurred:\n'));
    console.log(chalk.red(`${error.message}\n`));

    // Get recovery suggestions
    const suggestions = await this.getRecoverySuggestions(error, context);
    const actions = this.generateRecoveryActions(error, context, suggestions);

    if (actions.length === 0) {
      console.log(chalk.yellow('No automated recovery suggestions available.'));
      console.log(chalk.gray('Please check the error message and try again.\n'));
      return;
    }

    console.log(chalk.yellow(`🔧 Found ${actions.length} potential solutions:\n`));

    // Show recovery options
    actions.forEach((action, index) => {
      const priorityColor = this.getPriorityColor(action.priority);
      console.log((chalk as any)[priorityColor](`${index + 1}. ${action.title}`));
      console.log(chalk.gray(`   ${action.description}`));
      console.log(
        chalk.gray(
          `   ${action.automated ? '🤖 Automated' : '👤 Manual'} • Priority: ${action.priority}\n`
        )
      );
    });

    // Auto-execute critical automated fixes
    const criticalAutomated = actions.filter((a) => a.priority === 'critical' && a.automated);
    if (criticalAutomated.length > 0) {
      console.log(chalk.blue('🚀 Attempting automated fixes...\n'));

      for (const action of criticalAutomated) {
        try {
          console.log(chalk.gray(`Trying: ${action.title}...`));
          const success = await action.action();
          if (success) {
            console.log(chalk.green(`✅ Fixed: ${action.title}`));
            console.log(chalk.green('Recovery successful! You can now retry your command.\n'));
            return;
          } else {
            console.log(chalk.yellow(`⚠️  Partial fix: ${action.title}`));
          }
        } catch (fixError) {
          console.log(chalk.red(`❌ Fix failed: ${action.title}`));
          console.log(chalk.gray(`   ${(fixError as Error).message}`));
        }
      }
    }

    // Show manual instructions
    const manualActions = actions.filter((a) => !a.automated);
    if (manualActions.length > 0) {
      console.log(chalk.yellow('📋 Manual steps to try:'));
      manualActions.forEach((action, index) => {
        console.log(chalk.white(`${index + 1}. ${action.description}`));
      });
      console.log('');
    }

    // Show additional help
    this.showAdditionalHelp(error, context);
  }

  private async getRecoverySuggestions(
    error: Error,
    context: ErrorContext
  ): Promise<SmartSuggestion[]> {
    try {
      return await this.aiService.generateErrorRecoverySuggestions(
        error,
        JSON.stringify(context, null, 2),
        context.projectPath
      );
    } catch {
      console.log(chalk.gray('Note: AI suggestions unavailable, using fallback analysis.'));
      return [];
    }
  }

  private generateRecoveryActions(
    error: Error,
    context: ErrorContext,
    suggestions: SmartSuggestion[]
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    // Permission errors
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      actions.push({
        id: 'fix-permissions',
        title: 'Fix file permissions',
        description: 'Update file permissions to allow read/write access',
        priority: 'critical',
        automated: true,
        action: async () => this.fixPermissions(context.projectPath),
      });
    }

    // Missing file errors
    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      actions.push({
        id: 'create-missing-dirs',
        title: 'Create missing directories',
        description: 'Create any missing directories in the project path',
        priority: 'high',
        automated: true,
        action: async () => this.createMissingDirectories(context.projectPath),
      });
    }

    // Module not found errors
    if (
      error.message.includes('Cannot find module') ||
      error.message.includes('MODULE_NOT_FOUND')
    ) {
      actions.push({
        id: 'install-dependencies',
        title: 'Install missing dependencies',
        description: 'Run npm install to install missing packages',
        priority: 'high',
        automated: true,
        action: async () => this.installDependencies(context.projectPath),
      });
    }

    // Configuration errors
    if (error.message.includes('config') || error.message.includes('configuration')) {
      actions.push({
        id: 'reset-config',
        title: 'Reset configuration',
        description: 'Clear any cached configuration and use defaults',
        priority: 'medium',
        automated: true,
        action: async () => this.resetConfiguration(context.projectPath),
      });
    }

    // API/Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      actions.push({
        id: 'retry-with-fallback',
        title: 'Use offline mode',
        description: 'Retry the operation without AI features or external dependencies',
        priority: 'medium',
        automated: false,
        action: async () => true,
      });
    }

    // Add AI suggestions as actions
    suggestions.forEach((suggestion, index) => {
      if (suggestion.priority === 'high') {
        actions.push({
          id: `ai-suggestion-${index}`,
          title: suggestion.title,
          description: suggestion.description,
          priority: 'high',
          automated: false,
          action: async () => true,
        });
      }
    });

    // Sort by priority
    return actions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async fixPermissions(projectPath: string): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      await execAsync(`chmod -R 755 "${projectPath}"`);
      return true;
    } catch {
      return false;
    }
  }

  private async createMissingDirectories(projectPath: string): Promise<boolean> {
    try {
      const fs = await import('fs-extra');
      await fs.ensureDir(projectPath);
      return true;
    } catch {
      return false;
    }
  }

  private async installDependencies(projectPath: string): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      const fs = await import('fs-extra');
      const path = await import('path');

      // Check if package.json exists
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        await execAsync('npm install', { cwd: projectPath });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async resetConfiguration(projectPath: string): Promise<boolean> {
    try {
      const fs = await import('fs-extra');
      const path = await import('path');

      // Remove any cache or config files
      const configPaths = [
        path.join(projectPath, '.context-forge'),
        path.join(projectPath, 'node_modules/.cache'),
      ];

      for (const configPath of configPaths) {
        if (await fs.pathExists(configPath)) {
          await fs.remove(configPath);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'red';
      case 'high':
        return 'yellow';
      case 'medium':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'white';
    }
  }

  private showAdditionalHelp(_error: Error, _context: ErrorContext): void {
    console.log(chalk.blue('💡 Additional resources:'));
    console.log(
      chalk.gray('• Documentation: https://github.com/webdevtodayjason/context-forge#readme')
    );
    console.log(chalk.gray('• Issues: https://github.com/webdevtodayjason/context-forge/issues'));
    console.log(chalk.gray('• Discord: Contact for community support'));

    if (this.aiService.isAIEnabled()) {
      console.log(chalk.gray('• AI assistance is available for more detailed suggestions'));
    } else {
      console.log(chalk.gray('• Set ANTHROPIC_API_KEY for AI-powered error recovery'));
    }

    console.log('');
  }

  // Method to wrap command execution with error recovery
  async executeWithRecovery<T>(operation: () => Promise<T>, context: ErrorContext): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error as Error, context);
      throw error; // Re-throw after handling
    }
  }
}

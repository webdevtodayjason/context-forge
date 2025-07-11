import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

export interface ApiConfig {
  provider: 'anthropic' | 'openai' | 'gemini';
  apiKey: string;
  model?: string;
}

export class ApiKeyManager {
  private configPath: string;
  private gitignorePath: string;

  constructor(private projectPath: string) {
    this.configPath = path.join(projectPath, '.context-forge-api');
    this.gitignorePath = path.join(projectPath, '.gitignore');
  }

  async setupApiKey(): Promise<ApiConfig | null> {
    // Check if config already exists
    if (await fs.pathExists(this.configPath)) {
      const useExisting = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useExisting',
          message: 'Found existing API configuration. Use it?',
          default: true,
        },
      ]);

      if (useExisting.useExisting) {
        return this.loadConfig();
      }
    }

    // Interactive API provider selection
    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Which AI provider would you like to use for analysis?',
        choices: [
          { name: 'Anthropic Claude (Claude-3.5-Sonnet)', value: 'anthropic' },
          { name: 'OpenAI (GPT-4)', value: 'openai' },
          { name: 'Google Gemini (Gemini-1.5-Pro)', value: 'gemini' },
        ],
      },
    ]);

    // Get API key securely
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: `Enter your ${this.getProviderName(provider)} API key:`,
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'API key is required';
          }
          if (input.length < 10) {
            return 'API key seems too short';
          }
          return true;
        },
      },
    ]);

    const config: ApiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: this.getDefaultModel(provider),
    };

    // Save config
    await this.saveConfig(config);
    await this.updateGitignore();

    console.log(chalk.green('\n✅ API configuration saved securely'));
    console.log(chalk.gray('• Config stored in .context-forge-api'));
    console.log(chalk.gray('• Added to .gitignore automatically\n'));

    return config;
  }

  async loadConfig(): Promise<ApiConfig | null> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        return null;
      }

      const configData = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(configData) as ApiConfig;
    } catch {
      console.warn(chalk.yellow('Warning: Could not load API configuration'));
      return null;
    }
  }

  private async saveConfig(config: ApiConfig): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  private async updateGitignore(): Promise<void> {
    const gitignoreEntry = '.context-forge-api';

    try {
      let gitignoreContent = '';
      if (await fs.pathExists(this.gitignorePath)) {
        gitignoreContent = await fs.readFile(this.gitignorePath, 'utf-8');
      }

      if (!gitignoreContent.includes(gitignoreEntry)) {
        const newContent = gitignoreContent
          ? `${gitignoreContent.trimEnd()}\n\n# Context Forge API keys\n${gitignoreEntry}\n`
          : `# Context Forge API keys\n${gitignoreEntry}\n`;

        await fs.writeFile(this.gitignorePath, newContent);
      }
    } catch {
      console.warn(chalk.yellow('Warning: Could not update .gitignore'));
    }
  }

  private getProviderName(provider: string): string {
    const names = {
      anthropic: 'Anthropic',
      openai: 'OpenAI',
      gemini: 'Google',
    };
    return names[provider as keyof typeof names] || provider;
  }

  private getDefaultModel(provider: string): string {
    const models = {
      anthropic: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4-turbo-preview',
      gemini: 'gemini-1.5-pro',
    };
    return models[provider as keyof typeof models] || '';
  }
}

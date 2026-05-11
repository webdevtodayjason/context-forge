import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ApiConfig } from './apiKeyManager';

/**
 * Enhanced API key manager that checks multiple sources for API keys
 * 1. Environment variables
 * 2. Global config directory (~/.context-forge/)
 * 3. Project-local config (.context-forge-api)
 */
export class GlobalApiKeyManager {
  private globalConfigDir: string;
  private globalApiConfigPath: string;

  constructor(private projectPath?: string) {
    this.globalConfigDir = path.join(os.homedir(), '.context-forge');
    this.globalApiConfigPath = path.join(this.globalConfigDir, 'api-config.json');
  }

  /**
   * Auto-detect API configuration from multiple sources
   * Priority: Environment Variables > Global Config > Project Config
   */
  async autoDetectApiConfig(): Promise<ApiConfig | null> {
    // 1. Check environment variables first (highest priority)
    const envConfig = this.detectFromEnvironment();
    if (envConfig) {
      console.log('🔑 Using API keys from environment variables');
      return envConfig;
    }

    // 2. Check global config directory
    const globalConfig = await this.loadGlobalConfig();
    if (globalConfig) {
      console.log('🔑 Using API keys from global config (~/.context-forge/)');
      return globalConfig;
    }

    // 3. Check project-local config (if project path provided)
    if (this.projectPath) {
      const projectConfig = await this.loadProjectConfig();
      if (projectConfig) {
        console.log('🔑 Using API keys from project config (.context-forge-api)');
        return projectConfig;
      }
    }

    return null;
  }

  /**
   * Detect API config from environment variables
   */
  private detectFromEnvironment(): ApiConfig | null {
    // Check Anthropic first (most likely for Context Forge users)
    if (process.env.ANTHROPIC_API_KEY) {
      return {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
      };
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
      };
    }

    // Check Google Gemini
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      return {
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!,
        model: 'gemini-1.5-pro',
      };
    }

    return null;
  }

  /**
   * Load API config from global directory (~/.context-forge/api-config.json)
   */
  private async loadGlobalConfig(): Promise<ApiConfig | null> {
    try {
      if (!(await fs.pathExists(this.globalApiConfigPath))) {
        return null;
      }

      const configData = await fs.readFile(this.globalApiConfigPath, 'utf-8');
      const config = JSON.parse(configData) as ApiConfig;

      // Validate the config
      if (config.provider && config.apiKey && config.apiKey.length > 10) {
        return config;
      }

      return null;
    } catch (error) {
      console.warn('Warning: Could not load global API configuration');
      return null;
    }
  }

  /**
   * Load API config from project-local file (.context-forge-api)
   */
  private async loadProjectConfig(): Promise<ApiConfig | null> {
    if (!this.projectPath) return null;

    try {
      const projectApiPath = path.join(this.projectPath, '.context-forge-api');
      if (!(await fs.pathExists(projectApiPath))) {
        return null;
      }

      const configData = await fs.readFile(projectApiPath, 'utf-8');
      const config = JSON.parse(configData) as ApiConfig;

      // Validate the config
      if (config.provider && config.apiKey && config.apiKey.length > 10) {
        return config;
      }

      return null;
    } catch (error) {
      console.warn('Warning: Could not load project API configuration');
      return null;
    }
  }

  /**
   * Save API config to global directory for future use
   */
  async saveGlobalConfig(config: ApiConfig): Promise<void> {
    try {
      await fs.ensureDir(this.globalConfigDir);
      await fs.writeFile(this.globalApiConfigPath, JSON.stringify(config, null, 2), {
        mode: 0o600,
      });
      console.log(`✅ API configuration saved to global config: ${this.globalApiConfigPath}`);
    } catch (error) {
      console.warn('Warning: Could not save global API configuration');
    }
  }

  /**
   * Get available API providers from all sources
   */
  async getAvailableProviders(): Promise<string[]> {
    const providers = new Set<string>();

    // Check environment variables
    if (process.env.ANTHROPIC_API_KEY) providers.add('anthropic');
    if (process.env.OPENAI_API_KEY) providers.add('openai');
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) providers.add('gemini');

    // Check global config
    const globalConfig = await this.loadGlobalConfig();
    if (globalConfig) providers.add(globalConfig.provider);

    // Check project config
    if (this.projectPath) {
      const projectConfig = await this.loadProjectConfig();
      if (projectConfig) providers.add(projectConfig.provider);
    }

    return Array.from(providers);
  }

  /**
   * Check if any API keys are available
   */
  async hasApiKeys(): Promise<boolean> {
    const config = await this.autoDetectApiConfig();
    return config !== null;
  }

  /**
   * Get the best available API config with preference scoring
   */
  async getBestApiConfig(): Promise<ApiConfig | null> {
    // Environment variables have highest priority
    const envConfig = this.detectFromEnvironment();
    if (envConfig) return envConfig;

    // Global config second
    const globalConfig = await this.loadGlobalConfig();
    if (globalConfig) return globalConfig;

    // Project config last
    if (this.projectPath) {
      const projectConfig = await this.loadProjectConfig();
      if (projectConfig) return projectConfig;
    }

    return null;
  }

  /**
   * Setup instructions for users without API keys
   */
  getSetupInstructions(): string {
    return `
🔑 No API keys detected. To enable AI-enhanced PRPs, you can:

1. **Environment Variables** (Recommended for development):
   export ANTHROPIC_API_KEY="your-key-here"
   # or
   export OPENAI_API_KEY="your-key-here"

2. **Global Config** (Recommended for personal use):
   mkdir -p ~/.context-forge
   echo '{"provider":"anthropic","apiKey":"your-key","model":"claude-3-5-sonnet-20241022"}' > ~/.context-forge/api-config.json

3. **Project Config** (for team projects):
   Use: context-forge analyze (without --task-file) to set up project-specific keys

Available providers:
• Anthropic Claude (anthropic) - Best for code analysis
• OpenAI GPT-4 (openai) - Good general purpose
• Google Gemini (gemini) - Good for complex reasoning
`;
  }
}

export default GlobalApiKeyManager;

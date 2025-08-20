import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import chalk from 'chalk';

export type AIProvider = 'openai' | 'anthropic';

export interface StoredKeys {
  openai?: string;
  anthropic?: string;
}

export interface KeyConfig {
  provider: AIProvider;
  encrypted: string;
  salt: string;
  timestamp: number;
}

export class KeyManager {
  private static readonly KEYS_FILE = '.context-forge-keys';
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-cbc';

  private static getKeysPath(): string {
    return path.join(os.homedir(), this.KEYS_FILE);
  }

  private static getGitignorePath(): string {
    return path.join(process.cwd(), '.gitignore');
  }

  /**
   * Generate a secure random key for encryption
   */
  private static generateKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypt an API key
   */
  private static encryptKey(apiKey: string): { encrypted: string; salt: string } {
    const salt = crypto.randomBytes(32);
    const key = this.generateKey(os.userInfo().username, salt);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted: `${iv.toString('hex')}:${encrypted}`,
      salt: salt.toString('hex'),
    };
  }

  /**
   * Decrypt an API key
   */
  private static decryptKey(encryptedData: string, saltHex: string): string {
    const salt = Buffer.from(saltHex, 'hex');
    const key = this.generateKey(os.userInfo().username, salt);

    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Store an API key securely
   */
  public static async storeKey(provider: AIProvider, apiKey: string): Promise<void> {
    const keysPath = this.getKeysPath();

    // Encrypt the key
    const { encrypted, salt } = this.encryptKey(apiKey);

    // Load existing keys or create new structure
    let keyConfigs: Record<string, KeyConfig> = {};
    if (await fs.pathExists(keysPath)) {
      try {
        const content = await fs.readFile(keysPath, 'utf-8');
        keyConfigs = JSON.parse(content);
      } catch {
        console.warn(chalk.yellow('Warning: Could not read existing keys file, creating new one'));
      }
    }

    // Store the new key
    keyConfigs[provider] = {
      provider,
      encrypted,
      salt,
      timestamp: Date.now(),
    };

    // Save to file
    await fs.writeFile(keysPath, JSON.stringify(keyConfigs, null, 2), 'utf-8');

    // Set restrictive permissions (owner read/write only)
    await fs.chmod(keysPath, 0o600);

    console.log(chalk.green(`✓ ${provider} API key stored securely`));
  }

  /**
   * Retrieve an API key
   */
  public static async getKey(provider: AIProvider): Promise<string | null> {
    // Check environment variable first
    const envVar = `${provider.toUpperCase()}_API_KEY`;
    const envKey = process.env[envVar];
    if (envKey) {
      return envKey;
    }

    const keysPath = this.getKeysPath();

    if (!(await fs.pathExists(keysPath))) {
      return null;
    }

    try {
      const content = await fs.readFile(keysPath, 'utf-8');
      const keyConfigs: Record<string, KeyConfig> = JSON.parse(content);

      const config = keyConfigs[provider];
      if (!config) {
        return null;
      }

      return this.decryptKey(config.encrypted, config.salt);
    } catch (error) {
      console.error(chalk.red(`Error retrieving ${provider} API key:`, error));
      return null;
    }
  }

  /**
   * Check if a provider has a stored key
   */
  public static async hasKey(provider: AIProvider): Promise<boolean> {
    const key = await this.getKey(provider);
    return key !== null && key.length > 0;
  }

  /**
   * Get all available providers with stored keys
   */
  public static async getAvailableProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = ['openai', 'anthropic'];
    const available: AIProvider[] = [];

    for (const provider of providers) {
      if (await this.hasKey(provider)) {
        available.push(provider);
      }
    }

    return available;
  }

  /**
   * Test an API key by making a simple API call
   */
  public static async testKey(provider: AIProvider, apiKey?: string): Promise<boolean> {
    const key = apiKey || (await this.getKey(provider));
    if (!key) return false;

    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        });
        return response.status === 200;
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        return response.status === 200 || response.status === 400; // 400 is ok for this test
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Add .context-forge-keys to .gitignore
   */
  public static async ensureGitignore(): Promise<void> {
    const gitignorePath = this.getGitignorePath();
    const keyEntry = `.context-forge-keys`;

    try {
      let gitignoreContent = '';

      if (await fs.pathExists(gitignorePath)) {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      }

      // Check if the entry already exists
      if (gitignoreContent.includes(keyEntry)) {
        return;
      }

      // Add entry with a comment
      const newContent =
        gitignoreContent +
        (gitignoreContent.endsWith('\n') ? '' : '\n') +
        `\n# Context Forge API keys (added automatically)\n${keyEntry}\n`;

      await fs.writeFile(gitignorePath, newContent, 'utf-8');
      console.log(chalk.blue(`✓ Added ${keyEntry} to .gitignore`));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not update .gitignore: ${error}`));
    }
  }

  /**
   * List all stored keys (for debugging)
   */
  public static async listKeys(): Promise<void> {
    const keysPath = this.getKeysPath();

    if (!(await fs.pathExists(keysPath))) {
      console.log(chalk.yellow('No API keys stored'));
      return;
    }

    try {
      const content = await fs.readFile(keysPath, 'utf-8');
      const keyConfigs: Record<string, KeyConfig> = JSON.parse(content);

      console.log(chalk.blue('\nStored API Keys:'));
      for (const [provider, config] of Object.entries(keyConfigs)) {
        const date = new Date(config.timestamp).toLocaleDateString();
        console.log(chalk.gray(`  ${provider}: stored on ${date}`));
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error reading keys file:', error));
    }
  }

  /**
   * Remove a stored key
   */
  public static async removeKey(provider: AIProvider): Promise<void> {
    const keysPath = this.getKeysPath();

    if (!(await fs.pathExists(keysPath))) {
      console.log(chalk.yellow(`No keys stored for ${provider}`));
      return;
    }

    try {
      const content = await fs.readFile(keysPath, 'utf-8');
      const keyConfigs: Record<string, KeyConfig> = JSON.parse(content);

      if (!keyConfigs[provider]) {
        console.log(chalk.yellow(`No key stored for ${provider}`));
        return;
      }

      delete keyConfigs[provider];
      await fs.writeFile(keysPath, JSON.stringify(keyConfigs, null, 2), 'utf-8');

      console.log(chalk.green(`✓ Removed ${provider} API key`));
    } catch (error) {
      console.error(chalk.red(`Error removing ${provider} key:`, error));
    }
  }
}

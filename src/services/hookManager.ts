import { EventEmitter } from 'events';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface HookConfig {
  name: string;
  type: 'python' | 'javascript' | 'shell';
  path: string;
  enabled: boolean;
  timeout: number; // milliseconds
  permissions?: string[];
}

export interface HookResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  duration: number;
}

export class HookManager extends EventEmitter {
  private hooks: Map<string, HookConfig> = new Map();
  private hookDirectory: string;

  constructor(hookDirectory: string = path.join(process.env.HOME || '', '.claude', 'hooks')) {
    super();
    this.hookDirectory = hookDirectory;
  }

  /**
   * Initialize hook manager and scan for hooks
   */
  async initialize(): Promise<void> {
    console.log(chalk.blue('Initializing Hook Manager...'));

    if (!(await fs.pathExists(this.hookDirectory))) {
      console.log(chalk.yellow(`Hook directory doesn't exist: ${this.hookDirectory}`));
      return;
    }

    await this.scanHooks();
    await this.validateHooks();
  }

  /**
   * Scan directory for hooks
   */
  private async scanHooks(): Promise<void> {
    try {
      const files = await fs.readdir(this.hookDirectory);

      for (const file of files) {
        const filePath = path.join(this.hookDirectory, file);
        const stat = await fs.stat(filePath);

        if (!stat.isFile()) continue;

        let type: 'python' | 'javascript' | 'shell';
        let enabled = true;

        if (file.endsWith('.py')) {
          type = 'python';
          // Check if Python hook is executable
          try {
            await fs.access(filePath, fs.constants.X_OK);
          } catch {
            console.log(chalk.yellow(`Python hook not executable: ${file}`));
            enabled = false;
          }
        } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
          type = 'javascript';
        } else if (file.endsWith('.sh')) {
          type = 'shell';
        } else {
          continue; // Skip unsupported file types
        }

        const config: HookConfig = {
          name: path.basename(file, path.extname(file)),
          type,
          path: filePath,
          enabled,
          timeout: 30000, // 30 seconds default
        };

        this.hooks.set(config.name, config);
        console.log(
          chalk.gray(`Found ${type} hook: ${config.name} (${enabled ? 'enabled' : 'disabled'})`)
        );
      }
    } catch (error) {
      console.error(chalk.red(`Failed to scan hooks: ${error}`));
    }
  }

  /**
   * Validate hooks can execute
   */
  private async validateHooks(): Promise<void> {
    for (const [name, config] of this.hooks) {
      if (!config.enabled) continue;

      try {
        switch (config.type) {
          case 'python':
            await this.validatePythonHook(config);
            break;
          case 'javascript':
            await this.validateJavaScriptHook(config);
            break;
          case 'shell':
            await this.validateShellHook(config);
            break;
        }
      } catch (error) {
        console.log(chalk.red(`Hook validation failed for ${name}: ${error}`));
        config.enabled = false;
      }
    }
  }

  /**
   * Validate Python hook
   */
  private async validatePythonHook(config: HookConfig): Promise<void> {
    // Check if Python is available
    try {
      await execAsync('python3 --version');
    } catch {
      throw new Error('Python3 not available');
    }

    // Check shebang
    const content = await fs.readFile(config.path, 'utf-8');
    if (
      !content.startsWith('#!/usr/bin/env python3') &&
      !content.startsWith('#!/usr/bin/python3')
    ) {
      console.log(chalk.yellow(`Python hook ${config.name} missing proper shebang`));
    }

    // Test if hook responds to --help (timeout quickly)
    try {
      await Promise.race([
        execAsync(`python3 "${config.path}" --help`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
      console.log(chalk.green(`Python hook ${config.name} validated`));
    } catch (error) {
      if (error instanceof Error && error.message === 'timeout') {
        console.log(
          chalk.yellow(`Python hook ${config.name} doesn't respond to --help (may still work)`)
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Validate JavaScript hook
   */
  private async validateJavaScriptHook(config: HookConfig): Promise<void> {
    // Try to require/import the hook
    try {
      delete require.cache[config.path]; // Clear cache
      const hookModule = await import(config.path);
      if (!hookModule) {
        throw new Error('Hook module not found');
      }
      console.log(chalk.green(`JavaScript hook ${config.name} validated`));
    } catch (error) {
      throw new Error(`Failed to load: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate shell hook
   */
  private async validateShellHook(config: HookConfig): Promise<void> {
    // Check if file is executable
    try {
      await fs.access(config.path, fs.constants.X_OK);
      console.log(chalk.green(`Shell hook ${config.name} validated`));
    } catch {
      throw new Error('Not executable');
    }
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName: string, args: string[] = []): Promise<HookResult> {
    const config = this.hooks.get(hookName);
    if (!config) {
      return {
        success: false,
        error: `Hook not found: ${hookName}`,
        duration: 0,
      };
    }

    if (!config.enabled) {
      return {
        success: false,
        error: `Hook disabled: ${hookName}`,
        duration: 0,
      };
    }

    const startTime = Date.now();

    try {
      switch (config.type) {
        case 'python':
          return await this.executePythonHook(config, args);
        case 'javascript':
          return await this.executeJavaScriptHook(config, args);
        case 'shell':
          return await this.executeShellHook(config, args);
        default:
          return {
            success: false,
            error: `Unsupported hook type: ${config.type}`,
            duration: Date.now() - startTime,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute Python hook
   */
  private async executePythonHook(config: HookConfig, args: string[]): Promise<HookResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const child = spawn('python3', [config.path, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: config.timeout,
      });

      let output = '';
      let error = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (exitCode) => {
        const duration = Date.now() - startTime;
        resolve({
          success: exitCode === 0,
          output: output.trim(),
          error: error.trim() || undefined,
          exitCode: exitCode || 0,
          duration,
        });
      });

      child.on('error', (err) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          error: err.message,
          duration,
        });
      });

      // Handle timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          const duration = Date.now() - startTime;
          resolve({
            success: false,
            error: `Hook timeout after ${config.timeout}ms`,
            duration,
          });
        }
      }, config.timeout);
    });
  }

  /**
   * Execute JavaScript hook
   */
  private async executeJavaScriptHook(config: HookConfig, args: string[]): Promise<HookResult> {
    const startTime = Date.now();

    try {
      // Clear require cache
      delete require.cache[config.path];

      const hookModule = await import(config.path);
      const hookFunction = hookModule.default || hookModule;

      if (typeof hookFunction !== 'function') {
        throw new Error('Hook must export a function');
      }

      const result = await Promise.race([
        hookFunction(...args),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), config.timeout)),
      ]);

      return {
        success: true,
        output: typeof result === 'string' ? result : JSON.stringify(result),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute shell hook
   */
  private async executeShellHook(config: HookConfig, args: string[]): Promise<HookResult> {
    const startTime = Date.now();

    try {
      const command = `"${config.path}" ${args.map((arg) => `"${arg}"`).join(' ')}`;
      const { stdout, stderr } = await execAsync(command, {
        timeout: config.timeout,
        cwd: path.dirname(config.path),
      });

      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exitCode: (error as any).code,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get hook status
   */
  getHookStatus(): Array<{ name: string; type: string; enabled: boolean; path: string }> {
    return Array.from(this.hooks.values()).map((config) => ({
      name: config.name,
      type: config.type,
      enabled: config.enabled,
      path: config.path,
    }));
  }

  /**
   * Enable/disable hook
   */
  setHookEnabled(hookName: string, enabled: boolean): boolean {
    const config = this.hooks.get(hookName);
    if (!config) return false;

    config.enabled = enabled;
    console.log(chalk.blue(`Hook ${hookName} ${enabled ? 'enabled' : 'disabled'}`));
    return true;
  }

  /**
   * Disable all Python hooks (for troubleshooting)
   */
  disablePythonHooks(): void {
    for (const [name, config] of this.hooks) {
      if (config.type === 'python') {
        config.enabled = false;
        console.log(chalk.yellow(`Disabled Python hook: ${name}`));
      }
    }
  }
}

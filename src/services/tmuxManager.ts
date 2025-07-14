import { exec } from 'child_process';
import { promisify } from 'util';
import { TmuxWindowConfig, AgentSession } from '../types/orchestration';

const execAsync = promisify(exec);

export interface TmuxWindow {
  sessionName: string;
  windowIndex: number;
  windowName: string;
  active: boolean;
  paneCount?: number;
}

export interface TmuxSession {
  name: string;
  windows: TmuxWindow[];
  attached: boolean;
  created?: Date;
}

export class TmuxManager {
  private maxLinesCapture = 1000;
  private safetyMode = true;

  /**
   * Check if tmux is installed and available
   */
  async checkTmuxAvailable(): Promise<boolean> {
    try {
      await execAsync('which tmux');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all tmux sessions
   */
  async getSessions(): Promise<TmuxSession[]> {
    try {
      const { stdout } = await execAsync(
        'tmux list-sessions -F "#{session_name}:#{session_attached}"'
      );

      if (!stdout.trim()) {
        return [];
      }

      const sessions: TmuxSession[] = [];
      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const [sessionName, attached] = line.split(':');
        const windows = await this.getSessionWindows(sessionName);

        sessions.push({
          name: sessionName,
          windows,
          attached: attached === '1',
        });
      }

      return sessions;
    } catch (error: unknown) {
      // No sessions exist
      if (
        error instanceof Error &&
        'code' in error &&
        (error as any).code === 1 &&
        error.message.includes('no server running')
      ) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get windows for a specific session
   */
  async getSessionWindows(sessionName: string): Promise<TmuxWindow[]> {
    try {
      const { stdout } = await execAsync(
        `tmux list-windows -t ${sessionName} -F "#{window_index}:#{window_name}:#{window_active}"`
      );

      if (!stdout.trim()) {
        return [];
      }

      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const [windowIndex, windowName, windowActive] = line.split(':');
          return {
            sessionName,
            windowIndex: parseInt(windowIndex),
            windowName,
            active: windowActive === '1',
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Create a new tmux session
   */
  async createSession(sessionName: string, workingDirectory?: string): Promise<void> {
    const args = ['new-session', '-d', '-s', sessionName];

    if (workingDirectory) {
      args.push('-c', workingDirectory);
    }

    await execAsync(`tmux ${args.join(' ')}`);
  }

  /**
   * Create a new window in a session
   */
  async createWindow(config: TmuxWindowConfig): Promise<void> {
    const args = [
      'new-window',
      '-t',
      `${config.sessionName}`,
      '-n',
      config.windowName,
      '-c',
      config.workingDirectory,
    ];

    await execAsync(`tmux ${args.join(' ')}`);

    // Set window index if needed
    if (config.windowIndex !== undefined) {
      await this.moveWindow(
        config.sessionName,
        await this.getLastWindowIndex(config.sessionName),
        config.windowIndex
      );
    }

    // Run initial command if provided
    if (config.command) {
      await this.sendCommand(config.sessionName, config.windowIndex, config.command);
    }
  }

  /**
   * Rename a window
   */
  async renameWindow(sessionName: string, windowIndex: number, newName: string): Promise<void> {
    await execAsync(`tmux rename-window -t ${sessionName}:${windowIndex} "${newName}"`);
  }

  /**
   * Send keys to a window
   */
  async sendKeys(sessionName: string, windowIndex: number, keys: string): Promise<void> {
    await execAsync(`tmux send-keys -t ${sessionName}:${windowIndex} "${keys}"`);
  }

  /**
   * Send a command to a window (adds Enter automatically)
   */
  async sendCommand(sessionName: string, windowIndex: number, command: string): Promise<void> {
    await this.sendKeys(sessionName, windowIndex, command);
    await execAsync(`tmux send-keys -t ${sessionName}:${windowIndex} Enter`);
  }

  /**
   * Send a message to a Claude agent window
   * Uses proper timing to ensure Claude receives the message
   */
  async sendClaudeMessage(
    sessionName: string,
    windowIndex: number,
    message: string
  ): Promise<void> {
    // Send the message
    await this.sendKeys(sessionName, windowIndex, message);

    // Wait for UI to register (critical for Claude)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Send Enter
    await execAsync(`tmux send-keys -t ${sessionName}:${windowIndex} Enter`);
  }

  /**
   * Capture window content
   */
  async captureWindowContent(
    sessionName: string,
    windowIndex: number,
    lines: number = 50
  ): Promise<string> {
    const actualLines = Math.min(lines, this.maxLinesCapture);

    try {
      const { stdout } = await execAsync(
        `tmux capture-pane -t ${sessionName}:${windowIndex} -p -S -${actualLines}`
      );
      return stdout;
    } catch (error) {
      throw new Error(`Failed to capture window content: ${error}`);
    }
  }

  /**
   * Get window information
   */
  async getWindowInfo(sessionName: string, windowIndex: number): Promise<any> {
    try {
      const { stdout } = await execAsync(
        `tmux display-message -t ${sessionName}:${windowIndex} -p "#{window_name}:#{window_active}:#{window_panes}"`
      );

      const [name, active, panes] = stdout.trim().split(':');

      return {
        name,
        active: active === '1',
        panes: parseInt(panes),
        content: await this.captureWindowContent(sessionName, windowIndex),
      };
    } catch (error) {
      throw new Error(`Failed to get window info: ${error}`);
    }
  }

  /**
   * Check if a session exists
   */
  async sessionExists(sessionName: string): Promise<boolean> {
    try {
      await execAsync(`tmux has-session -t ${sessionName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kill a window
   */
  async killWindow(sessionName: string, windowIndex: number): Promise<void> {
    await execAsync(`tmux kill-window -t ${sessionName}:${windowIndex}`);
  }

  /**
   * Kill a session
   */
  async killSession(sessionName: string): Promise<void> {
    await execAsync(`tmux kill-session -t ${sessionName}`);
  }

  /**
   * Find windows by name pattern
   */
  async findWindowsByName(
    pattern: string
  ): Promise<Array<{ session: string; window: number; name: string }>> {
    const sessions = await this.getSessions();
    const matches: Array<{ session: string; window: number; name: string }> = [];

    for (const session of sessions) {
      for (const window of session.windows) {
        if (window.windowName.toLowerCase().includes(pattern.toLowerCase())) {
          matches.push({
            session: session.name,
            window: window.windowIndex,
            name: window.windowName,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Create a monitoring snapshot for all sessions
   */
  async createMonitoringSnapshot(): Promise<string> {
    const sessions = await this.getSessions();
    const timestamp = new Date().toISOString();

    let snapshot = `Tmux Monitoring Snapshot - ${timestamp}\n`;
    snapshot += '='.repeat(50) + '\n\n';

    for (const session of sessions) {
      snapshot += `Session: ${session.name} (${session.attached ? 'ATTACHED' : 'DETACHED'})\n`;
      snapshot += '-'.repeat(30) + '\n';

      for (const window of session.windows) {
        snapshot += `  Window ${window.windowIndex}: ${window.windowName}`;
        if (window.active) {
          snapshot += ' (ACTIVE)';
        }
        snapshot += '\n';

        try {
          const content = await this.captureWindowContent(session.name, window.windowIndex, 10);
          const lines = content.split('\n').filter((line) => line.trim());

          if (lines.length > 0) {
            snapshot += '    Recent output:\n';
            lines.forEach((line) => {
              snapshot += `    | ${line}\n`;
            });
          }
        } catch {
          snapshot += '    | [Unable to capture content]\n';
        }

        snapshot += '\n';
      }
    }

    return snapshot;
  }

  /**
   * Wait for a window to contain specific text
   */
  async waitForText(
    sessionName: string,
    windowIndex: number,
    text: string,
    timeout: number = 30000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const content = await this.captureWindowContent(sessionName, windowIndex, 50);
        if (content.includes(text)) {
          return true;
        }
      } catch {
        // Window might not exist yet
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  }

  /**
   * Get the last window index for a session
   */
  private async getLastWindowIndex(sessionName: string): Promise<number> {
    const windows = await this.getSessionWindows(sessionName);
    return Math.max(...windows.map((w) => w.windowIndex), -1);
  }

  /**
   * Move a window to a new index
   */
  private async moveWindow(sessionName: string, from: number, to: number): Promise<void> {
    await execAsync(`tmux move-window -s ${sessionName}:${from} -t ${sessionName}:${to}`);
  }

  /**
   * Execute a shell command and return the result
   */
  async executeShellCommand(
    command: string,
    cwd?: string
  ): Promise<{ stdout: string; stderr: string }> {
    return execAsync(command, { cwd });
  }

  /**
   * Convert AgentSession to TmuxWindowConfig
   */
  agentSessionToWindowConfig(session: AgentSession, workingDirectory: string): TmuxWindowConfig {
    return {
      sessionName: session.sessionName,
      windowIndex: session.windowIndex,
      windowName: session.windowName,
      workingDirectory,
      command: 'claude', // Start Claude in the window
    };
  }
}

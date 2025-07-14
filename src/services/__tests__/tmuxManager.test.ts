import { TmuxManager } from '../tmuxManager';
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock child_process
jest.mock('child_process');
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn((_fn) => jest.fn()),
}));

describe('TmuxManager', () => {
  let tmuxManager: TmuxManager;
  let mockExecAsync: jest.Mock;

  beforeEach(() => {
    tmuxManager = new TmuxManager();
    mockExecAsync = promisify(exec) as unknown as jest.Mock;
    jest.clearAllMocks();
  });

  describe('checkTmuxAvailable', () => {
    it('should return true when tmux is available', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'tmux 3.2a', stderr: '' });

      const result = await tmuxManager.checkTmuxAvailable();

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith('tmux -V');
    });

    it('should return false when tmux is not available', async () => {
      mockExecAsync.mockRejectedValue(new Error('command not found'));

      const result = await tmuxManager.checkTmuxAvailable();

      expect(result).toBe(false);
    });
  });

  describe('session management', () => {
    it('should create a new session', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await tmuxManager.createSession('test-session', '/test/path');

      expect(mockExecAsync).toHaveBeenCalledWith(
        'tmux new-session -d -s test-session -c /test/path'
      );
    });

    it('should check if session exists', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'test-session: 1 windows\n',
        stderr: '',
      });

      const exists = await tmuxManager.sessionExists('test-session');

      expect(exists).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith('tmux list-sessions -F "#{session_name}"');
    });

    it('should return false for non-existent session', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'other-session\n', stderr: '' });

      const exists = await tmuxManager.sessionExists('test-session');

      expect(exists).toBe(false);
    });

    it('should kill a session', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await tmuxManager.killSession('test-session');

      expect(mockExecAsync).toHaveBeenCalledWith('tmux kill-session -t test-session');
    });
  });

  describe('window management', () => {
    it('should create a new window', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await tmuxManager.createWindow({
        sessionName: 'test-session',
        windowIndex: 1,
        windowName: 'test-window',
        workingDirectory: '/test/path',
        command: 'echo test',
      });

      expect(mockExecAsync).toHaveBeenCalledWith(
        'tmux new-window -t test-session:1 -n test-window -c /test/path echo test'
      );
    });

    it('should rename a window', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await tmuxManager.renameWindow('test-session', 1, 'new-name');

      expect(mockExecAsync).toHaveBeenCalledWith('tmux rename-window -t test-session:1 new-name');
    });

    it('should get session windows', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '0:window1:active\n1:window2:inactive\n',
        stderr: '',
      });

      const windows = await tmuxManager.getSessionWindows('test-session');

      expect(windows).toHaveLength(2);
      expect(windows[0]).toEqual({
        sessionName: 'test-session',
        windowIndex: 0,
        windowName: 'window1',
        isActive: true,
      });
    });
  });

  describe('content interaction', () => {
    it('should send keys to window', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await tmuxManager.sendKeys('test-session', 1, 'Hello World');

      expect(mockExecAsync).toHaveBeenCalledWith('tmux send-keys -t test-session:1 "Hello World"');
    });

    it('should escape special characters in sendKeys', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await tmuxManager.sendKeys('test-session', 1, 'echo "test"');

      expect(mockExecAsync).toHaveBeenCalledWith(
        'tmux send-keys -t test-session:1 "echo \\"test\\""'
      );
    });

    it('should capture window content', async () => {
      const mockContent = 'Line 1\nLine 2\nLine 3';
      mockExecAsync.mockResolvedValue({ stdout: mockContent, stderr: '' });

      const content = await tmuxManager.captureWindowContent('test-session', 1, 10);

      expect(content).toBe(mockContent);
      expect(mockExecAsync).toHaveBeenCalledWith('tmux capture-pane -t test-session:1 -p -S -10');
    });

    it('should send Claude message with proper timing', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const sendPromise = tmuxManager.sendClaudeMessage('test-session', 1, 'Test message');

      // Fast-forward timers
      jest.advanceTimersByTime(500);

      await sendPromise;

      // Should call sendKeys twice (message + Enter)
      expect(mockExecAsync).toHaveBeenCalledTimes(2);
      expect(mockExecAsync).toHaveBeenNthCalledWith(
        1,
        'tmux send-keys -t test-session:1 "Test message"'
      );
      expect(mockExecAsync).toHaveBeenNthCalledWith(2, 'tmux send-keys -t test-session:1 Enter');
    });
  });

  describe('utility methods', () => {
    it('should execute shell command', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'output', stderr: '' });

      const result = await tmuxManager.executeShellCommand('ls -la');

      expect(result).toBe('output');
      expect(mockExecAsync).toHaveBeenCalledWith('ls -la');
    });

    it('should get active window', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '0:window1:inactive\n1:window2:active\n',
        stderr: '',
      });

      const activeWindow = await tmuxManager.getActiveWindow('test-session');

      expect(activeWindow).toEqual({
        sessionName: 'test-session',
        windowIndex: 1,
        windowName: 'window2',
        isActive: true,
      });
    });

    it('should wait for window with timeout', async () => {
      let callCount = 0;
      mockExecAsync.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ stdout: '', stderr: '' });
        }
        return Promise.resolve({
          stdout: '0:window1:inactive\n1:target-window:active\n',
          stderr: '',
        });
      });

      const found = await tmuxManager.waitForWindow('test-session', 'target-window', 5000);

      expect(found).toBe(true);
    });

    it('should timeout waiting for window', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const found = await tmuxManager.waitForWindow('test-session', 'missing-window', 100);

      expect(found).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle tmux errors gracefully', async () => {
      mockExecAsync.mockRejectedValue(new Error('no server running'));

      await expect(tmuxManager.createSession('test', '/path')).rejects.toThrow('no server running');
    });

    it('should handle empty window list', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const windows = await tmuxManager.getSessionWindows('test-session');

      expect(windows).toEqual([]);
    });
  });
});

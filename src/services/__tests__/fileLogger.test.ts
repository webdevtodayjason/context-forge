import fs from 'fs-extra';
import path from 'path';
import { FileLogger } from '../fileLogger';

// Mock chalk to avoid Jest import issues
jest.mock('chalk', () => ({
  green: jest.fn((str) => str),
  blue: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
}));

describe('FileLogger', () => {
  let tempDir: string;
  let logger: FileLogger;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp/test-'));
    logger = new FileLogger(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('logOperation', () => {
    it('should log a file creation operation', () => {
      const filePath = path.join(tempDir, 'test.md');

      logger.logOperation({
        type: 'created',
        filePath,
        description: 'Test file',
      });

      const operations = logger.getOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        type: 'created',
        filePath,
        description: 'Test file',
        relativePath: 'test.md',
      });
      expect(operations[0].timestamp).toBeInstanceOf(Date);
    });

    it('should log different operation types', () => {
      const filePath = path.join(tempDir, 'test.md');

      logger.logOperation({
        type: 'updated',
        filePath,
        description: 'Updated file',
      });

      logger.logOperation({
        type: 'skipped',
        filePath,
        description: 'Skipped file',
      });

      logger.logOperation({
        type: 'failed',
        filePath,
        description: 'Failed file',
        error: 'Test error',
      });

      const operations = logger.getOperations();
      expect(operations).toHaveLength(3);
      expect(operations[0].type).toBe('updated');
      expect(operations[1].type).toBe('skipped');
      expect(operations[2].type).toBe('failed');
      expect(operations[2].error).toBe('Test error');
    });

    it('should handle nested paths correctly', () => {
      const filePath = path.join(tempDir, '.claude', 'commands', 'git', 'smart-commit.md');

      logger.logOperation({
        type: 'created',
        filePath,
        description: 'Git command',
      });

      const operations = logger.getOperations();
      expect(operations[0].relativePath).toBe('.claude/commands/git/smart-commit.md');
    });
  });

  describe('getSummaryStats', () => {
    it('should return correct statistics', () => {
      const filePath = path.join(tempDir, 'test.md');

      logger.logOperation({ type: 'created', filePath, description: 'Test 1' });
      logger.logOperation({ type: 'created', filePath, description: 'Test 2' });
      logger.logOperation({ type: 'updated', filePath, description: 'Test 3' });
      logger.logOperation({ type: 'skipped', filePath, description: 'Test 4' });
      logger.logOperation({ type: 'failed', filePath, description: 'Test 5', error: 'Error' });

      const stats = logger.getSummaryStats();
      expect(stats).toEqual({
        total: 5,
        created: 2,
        updated: 1,
        skipped: 1,
        failed: 1,
      });
    });
  });

  describe('writeLogFile', () => {
    it('should write a comprehensive log file', async () => {
      const filePath = path.join(tempDir, 'test.md');

      logger.logOperation({
        type: 'created',
        filePath,
        description: 'Test file',
      });

      await logger.writeLogFile();

      const logPath = path.join(tempDir, 'context-forge.log');
      expect(await fs.pathExists(logPath)).toBe(true);

      const logContent = await fs.readFile(logPath, 'utf-8');
      expect(logContent).toContain('# Context Forge Generation Log');
      expect(logContent).toContain('## Summary');
      expect(logContent).toContain('## File Operations');
      expect(logContent).toContain('CREATED: test.md');
      expect(logContent).toContain('**Full Path**: ' + filePath);
      expect(logContent).toContain('**Description**: Test file');
    });
  });
});

import { ProgressTracker } from '../progressTracker';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;
  let tempDir: string;
  let progressFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'progress-test-'));
    progressFile = path.join(tempDir, '.context-forge', 'progress.json');

    // Mock process.cwd to return our temp directory
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    tracker = new ProgressTracker();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    jest.restoreAllMocks();
  });

  describe('startOperation', () => {
    it('should create new operation with unique ID', async () => {
      const operationId = await tracker.startOperation('init', 'Project initialization');

      expect(operationId).toBeDefined();
      expect(operationId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    it('should save operation to progress file', async () => {
      const operationId = await tracker.startOperation('init', 'Test operation');

      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries).toHaveLength(1);
      expect(progressData.entries[0]).toMatchObject({
        id: operationId,
        command: 'init',
        operation: 'Test operation',
        status: 'in_progress',
      });
    });

    it('should include metadata when provided', async () => {
      const metadata = { aiEnabled: true, targetIDEs: ['claude'] };
      const operationId = await tracker.startOperation('enhance', 'Feature planning', metadata);

      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries[0].metadata).toEqual(metadata);
    });
  });

  describe('addStep', () => {
    it('should add step to current operation', async () => {
      const operationId = await tracker.startOperation('migrate', 'Migration planning');
      await tracker.addStep('Analyzing source framework');

      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries[0].steps).toHaveLength(1);
      expect(progressData.entries[0].steps[0]).toMatchObject({
        description: 'Analyzing source framework',
        status: 'completed',
      });
    });

    it('should handle steps when no current operation exists', async () => {
      await expect(tracker.addStep('Should fail')).rejects.toThrow();
    });
  });

  describe('completeOperation', () => {
    it('should mark operation as completed with success', async () => {
      const operationId = await tracker.startOperation('analyze', 'Project analysis');
      await tracker.completeOperation(true, { filesGenerated: 5 });

      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries[0]).toMatchObject({
        status: 'completed',
        success: true,
        result: { filesGenerated: 5 },
      });
      expect(progressData.entries[0].endTime).toBeDefined();
    });

    it('should mark operation as failed with error details', async () => {
      const operationId = await tracker.startOperation('init', 'Setup');
      await tracker.completeOperation(false, undefined, 'Permission denied');

      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries[0]).toMatchObject({
        status: 'failed',
        success: false,
        error: 'Permission denied',
      });
    });
  });

  describe('getProgress', () => {
    it('should return current operation when active', async () => {
      const operationId = await tracker.startOperation('dashboard', 'Monitoring');
      const progress = await tracker.getProgress();

      expect(progress.currentOperation).toMatchObject({
        id: operationId,
        status: 'in_progress',
      });
    });

    it('should return summary statistics', async () => {
      // Create completed operation
      await tracker.startOperation('init', 'Test 1');
      await tracker.completeOperation(true);

      // Create failed operation
      await tracker.startOperation('migrate', 'Test 2');
      await tracker.completeOperation(false);

      const progress = await tracker.getProgress();
      expect(progress.summary).toMatchObject({
        totalOperations: 2,
        completedOperations: 1,
        failedOperations: 1,
        successRate: 50,
      });
    });

    it('should return recent activity within 7 days', async () => {
      await tracker.startOperation('enhance', 'Recent test');
      await tracker.completeOperation(true);

      const progress = await tracker.getProgress();
      expect(progress.recentActivity).toHaveLength(1);
    });
  });

  describe('clearOldOperations', () => {
    it('should remove operations older than specified days', async () => {
      // Create old operation by manually setting date
      await tracker.startOperation('old', 'Old operation');
      const progressData = await fs.readJson(progressFile);

      // Modify the date to be 31 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      progressData.entries[0].startTime = oldDate.toISOString();
      await fs.writeJson(progressFile, progressData);

      // Clear operations older than 30 days
      const removedCount = await tracker.clearOldOperations(30);

      expect(removedCount).toBe(1);
      const newProgressData = await fs.readJson(progressFile);
      expect(newProgressData.entries).toHaveLength(0);
    });

    it('should preserve in-progress operations regardless of age', async () => {
      const operationId = await tracker.startOperation('ongoing', 'Long running');

      // Clear operations older than 0 days (should remove everything except in-progress)
      const removedCount = await tracker.clearOldOperations(0);

      expect(removedCount).toBe(0);
      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries).toHaveLength(1);
      expect(progressData.entries[0].status).toBe('in_progress');
    });
  });

  describe('error handling', () => {
    it('should handle missing progress directory gracefully', async () => {
      const nonExistentDir = path.join(tmpdir(), 'non-existent');
      jest.spyOn(process, 'cwd').mockReturnValue(nonExistentDir);

      const newTracker = new ProgressTracker();
      const operationId = await newTracker.startOperation('test', 'Test operation');

      expect(operationId).toBeDefined();
      expect(await fs.pathExists(path.join(nonExistentDir, '.context-forge'))).toBe(true);
    });

    it('should handle corrupted progress file', async () => {
      // Create corrupted JSON file
      await fs.ensureDir(path.dirname(progressFile));
      await fs.writeFile(progressFile, '{ invalid json');

      const operationId = await tracker.startOperation('recovery', 'Recovery test');

      expect(operationId).toBeDefined();
      const progressData = await fs.readJson(progressFile);
      expect(progressData.entries).toHaveLength(1);
    });
  });

  describe('performance', () => {
    it('should handle large number of operations efficiently', async () => {
      const start = Date.now();

      // Create 100 operations
      for (let i = 0; i < 100; i++) {
        await tracker.startOperation('test', `Operation ${i}`);
        await tracker.completeOperation(true);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

      const progress = await tracker.getProgress();
      expect(progress.summary.totalOperations).toBe(100);
    });
  });
});

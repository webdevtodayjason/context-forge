import fs from 'fs-extra';
import path from 'path';

export interface ProgressEntry {
  id: string;
  command: string;
  operation: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  projectPath: string;
  metadata?: {
    filesGenerated?: number;
    aiEnabled?: boolean;
    targetIDEs?: string[];
    errors?: string[];
    warnings?: string[];
    features?: string[];
    phases?: number;
  };
  steps?: ProgressStep[];
}

export interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ProgressSummary {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  inProgressOperations: number;
  recentActivity: ProgressEntry[];
  averageDuration: number;
  successRate: number;
}

export class ProgressTracker {
  private progressFile: string;
  private currentEntry: ProgressEntry | null = null;

  constructor(projectPath: string = process.cwd()) {
    this.progressFile = path.join(projectPath, '.context-forge', 'progress.json');
  }

  async startOperation(
    command: string,
    operation: string,
    metadata?: ProgressEntry['metadata']
  ): Promise<string> {
    const id = this.generateId();

    this.currentEntry = {
      id,
      command,
      operation,
      status: 'in_progress',
      startTime: new Date(),
      projectPath: process.cwd(),
      metadata: metadata || {},
      steps: [],
    };

    await this.saveProgress();
    return id;
  }

  async updateOperation(id: string, updates: Partial<ProgressEntry>): Promise<void> {
    if (this.currentEntry && this.currentEntry.id === id) {
      Object.assign(this.currentEntry, updates);
      await this.saveProgress();
    } else {
      // Update stored entry
      const progress = await this.loadProgress();
      const entry = progress.find((p) => p.id === id);
      if (entry) {
        Object.assign(entry, updates);
        await this.saveToFile(progress);
      }
    }
  }

  async completeOperation(
    id: string,
    status: 'completed' | 'failed' | 'cancelled' = 'completed',
    metadata?: Partial<ProgressEntry['metadata']>
  ): Promise<void> {
    if (this.currentEntry && this.currentEntry.id === id) {
      this.currentEntry.status = status;
      this.currentEntry.endTime = new Date();
      this.currentEntry.duration =
        this.currentEntry.endTime.getTime() - this.currentEntry.startTime.getTime();

      if (metadata) {
        this.currentEntry.metadata = { ...this.currentEntry.metadata, ...metadata };
      }

      await this.saveProgress();
      this.currentEntry = null;
    }
  }

  async addStep(operationId: string, stepName: string, description?: string): Promise<string> {
    const stepId = this.generateId();
    const step: ProgressStep = {
      id: stepId,
      name: stepName,
      status: 'in_progress',
      startTime: new Date(),
      description,
    };

    if (this.currentEntry && this.currentEntry.id === operationId) {
      this.currentEntry.steps!.push(step);
      await this.saveProgress();
    }

    return stepId;
  }

  async completeStep(
    operationId: string,
    stepId: string,
    status: 'completed' | 'failed' = 'completed',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (this.currentEntry && this.currentEntry.id === operationId) {
      const step = this.currentEntry.steps!.find((s) => s.id === stepId);
      if (step) {
        step.status = status;
        step.endTime = new Date();
        step.metadata = metadata;
        await this.saveProgress();
      }
    }
  }

  async getProgress(): Promise<ProgressEntry[]> {
    return await this.loadProgress();
  }

  async getProgressSummary(): Promise<ProgressSummary> {
    const progress = await this.loadProgress();
    const now = new Date();
    const recentActivity = progress
      .filter((p) => {
        const daysSinceStart = (now.getTime() - p.startTime.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceStart <= 7; // Last 7 days
      })
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    const totalOperations = progress.length;
    const completedOperations = progress.filter((p) => p.status === 'completed').length;
    const failedOperations = progress.filter((p) => p.status === 'failed').length;
    const inProgressOperations = progress.filter((p) => p.status === 'in_progress').length;

    const completedWithDuration = progress.filter((p) => p.status === 'completed' && p.duration);
    const averageDuration =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, p) => sum + (p.duration || 0), 0) /
          completedWithDuration.length
        : 0;

    const successRate = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0;

    return {
      totalOperations,
      completedOperations,
      failedOperations,
      inProgressOperations,
      recentActivity,
      averageDuration,
      successRate,
    };
  }

  async getCurrentOperation(): Promise<ProgressEntry | null> {
    if (this.currentEntry) {
      return this.currentEntry;
    }

    const progress = await this.loadProgress();
    return progress.find((p) => p.status === 'in_progress') || null;
  }

  async clearHistory(olderThanDays: number = 30): Promise<number> {
    const progress = await this.loadProgress();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const filtered = progress.filter((p) => {
      return p.startTime >= cutoffDate || p.status === 'in_progress';
    });

    const removedCount = progress.length - filtered.length;

    if (removedCount > 0) {
      await this.saveToFile(filtered);
    }

    return removedCount;
  }

  private async loadProgress(): Promise<ProgressEntry[]> {
    try {
      if (await fs.pathExists(this.progressFile)) {
        const data = await fs.readJson(this.progressFile);
        return Array.isArray(data) ? data.map(this.deserializeEntry) : [];
      }
    } catch (error) {
      console.warn('Failed to load progress file:', error);
    }
    return [];
  }

  private async saveProgress(): Promise<void> {
    if (!this.currentEntry) return;

    const progress = await this.loadProgress();
    const existingIndex = progress.findIndex((p) => p.id === this.currentEntry!.id);

    if (existingIndex >= 0) {
      progress[existingIndex] = this.currentEntry;
    } else {
      progress.push(this.currentEntry);
    }

    await this.saveToFile(progress);
  }

  private async saveToFile(progress: ProgressEntry[]): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.progressFile));
      await fs.writeJson(this.progressFile, progress, { spaces: 2 });
    } catch (error) {
      console.warn('Failed to save progress file:', error);
    }
  }

  private deserializeEntry(data: Record<string, unknown>): ProgressEntry {
    return {
      id: data.id as string,
      command: data.command as string,
      operation: data.operation as string,
      status: data.status as ProgressEntry['status'],
      projectPath: data.projectPath as string,
      startTime: new Date(data.startTime as string),
      endTime: data.endTime ? new Date(data.endTime as string) : undefined,
      duration: data.duration as number | undefined,
      metadata: data.metadata as ProgressEntry['metadata'],
      steps:
        (data.steps as Record<string, unknown>[])?.map((step: Record<string, unknown>) => ({
          id: step.id as string,
          name: step.name as string,
          status: step.status as ProgressStep['status'],
          startTime: step.startTime ? new Date(step.startTime as string) : undefined,
          endTime: step.endTime ? new Date(step.endTime as string) : undefined,
          description: step.description as string | undefined,
          metadata: step.metadata as Record<string, unknown> | undefined,
        })) || [],
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Utility methods for displaying progress
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    if (milliseconds < 3600000) return `${(milliseconds / 60000).toFixed(1)}m`;
    return `${(milliseconds / 3600000).toFixed(1)}h`;
  }

  getStatusIcon(status: ProgressEntry['status']): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'in_progress':
        return '🔄';
      case 'cancelled':
        return '⚠️';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  }

  getStatusColor(status: ProgressEntry['status']): string {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'in_progress':
        return 'yellow';
      case 'cancelled':
        return 'orange';
      case 'pending':
        return 'gray';
      default:
        return 'white';
    }
  }
}

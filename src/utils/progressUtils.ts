import { ProgressTracker } from '../services/progressTracker';

export interface CommandExecutionOptions {
  command: string;
  operation: string;
  metadata?: Record<string, unknown>;
  onError?: (error: Error, operationId: string) => Promise<void>;
}

export async function executeWithProgress<T>(
  fn: (progressTracker: ProgressTracker, operationId: string) => Promise<T>,
  options: CommandExecutionOptions
): Promise<T> {
  const progressTracker = new ProgressTracker();
  let operationId: string;

  try {
    // Start progress tracking
    operationId = await progressTracker.startOperation(
      options.command,
      options.operation,
      options.metadata
    );

    // Execute the function
    const result = await fn(progressTracker, operationId);

    // Mark as completed
    await progressTracker.completeOperation(operationId, 'completed');

    return result;
  } catch (error) {
    // Mark as failed
    if (operationId!) {
      await progressTracker.completeOperation(operationId, 'failed', {
        errors: [(error as Error).message],
      });
    }

    // Call custom error handler if provided
    if (options.onError && operationId!) {
      await options.onError(error as Error, operationId);
    }

    throw error;
  }
}

export interface ProgressStep {
  name: string;
  description?: string;
}

export class ProgressStepTracker {
  private progressTracker: ProgressTracker;
  private operationId: string;
  private currentStepId?: string;

  constructor(progressTracker: ProgressTracker, operationId: string) {
    this.progressTracker = progressTracker;
    this.operationId = operationId;
  }

  async startStep(name: string, description?: string): Promise<void> {
    if (this.currentStepId) {
      await this.completeCurrentStep();
    }

    this.currentStepId = await this.progressTracker.addStep(this.operationId, name, description);
  }

  async completeCurrentStep(
    status: 'completed' | 'failed' = 'completed',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.currentStepId) {
      await this.progressTracker.completeStep(
        this.operationId,
        this.currentStepId,
        status,
        metadata
      );
      this.currentStepId = undefined;
    }
  }

  async failCurrentStep(metadata?: Record<string, any>): Promise<void> {
    await this.completeCurrentStep('failed', metadata);
  }
}

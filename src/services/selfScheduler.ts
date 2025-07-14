import { EventEmitter } from 'events';
import { SelfSchedulingConfig, AgentSession } from '../types/orchestration';
import { TmuxManager } from './tmuxManager';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleEntry {
  id: string;
  agentId: string;
  sessionName: string;
  windowIndex: number;
  scheduledTime: Date;
  interval: number; // minutes
  note: string;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  processId?: number;
}

export interface SchedulerStats {
  totalScheduled: number;
  executed: number;
  failed: number;
  cancelled: number;
  averageInterval: number;
  adaptiveAdjustments: number;
}

export class SelfSchedulingService extends EventEmitter {
  private schedules: Map<string, ScheduleEntry> = new Map();
  private tmux: TmuxManager;
  private config: SelfSchedulingConfig;
  private stats: SchedulerStats = {
    totalScheduled: 0,
    executed: 0,
    failed: 0,
    cancelled: 0,
    averageInterval: 0,
    adaptiveAdjustments: 0,
  };
  private workloadMetrics: Map<string, number> = new Map(); // agentId -> workload score

  constructor(config: SelfSchedulingConfig, tmux: TmuxManager) {
    super();
    this.config = config;
    this.tmux = tmux;
  }

  /**
   * Schedule next check-in for an agent
   */
  async scheduleAgentCheckIn(
    agentSession: AgentSession,
    interval?: number,
    note?: string
  ): Promise<ScheduleEntry> {
    // Determine interval
    let checkInterval = interval || this.config.defaultCheckInterval;

    // Apply adaptive scheduling if enabled
    if (this.config.adaptiveScheduling) {
      checkInterval = this.calculateAdaptiveInterval(agentSession.agentId);
    }

    // Ensure within bounds
    checkInterval = Math.max(
      this.config.minCheckInterval,
      Math.min(this.config.maxCheckInterval, checkInterval)
    );

    const scheduleEntry: ScheduleEntry = {
      id: uuidv4(),
      agentId: agentSession.agentId,
      sessionName: agentSession.sessionName,
      windowIndex: agentSession.windowIndex,
      scheduledTime: new Date(Date.now() + checkInterval * 60 * 1000),
      interval: checkInterval,
      note: note || `Regular check-in for ${agentSession.agentId}`,
      status: 'pending',
    };

    // Execute scheduling command
    const processId = await this.executeSchedule(scheduleEntry);
    if (processId) {
      scheduleEntry.processId = processId;
    }

    // Track schedule
    this.schedules.set(agentSession.agentId, scheduleEntry);
    this.stats.totalScheduled++;
    this.updateAverageInterval();

    // Emit event
    this.emit('scheduled', scheduleEntry);

    return scheduleEntry;
  }

  /**
   * Calculate adaptive interval based on agent workload
   */
  private calculateAdaptiveInterval(agentId: string): number {
    const workload = this.workloadMetrics.get(agentId) || 50; // 0-100 scale

    // High workload = shorter intervals, low workload = longer intervals
    const range = this.config.maxCheckInterval - this.config.minCheckInterval;
    const adaptedInterval = this.config.maxCheckInterval - (workload / 100) * range;

    this.stats.adaptiveAdjustments++;

    console.log(
      chalk.gray(
        `Adaptive scheduling for ${agentId}: workload=${workload}, interval=${Math.round(adaptedInterval)}min`
      )
    );

    return Math.round(adaptedInterval);
  }

  /**
   * Update agent workload metrics
   */
  updateWorkloadMetrics(
    agentId: string,
    metrics: {
      tasksCompleted: number;
      tasksPending: number;
      blockers: number;
      messagesReceived: number;
    }
  ): void {
    // Calculate workload score (0-100)
    const workload = Math.min(
      100,
      metrics.tasksPending * 10 +
        metrics.blockers * 20 +
        metrics.messagesReceived * 2 -
        metrics.tasksCompleted * 5
    );

    this.workloadMetrics.set(agentId, Math.max(0, workload));
  }

  /**
   * Execute schedule using scheduling script
   */
  private async executeSchedule(schedule: ScheduleEntry): Promise<number | undefined> {
    try {
      // Create schedule command
      const scheduleScript =
        this.config.scheduleScript ||
        path.join(process.cwd(), '.claude', 'orchestration', 'schedule.sh');

      if (!(await fs.pathExists(scheduleScript))) {
        throw new Error(`Schedule script not found: ${scheduleScript}`);
      }

      // Build command
      const target = `${schedule.sessionName}:${schedule.windowIndex}`;
      const command = `${scheduleScript} ${schedule.interval} "${schedule.note}" "${target}"`;

      // Execute in background
      const { stdout } = await this.tmux.executeShellCommand(command);

      // Extract PID from output if available
      const pidMatch = stdout.match(/PID:\s*(\d+)/);
      const pid = pidMatch ? parseInt(pidMatch[1]) : undefined;

      console.log(
        chalk.green(`✓ Scheduled check-in for ${schedule.agentId} in ${schedule.interval} minutes`)
      );

      return pid;
    } catch (error) {
      console.error(chalk.red(`Failed to schedule: ${error}`));
      schedule.status = 'failed';
      this.stats.failed++;
      this.emit('schedule-failed', { schedule, error });
      return undefined;
    }
  }

  /**
   * Cancel a scheduled check-in
   */
  async cancelSchedule(agentId: string): Promise<boolean> {
    const schedule = this.schedules.get(agentId);
    if (!schedule || schedule.status !== 'pending') {
      return false;
    }

    try {
      // Kill the scheduled process if we have PID
      if (schedule.processId) {
        await this.tmux.executeShellCommand(`kill ${schedule.processId}`);
      }

      schedule.status = 'cancelled';
      this.stats.cancelled++;
      this.emit('cancelled', schedule);

      return true;
    } catch (error) {
      console.error(chalk.red(`Failed to cancel schedule: ${error}`));
      return false;
    }
  }

  /**
   * Reschedule an agent with new interval
   */
  async reschedule(
    agentSession: AgentSession,
    newInterval: number,
    note?: string
  ): Promise<ScheduleEntry> {
    // Cancel existing schedule
    await this.cancelSchedule(agentSession.agentId);

    // Create new schedule
    return this.scheduleAgentCheckIn(agentSession, newInterval, note);
  }

  /**
   * Handle schedule execution (called when schedule fires)
   */
  async handleScheduleExecution(agentId: string): Promise<void> {
    const schedule = this.schedules.get(agentId);
    if (!schedule) {
      return;
    }

    schedule.status = 'executed';
    this.stats.executed++;

    // Emit event for orchestrator to handle
    this.emit('check-in', {
      agentId,
      scheduledTime: schedule.scheduledTime,
      actualTime: new Date(),
      note: schedule.note,
    });

    // Log execution
    console.log(
      chalk.blue(
        `Agent ${agentId} check-in executed (scheduled: ${schedule.scheduledTime.toISOString()})`
      )
    );
  }

  /**
   * Get schedule for agent
   */
  getAgentSchedule(agentId: string): ScheduleEntry | undefined {
    return this.schedules.get(agentId);
  }

  /**
   * Get all active schedules
   */
  getActiveSchedules(): ScheduleEntry[] {
    return Array.from(this.schedules.values()).filter((s) => s.status === 'pending');
  }

  /**
   * Update average interval statistic
   */
  private updateAverageInterval(): void {
    const intervals = Array.from(this.schedules.values()).map((s) => s.interval);

    if (intervals.length > 0) {
      this.stats.averageInterval =
        intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Cancel all active schedules
   */
  async cancelAllSchedules(): Promise<void> {
    const activeSchedules = this.getActiveSchedules();
    for (const schedule of activeSchedules) {
      await this.cancelSchedule(schedule.agentId);
    }
    console.log(chalk.yellow(`Cancelled all ${activeSchedules.length} active schedules`));
  }

  /**
   * Create recovery schedule for crashed agent
   */
  async createRecoverySchedule(agentSession: AgentSession, error: Error): Promise<void> {
    const recoveryStrategy = this.config.recoveryStrategy;

    console.log(
      chalk.yellow(
        `Creating recovery schedule for ${agentSession.agentId} (strategy: ${recoveryStrategy})`
      )
    );

    switch (recoveryStrategy) {
      case 'restart':
        // Schedule immediate restart
        await this.scheduleAgentCheckIn(
          agentSession,
          1, // 1 minute
          `Recovery restart after error: ${error.message}`
        );
        break;

      case 'resume':
        // Schedule with shorter interval
        await this.scheduleAgentCheckIn(
          agentSession,
          Math.min(5, this.config.minCheckInterval),
          `Resume after error: ${error.message}`
        );
        break;

      case 'escalate':
        // Don't reschedule, escalate to orchestrator
        this.emit('escalate-recovery', {
          agentSession,
          error,
          message: 'Agent requires manual intervention',
        });
        break;
    }
  }

  /**
   * Generate scheduling script content
   */
  generateSchedulingScript(): string {
    return `#!/bin/bash
# Self-scheduling script for orchestration agents

MINUTES=\${1:-${this.config.defaultCheckInterval}}
NOTE=\${2:-"Regular orchestration check"}
TARGET=\${3:-"cf-orchestrator:0"}

# Validate interval
if [ \$MINUTES -lt ${this.config.minCheckInterval} ]; then
  MINUTES=${this.config.minCheckInterval}
elif [ \$MINUTES -gt ${this.config.maxCheckInterval} ]; then
  MINUTES=${this.config.maxCheckInterval}
fi

# Create note file
ORCHESTRATION_DIR=".claude/orchestration"
mkdir -p "\$ORCHESTRATION_DIR"
echo "=== Next Check Note ($(date)) ===" > "\$ORCHESTRATION_DIR/next_check.txt"
echo "Scheduled for: \$MINUTES minutes" >> "\$ORCHESTRATION_DIR/next_check.txt"
echo "" >> "\$ORCHESTRATION_DIR/next_check.txt"
echo "\$NOTE" >> "\$ORCHESTRATION_DIR/next_check.txt"

# Calculate seconds
SECONDS=\$(( \$MINUTES * 60 ))

# Schedule the check using nohup for background execution
nohup bash -c "sleep \$SECONDS && tmux send-keys -t \$TARGET 'Time for orchestration check! cat \$ORCHESTRATION_DIR/next_check.txt' && sleep 1 && tmux send-keys -t \$TARGET Enter" > /dev/null 2>&1 &

# Get the PID
SCHEDULE_PID=$!

# Log the schedule
echo "Scheduled check in \$MINUTES minutes (PID: \$SCHEDULE_PID)"
echo "Target: \$TARGET"
echo "Note: \$NOTE"

# Save PID for potential cancellation
echo "\$SCHEDULE_PID" > "\$ORCHESTRATION_DIR/schedule_\${TARGET//:/}_pid.txt"
`;
  }
}

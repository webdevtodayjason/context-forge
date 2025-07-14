import { EventEmitter } from 'events';
import { AgentMessage, AgentSession, CommunicationModel, AgentRole } from '../types/orchestration';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

export interface MessageHandler {
  (message: AgentMessage): Promise<void>;
}

export interface CommunicationStats {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesByAgent: Record<string, number>;
  averageResponseTime: number;
  blockedMessages: number;
  escalations: number;
}

export class AgentCommunicationService extends EventEmitter {
  private messages: AgentMessage[] = [];
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private responseTimeTracker: Map<string, number> = new Map();
  private stats: CommunicationStats = {
    totalMessages: 0,
    messagesByType: {},
    messagesByAgent: {},
    averageResponseTime: 0,
    blockedMessages: 0,
    escalations: 0,
  };
  private communicationModel: CommunicationModel;
  private agentHierarchy: Map<string, string> = new Map(); // agentId -> supervisorId

  constructor(communicationModel: CommunicationModel = 'hub-and-spoke') {
    super();
    this.communicationModel = communicationModel;
  }

  /**
   * Set the communication model
   */
  setCommunicationModel(model: CommunicationModel): void {
    this.communicationModel = model;
    console.log(chalk.blue(`Communication model set to: ${model}`));
  }

  /**
   * Register agent hierarchy
   */
  registerAgentHierarchy(agentId: string, supervisorId?: string): void {
    if (supervisorId) {
      this.agentHierarchy.set(agentId, supervisorId);
    }
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribe(agentId: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(agentId)) {
      this.messageHandlers.set(agentId, []);
    }
    this.messageHandlers.get(agentId)!.push(handler);
  }

  /**
   * Send a message between agents
   */
  async sendMessage(
    fromAgent: string,
    toAgent: string,
    type: AgentMessage['type'],
    content: string,
    metadata?: Record<string, any>,
    requiresResponse: boolean = false
  ): Promise<AgentMessage> {
    // Validate communication path
    if (!this.isValidCommunicationPath(fromAgent, toAgent)) {
      this.stats.blockedMessages++;
      throw new Error(
        `Communication blocked: ${fromAgent} cannot directly communicate with ${toAgent} in ${this.communicationModel} model`
      );
    }

    const message: AgentMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      fromAgent,
      toAgent,
      type,
      content,
      metadata,
      requiresResponse,
      parentMessageId: undefined,
    };

    // Track message
    this.messages.push(message);
    this.updateStats(message);

    // Emit event for monitoring
    this.emit('message', message);

    // Handle escalations
    if (type === 'escalation') {
      this.stats.escalations++;
      this.emit('escalation', message);
    }

    // Track response time if needed
    if (requiresResponse) {
      this.responseTimeTracker.set(message.id, Date.now());
    }

    // Deliver message
    await this.deliverMessage(message);

    return message;
  }

  /**
   * Validate communication path based on model
   */
  private isValidCommunicationPath(fromAgent: string, toAgent: string): boolean {
    if (this.communicationModel === 'mesh') {
      // Anyone can talk to anyone
      return true;
    }

    if (this.communicationModel === 'hub-and-spoke') {
      // Only through supervisors
      const fromSupervisor = this.agentHierarchy.get(fromAgent);
      const toSupervisor = this.agentHierarchy.get(toAgent);

      // Direct communication allowed if:
      // 1. One is the supervisor of the other
      // 2. Both have same supervisor (peers)
      // 3. One is orchestrator (can talk to anyone)
      return (
        fromAgent === toSupervisor ||
        toAgent === fromSupervisor ||
        (fromSupervisor === toSupervisor && fromSupervisor !== undefined) ||
        this.isOrchestrator(fromAgent) ||
        this.isOrchestrator(toAgent)
      );
    }

    if (this.communicationModel === 'hierarchical') {
      // Can only communicate up/down the hierarchy
      const fromSupervisor = this.agentHierarchy.get(fromAgent);
      const toSupervisor = this.agentHierarchy.get(toAgent);

      return (
        fromAgent === toSupervisor || toAgent === fromSupervisor || this.isOrchestrator(fromAgent)
      );
    }

    return false;
  }

  /**
   * Check if agent is orchestrator (has no supervisor)
   */
  private isOrchestrator(agentId: string): boolean {
    return !this.agentHierarchy.has(agentId);
  }

  /**
   * Deliver message to recipient
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    const handlers = this.messageHandlers.get(message.toAgent) || [];

    if (handlers.length === 0) {
      console.log(chalk.yellow(`No handlers for agent ${message.toAgent}, message queued`));
      return;
    }

    // Deliver to all handlers
    await Promise.all(handlers.map((handler) => handler(message)));
  }

  /**
   * Send a response to a message
   */
  async sendResponse(
    originalMessageId: string,
    fromAgent: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Find original message
    const originalMessage = this.messages.find((m) => m.id === originalMessageId);
    if (!originalMessage) {
      throw new Error(`Original message ${originalMessageId} not found`);
    }

    // Track response time
    const requestTime = this.responseTimeTracker.get(originalMessageId);
    if (requestTime) {
      const responseTime = Date.now() - requestTime;
      this.updateAverageResponseTime(responseTime);
      this.responseTimeTracker.delete(originalMessageId);
    }

    // Send response
    await this.sendMessage(fromAgent, originalMessage.fromAgent, 'status', content, {
      ...metadata,
      inResponseTo: originalMessageId,
    });
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(
    fromAgent: string,
    toAgents: string[],
    type: AgentMessage['type'],
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const validRecipients = toAgents.filter((agent) =>
      this.isValidCommunicationPath(fromAgent, agent)
    );

    if (validRecipients.length < toAgents.length) {
      console.log(
        chalk.yellow(
          `Broadcast restricted: ${toAgents.length - validRecipients.length} agents filtered by communication model`
        )
      );
    }

    await Promise.all(
      validRecipients.map((agent) => this.sendMessage(fromAgent, agent, type, content, metadata))
    );
  }

  /**
   * Get pending messages for an agent
   */
  getPendingMessages(agentId: string): AgentMessage[] {
    return this.messages.filter(
      (m) => m.toAgent === agentId && m.requiresResponse && !this.hasResponse(m.id)
    );
  }

  /**
   * Check if message has response
   */
  private hasResponse(messageId: string): boolean {
    return this.messages.some((m) => m.metadata?.inResponseTo === messageId);
  }

  /**
   * Update statistics
   */
  private updateStats(message: AgentMessage): void {
    this.stats.totalMessages++;

    // By type
    this.stats.messagesByType[message.type] = (this.stats.messagesByType[message.type] || 0) + 1;

    // By agent
    this.stats.messagesByAgent[message.fromAgent] =
      (this.stats.messagesByAgent[message.fromAgent] || 0) + 1;
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const currentAvg = this.stats.averageResponseTime;
    const totalResponses = Object.values(this.stats.messagesByType).reduce(
      (sum, count) => sum + count,
      0
    );

    this.stats.averageResponseTime =
      (currentAvg * (totalResponses - 1) + responseTime) / totalResponses;
  }

  /**
   * Get communication statistics
   */
  getStats(): CommunicationStats {
    return { ...this.stats };
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number = 10): AgentMessage[] {
    return this.messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get message history
   */
  getMessageHistory(limit?: number): AgentMessage[] {
    const messages = [...this.messages].reverse();
    return limit ? messages.slice(0, limit) : messages;
  }

  /**
   * Get conversation between two agents
   */
  getConversation(agent1: string, agent2: string): AgentMessage[] {
    return this.messages
      .filter(
        (m) =>
          (m.fromAgent === agent1 && m.toAgent === agent2) ||
          (m.fromAgent === agent2 && m.toAgent === agent1)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear old messages
   */
  clearOldMessages(olderThan: Date): number {
    const before = this.messages.length;
    this.messages = this.messages.filter((m) => m.timestamp > olderThan);
    return before - this.messages.length;
  }

  /**
   * Create standard message templates
   */
  createStatusUpdate(
    fromAgent: string,
    completed: string[],
    current: string,
    blocked?: string,
    eta?: string
  ): string {
    return `STATUS UPDATE
Completed: 
${completed.map((task) => `- ${task}`).join('\n')}
Current: ${current}
Blocked: ${blocked || 'None'}
ETA: ${eta || 'Unknown'}`;
  }

  createTaskAssignment(
    taskId: string,
    taskName: string,
    description: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    criteria: string[]
  ): string {
    return `TASK ${taskId}: ${taskName}
Priority: ${priority.toUpperCase()}
Description: ${description}

Success Criteria:
${criteria.map((c) => `- ${c}`).join('\n')}`;
  }

  createEscalation(
    issue: string,
    impact: string,
    attemptedSolutions: string[],
    recommendation?: string
  ): string {
    return `ESCALATION REQUIRED
Issue: ${issue}
Impact: ${impact}

Attempted Solutions:
${attemptedSolutions.map((s) => `- ${s}`).join('\n')}

${recommendation ? `Recommendation: ${recommendation}` : ''}`;
  }
}

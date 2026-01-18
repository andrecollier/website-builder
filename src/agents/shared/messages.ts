/**
 * Agent Event Bus Module
 *
 * Manages event-driven communication between agents in the agent system.
 * Provides a pub/sub message bus for agent coordination and progress tracking.
 * Separated from the shared context to enable reactive, event-driven agent communication.
 */

import type { CaptureProgress, ExtractionError } from '@/types';
import type { AgentType } from '../types';
import { publishCaptureProgress } from '@/lib/capture-progress';

/**
 * Base message type for all agent events
 */
export interface BaseAgentMessage {
  websiteId: string;
  agentType: AgentType;
  timestamp: number;
}

/**
 * Agent lifecycle messages
 */
export interface AgentStartedMessage extends BaseAgentMessage {
  type: 'agent:started';
  message: string;
}

export interface AgentCompletedMessage extends BaseAgentMessage {
  type: 'agent:completed';
  message: string;
  result?: unknown;
}

export interface AgentFailedMessage extends BaseAgentMessage {
  type: 'agent:failed';
  error: ExtractionError;
}

/**
 * Progress update messages
 */
export interface ProgressMessage extends BaseAgentMessage {
  type: 'progress';
  progress: CaptureProgress;
}

/**
 * Error messages (non-fatal warnings)
 */
export interface ErrorMessage extends BaseAgentMessage {
  type: 'error';
  error: ExtractionError;
  fatal: boolean;
}

/**
 * Pipeline lifecycle messages
 */
export interface PipelineStartedMessage extends BaseAgentMessage {
  type: 'pipeline:started';
  agentType: 'orchestrator';
  message: string;
}

export interface PipelineCompletedMessage extends BaseAgentMessage {
  type: 'pipeline:completed';
  agentType: 'orchestrator';
  message: string;
}

export interface PipelineFailedMessage extends BaseAgentMessage {
  type: 'pipeline:failed';
  agentType: 'orchestrator';
  error: ExtractionError;
}

/**
 * Union type of all possible messages
 */
export type AgentMessage =
  | AgentStartedMessage
  | AgentCompletedMessage
  | AgentFailedMessage
  | ProgressMessage
  | ErrorMessage
  | PipelineStartedMessage
  | PipelineCompletedMessage
  | PipelineFailedMessage;

/**
 * Message subscriber callback type
 */
type MessageSubscriber = (message: AgentMessage) => void;

/**
 * Message filter predicate type
 */
type MessageFilter = (message: AgentMessage) => boolean;

/**
 * Subscription with optional filter
 */
interface Subscription {
  callback: MessageSubscriber;
  filter?: MessageFilter;
}

/**
 * In-memory store for message subscribers
 * Maps websiteId to set of subscriptions
 */
const messageSubscribers = new Map<string, Set<Subscription>>();

/**
 * In-memory store for message history (for debugging/replay)
 * Maps websiteId to array of messages
 */
const messageHistory = new Map<string, AgentMessage[]>();

/**
 * Maximum message history size per website
 */
const MAX_HISTORY_SIZE = 1000;

/**
 * Subscribe to messages for a specific website
 * Optionally filter by message type or agent type
 */
export function subscribe(
  websiteId: string,
  callback: MessageSubscriber,
  filter?: MessageFilter
): () => void {
  if (!messageSubscribers.has(websiteId)) {
    messageSubscribers.set(websiteId, new Set());
  }

  const subscription: Subscription = { callback, filter };
  messageSubscribers.get(websiteId)!.add(subscription);

  // Send existing message history to new subscriber
  const history = messageHistory.get(websiteId);
  if (history) {
    history.forEach((message) => {
      if (!filter || filter(message)) {
        try {
          callback(message);
        } catch {
          // Ignore callback errors
        }
      }
    });
  }

  // Return unsubscribe function
  return () => {
    const subscribers = messageSubscribers.get(websiteId);
    if (subscribers) {
      subscribers.delete(subscription);
      if (subscribers.size === 0) {
        messageSubscribers.delete(websiteId);
      }
    }
  };
}

/**
 * Publish a message to all subscribers for a website
 * This is called by agents to emit events
 */
export function publish(websiteId: string, message: Omit<AgentMessage, 'websiteId' | 'timestamp'>): void {
  const fullMessage: AgentMessage = {
    ...message,
    websiteId,
    timestamp: Date.now(),
  } as AgentMessage;

  // Store in message history
  if (!messageHistory.has(websiteId)) {
    messageHistory.set(websiteId, []);
  }
  const history = messageHistory.get(websiteId)!;
  history.push(fullMessage);

  // Trim history if too large
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }

  // Notify all subscribers
  const subscribers = messageSubscribers.get(websiteId);
  if (subscribers) {
    subscribers.forEach((subscription) => {
      // Apply filter if present
      if (subscription.filter && !subscription.filter(fullMessage)) {
        return;
      }

      try {
        subscription.callback(fullMessage);
      } catch {
        // Ignore callback errors
      }
    });
  }

  // Wire progress events to SSE stream
  if (fullMessage.type === 'progress') {
    publishCaptureProgress(websiteId, (fullMessage as ProgressMessage).progress);
  }

  // Clean up completed or failed pipelines after a delay
  if (fullMessage.type === 'pipeline:completed' || fullMessage.type === 'pipeline:failed') {
    setTimeout(() => {
      clearMessages(websiteId);
    }, 30000); // Keep for 30 seconds for late subscribers
  }
}

/**
 * Clear message history and subscribers for a website
 * Call on completion or error
 */
export function clearMessages(websiteId: string): void {
  messageHistory.delete(websiteId);
  messageSubscribers.delete(websiteId);
}

/**
 * Get message history for a website
 * Useful for debugging and late subscribers
 */
export function getMessageHistory(websiteId: string): AgentMessage[] {
  return messageHistory.get(websiteId) || [];
}

/**
 * Filter helper: Subscribe to messages from a specific agent type
 */
export function subscribeToAgent(
  websiteId: string,
  agentType: AgentType,
  callback: MessageSubscriber
): () => void {
  return subscribe(websiteId, callback, (message) => message.agentType === agentType);
}

/**
 * Filter helper: Subscribe to specific message types
 */
export function subscribeToMessageType(
  websiteId: string,
  messageType: AgentMessage['type'],
  callback: MessageSubscriber
): () => void {
  return subscribe(websiteId, callback, (message) => message.type === messageType);
}

/**
 * Filter helper: Subscribe to progress updates only
 */
export function subscribeToProgress(
  websiteId: string,
  callback: (progress: CaptureProgress, agentType: AgentType) => void
): () => void {
  return subscribe(websiteId, (message) => {
    if (message.type === 'progress') {
      callback(message.progress, message.agentType);
    }
  });
}

/**
 * Filter helper: Subscribe to errors only
 */
export function subscribeToErrors(
  websiteId: string,
  callback: (error: ExtractionError, agentType: AgentType, fatal: boolean) => void
): () => void {
  return subscribe(websiteId, (message) => {
    if (message.type === 'error') {
      callback(message.error, message.agentType, message.fatal);
    } else if (message.type === 'agent:failed') {
      callback(message.error, message.agentType, true);
    } else if (message.type === 'pipeline:failed') {
      callback(message.error, message.agentType, true);
    }
  });
}

/**
 * Helper: Create a progress publisher for an agent
 * Use this to wrap progress callbacks
 */
export function createProgressPublisher(
  websiteId: string,
  agentType: AgentType
): (progress: CaptureProgress) => void {
  return (progress: CaptureProgress) => {
    publish(websiteId, {
      type: 'progress',
      agentType,
      progress,
    } as Omit<ProgressMessage, 'websiteId' | 'timestamp'>);
  };
}

/**
 * Helper: Publish agent started event
 */
export function publishAgentStarted(
  websiteId: string,
  agentType: AgentType,
  message: string
): void {
  publish(websiteId, {
    type: 'agent:started',
    agentType,
    message,
  } as Omit<AgentStartedMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Helper: Publish agent completed event
 */
export function publishAgentCompleted(
  websiteId: string,
  agentType: AgentType,
  message: string,
  result?: unknown
): void {
  publish(websiteId, {
    type: 'agent:completed',
    agentType,
    message,
    result,
  } as Omit<AgentCompletedMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Helper: Publish agent failed event
 */
export function publishAgentFailed(
  websiteId: string,
  agentType: AgentType,
  error: ExtractionError
): void {
  publish(websiteId, {
    type: 'agent:failed',
    agentType,
    error,
  } as Omit<AgentFailedMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Helper: Publish error event (non-fatal warning)
 */
export function publishError(
  websiteId: string,
  agentType: AgentType,
  error: ExtractionError,
  fatal = false
): void {
  publish(websiteId, {
    type: 'error',
    agentType,
    error,
    fatal,
  } as Omit<ErrorMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Helper: Publish pipeline started event
 */
export function publishPipelineStarted(websiteId: string, message: string): void {
  publish(websiteId, {
    type: 'pipeline:started',
    agentType: 'orchestrator',
    message,
  } as Omit<PipelineStartedMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Helper: Publish pipeline completed event
 */
export function publishPipelineCompleted(websiteId: string, message: string): void {
  publish(websiteId, {
    type: 'pipeline:completed',
    agentType: 'orchestrator',
    message,
  } as Omit<PipelineCompletedMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Helper: Publish pipeline failed event
 */
export function publishPipelineFailed(websiteId: string, error: ExtractionError): void {
  publish(websiteId, {
    type: 'pipeline:failed',
    agentType: 'orchestrator',
    error,
  } as Omit<PipelineFailedMessage, 'websiteId' | 'timestamp'>);
}

/**
 * Clear all message history and subscribers
 * Useful for testing and cleanup
 */
export function clearAllMessages(): void {
  messageHistory.clear();
  messageSubscribers.clear();
}

/**
 * Get all active subscriptions (for debugging)
 */
export function getActiveSubscriptions(): Map<string, number> {
  const counts = new Map<string, number>();
  messageSubscribers.forEach((subscribers, websiteId) => {
    counts.set(websiteId, subscribers.size);
  });
  return counts;
}

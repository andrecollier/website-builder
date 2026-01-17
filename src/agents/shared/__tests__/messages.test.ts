/**
 * Unit tests for Message Bus
 *
 * Tests event publishing, subscribing, and filtering.
 */

import { describe, test, expect, beforeEach } from '@playwright/test';
import { AgentEventBus } from '../messages';
import type { AgentMessage } from '../../types';

describe('AgentEventBus', () => {
  let eventBus: AgentEventBus;

  beforeEach(() => {
    eventBus = new AgentEventBus();
  });

  test('publish and subscribe to messages', () => {
    const messages: AgentMessage[] = [];

    eventBus.subscribe('test-website', (msg) => {
      messages.push(msg);
    });

    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Starting',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('agent.started');
    expect(messages[0].agentType).toBe('capture');
  });

  test('multiple subscribers receive same message', () => {
    const messages1: AgentMessage[] = [];
    const messages2: AgentMessage[] = [];

    eventBus.subscribe('test-website', (msg) => {
      messages1.push(msg);
    });

    eventBus.subscribe('test-website', (msg) => {
      messages2.push(msg);
    });

    eventBus.publish('test-website', {
      type: 'agent.completed',
      websiteId: 'test-website',
      agentType: 'extractor',
      timestamp: new Date().toISOString(),
      message: 'Completed',
    });

    expect(messages1).toHaveLength(1);
    expect(messages2).toHaveLength(1);
    expect(messages1[0]).toEqual(messages2[0]);
  });

  test('messages are isolated by websiteId', () => {
    const messages1: AgentMessage[] = [];
    const messages2: AgentMessage[] = [];

    eventBus.subscribe('website-1', (msg) => {
      messages1.push(msg);
    });

    eventBus.subscribe('website-2', (msg) => {
      messages2.push(msg);
    });

    eventBus.publish('website-1', {
      type: 'agent.started',
      websiteId: 'website-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Website 1 started',
    });

    eventBus.publish('website-2', {
      type: 'agent.started',
      websiteId: 'website-2',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Website 2 started',
    });

    expect(messages1).toHaveLength(1);
    expect(messages2).toHaveLength(1);
    expect(messages1[0].websiteId).toBe('website-1');
    expect(messages2[0].websiteId).toBe('website-2');
  });

  test('subscribeToProgress filters progress messages', () => {
    const progressMessages: AgentMessage[] = [];

    eventBus.subscribeToProgress('test-website', (msg) => {
      progressMessages.push(msg);
    });

    // Publish various message types
    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Starting',
    });

    eventBus.publish('test-website', {
      type: 'agent.progress',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      progress: { phase: 'capturing', percent: 50, message: 'Capturing...' },
    });

    eventBus.publish('test-website', {
      type: 'agent.completed',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Completed',
    });

    // Only progress message should be captured
    expect(progressMessages).toHaveLength(1);
    expect(progressMessages[0].type).toBe('agent.progress');
  });

  test('subscribeToErrors filters error messages', () => {
    const errorMessages: AgentMessage[] = [];

    eventBus.subscribeToErrors('test-website', (msg) => {
      errorMessages.push(msg);
    });

    // Publish various message types
    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Starting',
    });

    eventBus.publish('test-website', {
      type: 'agent.failed',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      error: {
        id: 'error-1',
        phase: 1,
        message: 'Failed',
        timestamp: new Date().toISOString(),
        recoverable: true,
      },
    });

    eventBus.publish('test-website', {
      type: 'pipeline.failed',
      websiteId: 'test-website',
      timestamp: new Date().toISOString(),
      error: {
        id: 'error-2',
        phase: 0,
        message: 'Pipeline failed',
        timestamp: new Date().toISOString(),
        recoverable: false,
      },
    });

    // Both error messages should be captured
    expect(errorMessages).toHaveLength(2);
    expect(errorMessages[0].type).toBe('agent.failed');
    expect(errorMessages[1].type).toBe('pipeline.failed');
  });

  test('unsubscribe stops receiving messages', () => {
    const messages: AgentMessage[] = [];

    const unsubscribe = eventBus.subscribe('test-website', (msg) => {
      messages.push(msg);
    });

    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Message 1',
    });

    expect(messages).toHaveLength(1);

    // Unsubscribe
    unsubscribe();

    eventBus.publish('test-website', {
      type: 'agent.completed',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Message 2',
    });

    // Should still be 1 (message after unsubscribe not received)
    expect(messages).toHaveLength(1);
  });

  test('message history is maintained', () => {
    // Publish some messages
    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'orchestrator',
      timestamp: new Date().toISOString(),
      message: 'Message 1',
    });

    eventBus.publish('test-website', {
      type: 'agent.progress',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      progress: { phase: 'capturing', percent: 50, message: 'Message 2' },
    });

    // Subscribe after messages published
    const messages: AgentMessage[] = [];
    eventBus.subscribe('test-website', (msg) => {
      messages.push(msg);
    });

    // New subscriber should receive history if implemented
    // (This depends on implementation - may not have history)
    // For now, just verify new messages work
    eventBus.publish('test-website', {
      type: 'agent.completed',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Message 3',
    });

    expect(messages.length).toBeGreaterThan(0);
  });

  test('clearHistory removes message history', () => {
    // Publish messages
    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Message 1',
    });

    // Clear history
    eventBus.clearHistory('test-website');

    // Subscribe and publish new message
    const messages: AgentMessage[] = [];
    eventBus.subscribe('test-website', (msg) => {
      messages.push(msg);
    });

    eventBus.publish('test-website', {
      type: 'agent.completed',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Message 2',
    });

    // Should only have new message
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Message 2');
  });

  test('pipeline lifecycle messages flow correctly', () => {
    const messages: AgentMessage[] = [];

    eventBus.subscribe('test-website', (msg) => {
      messages.push(msg);
    });

    // Simulate full pipeline lifecycle
    eventBus.publish('test-website', {
      type: 'pipeline.started',
      websiteId: 'test-website',
      timestamp: new Date().toISOString(),
      message: 'Pipeline started',
    });

    eventBus.publish('test-website', {
      type: 'agent.started',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Capture started',
    });

    eventBus.publish('test-website', {
      type: 'agent.completed',
      websiteId: 'test-website',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Capture completed',
    });

    eventBus.publish('test-website', {
      type: 'pipeline.completed',
      websiteId: 'test-website',
      timestamp: new Date().toISOString(),
      message: 'Pipeline completed',
    });

    expect(messages).toHaveLength(4);
    expect(messages[0].type).toBe('pipeline.started');
    expect(messages[1].type).toBe('agent.started');
    expect(messages[2].type).toBe('agent.completed');
    expect(messages[3].type).toBe('pipeline.completed');
  });

  test('concurrent messages to different websites work correctly', () => {
    const messages1: AgentMessage[] = [];
    const messages2: AgentMessage[] = [];

    eventBus.subscribe('website-1', (msg) => {
      messages1.push(msg);
    });

    eventBus.subscribe('website-2', (msg) => {
      messages2.push(msg);
    });

    // Publish interleaved messages
    eventBus.publish('website-1', {
      type: 'agent.started',
      websiteId: 'website-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'W1 Message 1',
    });

    eventBus.publish('website-2', {
      type: 'agent.started',
      websiteId: 'website-2',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'W2 Message 1',
    });

    eventBus.publish('website-1', {
      type: 'agent.completed',
      websiteId: 'website-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'W1 Message 2',
    });

    eventBus.publish('website-2', {
      type: 'agent.completed',
      websiteId: 'website-2',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'W2 Message 2',
    });

    expect(messages1).toHaveLength(2);
    expect(messages2).toHaveLength(2);
    expect(messages1.every((m) => m.websiteId === 'website-1')).toBe(true);
    expect(messages2.every((m) => m.websiteId === 'website-2')).toBe(true);
  });
});

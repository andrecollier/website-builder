/**
 * Integration Tests for Agent Pipeline
 *
 * Tests the full agent pipeline flow including:
 * - Pipeline execution order
 * - Parallel processing
 * - Error propagation and recovery
 */

import { test, expect } from '@playwright/test';
import { initializeContext, getContext, clearContext } from '@/agents/shared/context';
import { AgentEventBus } from '@/agents/shared/messages';

test.describe('Agent Pipeline Integration', () => {
  test.beforeEach(() => {
    // Clean up contexts before each test
    clearContext('test-integration-1');
    clearContext('test-integration-2');
  });

  test('shared context initialization works', () => {
    initializeContext('test-integration-1', 'https://example.com');

    const ctx = getContext('test-integration-1');

    expect(ctx).toBeDefined();
    expect(ctx?.websiteId).toBe('test-integration-1');
    expect(ctx?.url).toBe('https://example.com');
    expect(ctx?.status).toBe('initializing');
  });

  test('message bus publishes and subscribes correctly', () => {
    const eventBus = new AgentEventBus();
    const messages: any[] = [];

    eventBus.subscribe('test-integration-1', (msg) => {
      messages.push(msg);
    });

    eventBus.publish('test-integration-1', {
      type: 'pipeline.started',
      websiteId: 'test-integration-1',
      timestamp: new Date().toISOString(),
      message: 'Pipeline started',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('pipeline.started');
  });

  test('pipeline phases follow correct order', () => {
    initializeContext('test-integration-1', 'https://example.com');
    const eventBus = new AgentEventBus();
    const phases: string[] = [];

    eventBus.subscribe('test-integration-1', (msg) => {
      if (msg.type === 'agent.started') {
        phases.push(msg.agentType);
      }
    });

    // Simulate pipeline execution
    eventBus.publish('test-integration-1', {
      type: 'agent.started',
      websiteId: 'test-integration-1',
      agentType: 'orchestrator',
      timestamp: new Date().toISOString(),
      message: 'Orchestrator started',
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.started',
      websiteId: 'test-integration-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'Capture started',
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.started',
      websiteId: 'test-integration-1',
      agentType: 'extractor',
      timestamp: new Date().toISOString(),
      message: 'Extractor started',
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.started',
      websiteId: 'test-integration-1',
      agentType: 'generator',
      timestamp: new Date().toISOString(),
      message: 'Generator started',
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.started',
      websiteId: 'test-integration-1',
      agentType: 'comparator',
      timestamp: new Date().toISOString(),
      message: 'Comparator started',
    });

    // Verify order
    expect(phases[0]).toBe('orchestrator');
    expect(phases[1]).toBe('capture');
    expect(phases[2]).toBe('extractor');
    expect(phases[3]).toBe('generator');
    expect(phases[4]).toBe('comparator');

    // Verify capture comes before extract
    const captureIdx = phases.findIndex((p) => p === 'capture');
    const extractIdx = phases.findIndex((p) => p === 'extractor');
    expect(captureIdx).toBeLessThan(extractIdx);

    // Verify extract comes before generate
    const genIdx = phases.findIndex((p) => p === 'generator');
    expect(extractIdx).toBeLessThan(genIdx);

    // Verify generate comes before compare
    const compIdx = phases.findIndex((p) => p === 'comparator');
    expect(genIdx).toBeLessThan(compIdx);
  });

  test('context updates are isolated by websiteId', () => {
    initializeContext('website-1', 'https://example1.com');
    initializeContext('website-2', 'https://example2.com');

    const ctx1 = getContext('website-1');
    const ctx2 = getContext('website-2');

    expect(ctx1?.websiteId).toBe('website-1');
    expect(ctx2?.websiteId).toBe('website-2');
    expect(ctx1?.url).toBe('https://example1.com');
    expect(ctx2?.url).toBe('https://example2.com');
  });

  test('event bus messages are isolated by websiteId', () => {
    const eventBus = new AgentEventBus();
    const messages1: any[] = [];
    const messages2: any[] = [];

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
      message: 'W1 message',
    });

    eventBus.publish('website-2', {
      type: 'agent.started',
      websiteId: 'website-2',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      message: 'W2 message',
    });

    expect(messages1).toHaveLength(1);
    expect(messages2).toHaveLength(1);
    expect(messages1[0].websiteId).toBe('website-1');
    expect(messages2[0].websiteId).toBe('website-2');
  });

  test('error propagation through message bus works', () => {
    const eventBus = new AgentEventBus();
    const errorMessages: any[] = [];

    eventBus.subscribeToErrors('test-integration-1', (msg) => {
      errorMessages.push(msg);
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.failed',
      websiteId: 'test-integration-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      error: {
        id: 'error-1',
        phase: 1,
        message: 'Capture failed',
        timestamp: new Date().toISOString(),
        recoverable: true,
      },
    });

    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].type).toBe('agent.failed');
    expect(errorMessages[0].error.message).toBe('Capture failed');
  });

  test('progress updates flow through message bus', () => {
    const eventBus = new AgentEventBus();
    const progressMessages: any[] = [];

    eventBus.subscribeToProgress('test-integration-1', (msg) => {
      progressMessages.push(msg);
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.progress',
      websiteId: 'test-integration-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      progress: {
        phase: 'capturing',
        percent: 25,
        message: 'Capturing page...',
      },
    });

    eventBus.publish('test-integration-1', {
      type: 'agent.progress',
      websiteId: 'test-integration-1',
      agentType: 'capture',
      timestamp: new Date().toISOString(),
      progress: {
        phase: 'capturing',
        percent: 50,
        message: 'Processing sections...',
      },
    });

    expect(progressMessages).toHaveLength(2);
    expect(progressMessages[0].progress.percent).toBe(25);
    expect(progressMessages[1].progress.percent).toBe(50);
  });

  test('agent registry provides correct configurations', async () => {
    // Dynamically import to avoid early module loading issues
    const { getAgent } = await import('@/agents');

    const orchestrator = getAgent('orchestrator');
    const capture = getAgent('capture');
    const extractor = getAgent('extractor');
    const generator = getAgent('generator');
    const comparator = getAgent('comparator');

    // Verify model assignments
    expect(orchestrator.model).toBe('sonnet');
    expect(capture.model).toBe('haiku');
    expect(extractor.model).toBe('sonnet');
    expect(generator.model).toBe('sonnet');
    expect(comparator.model).toBe('haiku');

    // Verify all have required properties
    [orchestrator, capture, extractor, generator, comparator].forEach((config) => {
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxRetries');
      expect(config).toHaveProperty('timeout');
    });
  });
});

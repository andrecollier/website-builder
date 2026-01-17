/**
 * Unit tests for Agent Registry
 *
 * Tests the getAgent() function and agent configuration retrieval.
 */

import { describe, test, expect } from '@playwright/test';
import { getAgent } from '../index';

describe('Agent Registry', () => {
  test('getAgent returns orchestrator config', () => {
    const config = getAgent('orchestrator');
    expect(config.type).toBe('orchestrator');
    expect(config.model).toBe('sonnet');
    expect(config.maxRetries).toBe(3);
    expect(config.timeout).toBeGreaterThan(0);
  });

  test('getAgent returns capture config', () => {
    const config = getAgent('capture');
    expect(config.type).toBe('capture');
    expect(config.model).toBe('haiku');
    expect(config.maxRetries).toBe(3);
    expect(config.timeout).toBeGreaterThan(0);
  });

  test('getAgent returns extractor config', () => {
    const config = getAgent('extractor');
    expect(config.type).toBe('extractor');
    expect(config.model).toBe('sonnet');
    expect(config.maxRetries).toBe(3);
    expect(config.timeout).toBeGreaterThan(0);
  });

  test('getAgent returns generator config', () => {
    const config = getAgent('generator');
    expect(config.type).toBe('generator');
    expect(config.model).toBe('sonnet');
    expect(config.maxRetries).toBe(3);
    expect(config.timeout).toBeGreaterThan(0);
  });

  test('getAgent returns comparator config', () => {
    const config = getAgent('comparator');
    expect(config.type).toBe('comparator');
    expect(config.model).toBe('haiku');
    expect(config.maxRetries).toBe(3);
    expect(config.timeout).toBeGreaterThan(0);
  });

  test('getAgent throws for unknown agent', () => {
    expect(() => getAgent('unknown' as any)).toThrow('not found in registry');
  });

  test('all agents have consistent config structure', () => {
    const agentTypes = ['orchestrator', 'capture', 'extractor', 'generator', 'comparator'] as const;

    agentTypes.forEach((agentType) => {
      const config = getAgent(agentType);

      // Verify all configs have required properties
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxRetries');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('verbose');

      // Verify types
      expect(typeof config.type).toBe('string');
      expect(typeof config.model).toBe('string');
      expect(typeof config.maxRetries).toBe('number');
      expect(typeof config.timeout).toBe('number');
      expect(typeof config.verbose).toBe('boolean');
    });
  });

  test('orchestrator has longest timeout', () => {
    const orchestrator = getAgent('orchestrator');
    const capture = getAgent('capture');
    const extractor = getAgent('extractor');
    const generator = getAgent('generator');
    const comparator = getAgent('comparator');

    // Orchestrator coordinates everything, should have longest timeout
    expect(orchestrator.timeout).toBeGreaterThanOrEqual(generator.timeout);
    expect(orchestrator.timeout).toBeGreaterThanOrEqual(extractor.timeout);
  });

  test('haiku models are faster agents (capture, comparator)', () => {
    const capture = getAgent('capture');
    const comparator = getAgent('comparator');

    expect(capture.model).toBe('haiku');
    expect(comparator.model).toBe('haiku');
  });

  test('sonnet models are for complex tasks (orchestrator, extractor, generator)', () => {
    const orchestrator = getAgent('orchestrator');
    const extractor = getAgent('extractor');
    const generator = getAgent('generator');

    expect(orchestrator.model).toBe('sonnet');
    expect(extractor.model).toBe('sonnet');
    expect(generator.model).toBe('sonnet');
  });
});

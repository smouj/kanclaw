import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Feature Flags', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  it('should get all flag names', async () => {
    const { getFeatureFlagNames } = await import('../lib/feature-flags');
    const names = getFeatureFlagNames();
    expect(names).toContain('USE_AGENT_MODEL_OVERRIDES');
    expect(names).toContain('USE_PROVENANCE_V2');
  });
  
  it('should return default enabled flags', async () => {
    const { getEnabledFeatures } = await import('../lib/feature-flags');
    const enabled = getEnabledFeatures();
    expect(enabled).toContain('USE_AGENT_MODEL_OVERRIDES');
  });
  
  it('should check flag enabled', async () => {
    const { isFeatureEnabled } = await import('../lib/feature-flags');
    expect(isFeatureEnabled('USE_AGENT_MODEL_OVERRIDES')).toBe(true);
    expect(isFeatureEnabled('USE_KANCLAW_CONTEXT_ENGINE')).toBe(false);
  });
  
  it('should return false for unknown flag', async () => {
    const { isFeatureEnabled } = await import('../lib/feature-flags');
    expect(isFeatureEnabled('UNKNOWN_FLAG')).toBe(false);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { logger, log } from '../lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clear();
  });

  it('should create log entries', () => {
    log.info('Test message', { key: 'value' });
    const logs = logger.getLogs();
    
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].level).toBe('info');
    expect(logs[0].context).toEqual({ key: 'value' });
  });

  it('should filter logs by level', () => {
    log.info('Info message');
    log.warn('Warning message');
    log.error('Error message');
    
    const errors = logger.getLogs('error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Error message');
  });

  it('should export logs as JSON', () => {
    log.info('Test');
    const exported = logger.export();
    
    expect(exported).toContain('Test');
    expect(exported).toContain('info');
  });

  it('should handle errors', () => {
    const error = new Error('Test error');
    log.error('Failed', error, { extra: 'data' });
    
    const errors = logger.getLogs('error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Failed');
    expect(errors[0].error?.message).toBe('Test error');
  });
});

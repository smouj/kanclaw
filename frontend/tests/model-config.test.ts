import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    modelConfig: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getEffectiveModel, getProjectDefaultModel, AVAILABLE_MODELS } from '../lib/model-config';

describe('Model Config Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('AVAILABLE_MODELS', () => {
    it('should have minimax models', () => {
      const minimax = AVAILABLE_MODELS.filter(m => m.provider === 'kilocode');
      expect(minimax.length).toBeGreaterThan(0);
    });
    
    it('should have free models', () => {
      const free = AVAILABLE_MODELS.filter(m => m.free);
      expect(free.length).toBeGreaterThan(0);
    });
  });
  
  describe('getProjectDefaultModel', () => {
    it('should return null for non-existent project', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);
      
      const result = await getProjectDefaultModel('non-existent');
      expect(result).toBeNull();
    });
  });
  
  describe('getEffectiveModel', () => {
    it('should return fallback when no config exists', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);
      
      const result = await getEffectiveModel('test-project');
      // Fallback is 'minimax-m2.5:free', split gives provider='minimax'
      expect(result.model).toBe('minimax-m2.5:free');
    });
  });
});

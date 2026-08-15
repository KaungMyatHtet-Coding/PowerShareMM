import { describe, expect, it, vi } from 'vitest';
import { analyzeLive, ClientError, unwrapEnvelope } from './client';
import { demoScenario, mockEnvelope } from '../data/mockFixture';

describe('V1.1 API adapter', () => {
  it('unwraps the success envelope without calculating fields', () => {
    expect(unwrapEnvelope(mockEnvelope).payoff_matrix.cells[0].utilities).toEqual([76.5, 61.5]);
  });
  it('classifies malformed responses', () => {
    expect(() => unwrapEnvelope({ data: {} })).toThrowError(ClientError);
    try { unwrapEnvelope({ data: {} }); } catch (error) { expect((error as ClientError).kind).toBe('malformed'); }
  });
  it('classifies backend-unavailable failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(analyzeLive(demoScenario)).rejects.toMatchObject({ kind: 'network' });
    vi.unstubAllGlobals();
  });
});

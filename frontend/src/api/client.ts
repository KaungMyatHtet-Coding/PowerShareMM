import type { ApiErrorBody, Envelope, FullAnalysisData, Scenario } from '../types';
import { mockEnvelope } from '../data/mockFixture';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export class ClientError extends Error {
  readonly kind: 'validation' | 'network' | 'malformed';
  readonly field: string | null;
  readonly correction: string | null;
  constructor(message: string, kind: ClientError['kind'], field: string | null = null, correction: string | null = null) {
    super(message); this.name = 'ClientError'; this.kind = kind; this.field = field; this.correction = correction;
  }
}

export function unwrapEnvelope(body: unknown): FullAnalysisData {
  if (!body || typeof body !== 'object' || !('data' in body)) throw new ClientError('The backend returned an unexpected response.', 'malformed');
  const envelope = body as Partial<Envelope<FullAnalysisData>>;
  if (!envelope.data || typeof envelope.data !== 'object' || !envelope.data.payoff_matrix || !envelope.data.arbitration_result) {
    throw new ClientError('The backend response is missing required analysis sections.', 'malformed');
  }
  return { ...envelope.data, warnings: envelope.warnings || [] };
}

export async function analyzeLive(scenario: Scenario, signal?: AbortSignal): Promise<FullAnalysisData> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analysis/full`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, include_repeated_game: true }), signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ClientError('The backend is unavailable. Check that the local API is running, then retry.', 'network');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body as Partial<ApiErrorBody>;
    throw new ClientError(error.error?.message || `The backend rejected the request (${response.status}).`, response.status === 422 ? 'validation' : 'network', error.error?.field ?? null, error.error?.correction ?? null);
  }
  return unwrapEnvelope(body);
}

export function analyzeMock(): FullAnalysisData { return mockEnvelope.data; }

import type {
  ScenarioInput,
  FullAnalysisResponse,
  ApiMode,
} from '@/types';
import { mockFullAnalysis } from '@/data/mockData';
import { computeFullAnalysis } from '@/lib/gameEngine';

// Config-controlled switch between Mock and Live mode.
// In Live mode the client targets a FastAPI backend (structure documented below).
const API_BASE_URL =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface ApiClient {
  mode: ApiMode;
  analyze(scenario: ScenarioInput): Promise<FullAnalysisResponse>;
}

class MockApiClient implements ApiClient {
  mode: ApiMode = 'mock';

  async analyze(scenario: ScenarioInput): Promise<FullAnalysisResponse> {
    // Simulate network latency for realistic loading states.
    await delay(600);
    // Authoritative math comes from the engine layer.
    return computeFullAnalysis(scenario);
  }
}

/**
 * LiveApiClient targets a FastAPI backend exposing:
 *   POST /api/analyze  -> FullAnalysisResponse
 *
 * Request body: ScenarioInput (JSON)
 * Response:     FullAnalysisResponse (JSON)
 *
 * The backend owns all game-theoretic computation; the UI only renders.
 */
class LiveApiClient implements ApiClient {
  mode: ApiMode = 'live';

  async analyze(scenario: ScenarioInput): Promise<FullAnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as FullAnalysisResponse;
  }
}

export function createApiClient(mode: ApiMode): ApiClient {
  return mode === 'live' ? new LiveApiClient() : new MockApiClient();
}

// Re-export the static mock for initial render / fallback.
export { mockFullAnalysis };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

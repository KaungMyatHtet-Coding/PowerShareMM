import fixture from '../../../sample-data/mock-full-analysis-response.json';
import scenario from '../../../sample-data/demo-scenario.json';
import type { Envelope, FullAnalysisData, Scenario } from '../types';

const rawFixture = fixture as unknown as Envelope<FullAnalysisData>;
export const mockEnvelope: Envelope<FullAnalysisData> = {
  ...rawFixture,
  data: { ...rawFixture.data, warnings: rawFixture.warnings },
};
export const demoScenario = scenario as unknown as Scenario;

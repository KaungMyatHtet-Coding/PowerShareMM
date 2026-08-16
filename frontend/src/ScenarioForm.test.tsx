/**
 * ScenarioForm.test.tsx — 15 new tests for the guided scenario form UX.
 * Tests cover bilingual help text, field behaviour, sliders, validation,
 * reset, advanced toggle, parity, and canonical-result preservation.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { dictionaryHasParity, translations } from './i18n/translations';

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.lang = 'en';
  delete document.documentElement.dataset.theme;
});

/* ── helpers ─────────────────────────────────────────────────────────── */
const en = translations.en;
const my = translations.my;

const enterWorkspace = () =>
  fireEvent.click(screen.getByRole('button', { name: en.enterWorkspace }));

const goScenario = () => {
  render(<App />);
  enterWorkspace();
};

describe('ScenarioForm — guided UX', () => {

  /* 1. English helper text renders for shared-resource fields */
  it('shows English helper text for the capacity field', () => {
    goScenario();
    expect(screen.getByText(en.capacityHelp)).toBeInTheDocument();
  });

  /* 2. Myanmar helper text renders when language is set to Myanmar */
  it('shows Myanmar helper text when language is Myanmar', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'မနမ' }));
    fireEvent.click(screen.getByRole('button', { name: my.enterWorkspace }));
    expect(screen.getByText(my.capacityHelp)).toBeInTheDocument();
  });

  /* 3. Resource type shows localised label; internal value not exposed as editable */
  it('shows the localised resource-type display and no editable text input for resource_type', () => {
    goScenario();
    expect(screen.getByText(en.resourceTypeDisplay)).toBeInTheDocument();
    expect(screen.queryByDisplayValue('hybrid')).not.toBeInTheDocument();
  });

  /* 4. Urgency segmented control renders all 5 buttons with labels */
  it('renders all 5 urgency buttons with labels', () => {
    goScenario();
    const urgencyLabels = [en.urgency1, en.urgency2, en.urgency3, en.urgency4, en.urgency5];
    urgencyLabels.forEach((label) =>
      expect(screen.getAllByText(label).length).toBeGreaterThan(0));
  });

  /* 5. Risk preference slider is present; shows a category label */
  it('renders risk preference sliders with anchor labels', () => {
    goScenario();
    // Open advanced settings first
    const advancedBtn = screen.getByRole('button', { name: (name) => name.includes(en.advancedModelSettings) });
    fireEvent.click(advancedBtn);
    // Both anchor extremes must be visible
    expect(screen.getAllByText(new RegExp(en.risk0)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(en.risk100)).length).toBeGreaterThan(0);
  });

  /* 6. Hurwicz slider is present with weighting description */
  it('renders the Hurwicz alpha slider with a weight description', () => {
    goScenario();
    const advancedBtn = screen.getByRole('button', { name: (name) => name.includes(en.advancedModelSettings) });
    fireEvent.click(advancedBtn);
    expect(screen.getByText(en.hurwiczLabel)).toBeInTheDocument();
    expect(screen.getAllByText(/best-case/).length).toBeGreaterThan(0);
  });

  /* 7. Probability total = 100 % → valid message; changing to invalid → error shown */
  it('shows valid probability status initially and error when total ≠ 100%', () => {
    goScenario();
    const advancedBtn = screen.getByRole('button', { name: (name) => name.includes(en.advancedModelSettings) });
    fireEvent.click(advancedBtn);
    // Initially all three states sum to 100 % (30 + 50 + 20 = 100)
    expect(screen.getAllByText(new RegExp(en.probValid)).length).toBeGreaterThan(0);
    // Change SHORT outage probability to 99 — total becomes 169 %
    const shortInput = screen.getByRole('spinbutton', {
      name: new RegExp(`${en.stateShort}.*${en.probability}`, 'i'),
    });
    fireEvent.change(shortInput, { target: { value: '99' } });
    expect(screen.getAllByText(new RegExp(en.probInvalid)).length).toBeGreaterThan(0);
  });

  /* 8. Cost share sum = 100 % → valid; making it invalid disables submit */
  it('disables the submit button when preferred cost shares do not total 100%', () => {
    goScenario();
    const advancedBtn = screen.getByRole('button', { name: (name) => name.includes(en.advancedModelSettings) });
    fireEvent.click(advancedBtn);
    // There are two cost-share inputs; change player 1's to 0.9 (total becomes 1.3)
    const csInputs = screen.getAllByRole('spinbutton', {
      name: new RegExp(`${en.preferredCostShare}`, 'i'),
    });
    fireEvent.change(csInputs[0], { target: { value: '0.9' } });
    expect(screen.getAllByText(new RegExp(en.costShareInvalid)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: en.findSharingRecommendation })).toBeDisabled();
  });

  /* 9. Essential demand > demand → localised error shown */
  it('shows an error when essential kWh exceeds demand kWh', () => {
    goScenario();
    // demand for P1 in demoScenario is 7; essential is 4
    const demandInputs = screen.getAllByRole('spinbutton', {
      name: new RegExp(en.demand.replace(/\s*\(.*\)/, ''), 'i'),
    });
    fireEvent.change(demandInputs[0], { target: { value: '3' } }); // demand → 3
    // essential stays at 4 → 4 > 3 → error
    expect(screen.getAllByText(en.essentialExceedsDemand).length).toBeGreaterThan(0);
  });

  /* 10. Any validation error disables the submit button */
  it('disables the submit button when any validation error is present', () => {
    goScenario();
    const demandInputs = screen.getAllByRole('spinbutton', {
      name: new RegExp(en.demand.replace(/\s*\(.*\)/, ''), 'i'),
    });
    fireEvent.change(demandInputs[0], { target: { value: '1' } });
    expect(screen.getByRole('button', { name: en.findSharingRecommendation })).toBeDisabled();
  });

  /* 11. Reset button restores the example scenario (no validation errors) */
  it('reset button clears validation errors and restores example values', () => {
    goScenario();
    // Create an error
    const demandInputs = screen.getAllByRole('spinbutton', {
      name: new RegExp(en.demand.replace(/\s*\(.*\)/, ''), 'i'),
    });
    fireEvent.change(demandInputs[0], { target: { value: '1' } });
    expect(screen.getAllByText(en.essentialExceedsDemand).length).toBeGreaterThan(0);
    // Reset
    fireEvent.click(screen.getByRole('button', { name: en.resetToExample }));
    expect(screen.queryByText(en.essentialExceedsDemand)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.findSharingRecommendation })).not.toBeDisabled();
  });

  /* 12. Advanced section is collapsed initially; toggle button opens it */
  it('collapses advanced settings initially and opens them on toggle', () => {
    goScenario();
    // The maxSafeLoad label should NOT be visible initially (advanced closed)
    expect(screen.queryByText(en.maxSafeLoadHelp)).not.toBeInTheDocument();
    // Click the toggle
    const advancedBtn = screen.getByRole('button', { name: (name) => name.includes(en.advancedModelSettings) });
    fireEvent.click(advancedBtn);
    expect(screen.getByText(en.maxSafeLoadHelp)).toBeInTheDocument();
  });

  /* 13. Dictionary has parity — all en keys exist in my */
  it('keeps the translation dictionary in full parity', () => {
    expect(dictionaryHasParity()).toBe(true);
  });

  /* 14. Canonical fixture values are unchanged (oracle test) */
  it('returns canonical results from the mock fixture', () => {
    goScenario();
    fireEvent.click(screen.getByRole('radio', { name: en.mockDemoData }));
    fireEvent.click(screen.getByRole('button', { name: en.findSharingRecommendation }));
    expect(screen.getAllByText('76.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nash Equilibrium/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Uncertainty' }));
    expect(screen.getAllByText('HYBRID').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Arbitration' }));
    expect(screen.getAllByText(/10,440/).length).toBeGreaterThan(0);
    expect(screen.getByText(/5.5, 4.5/)).toBeInTheDocument();
  });

  /* 15. Intro panel, example summary, and how-info-used panel are all present */
  it('renders the intro, example summary, and how-info-is-used panels', () => {
    goScenario();
    expect(screen.getByText(en.howThisPageWorks)).toBeInTheDocument();
    expect(screen.getByText(en.exampleScenarioTitle)).toBeInTheDocument();
    expect(screen.getByText(en.howInfoIsUsedTitle)).toBeInTheDocument();
    expect(screen.getByText(en.step1Title)).toBeInTheDocument();
    expect(screen.getByText(en.step2Title)).toBeInTheDocument();
    expect(screen.getByText(en.step3Title)).toBeInTheDocument();
    expect(screen.getByText(en.reviewSummaryTitle)).toBeInTheDocument();
    expect(screen.getByText(en.findSharingHelp)).toBeInTheDocument();
  });

  /* 16. Disables submission when capacity <= 0 */
  it('disables submission when capacity is 0 or negative', () => {
    goScenario();
    const capacityInput = screen.getByRole('spinbutton', {
      name: new RegExp(en.capacity.replace(/\s*\(.*\)/, ''), 'i'),
    });
    fireEvent.change(capacityInput, { target: { value: '0' } });
    expect(screen.getAllByText(en.mustBeGreaterThanZero).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: en.findSharingRecommendation })).toBeDisabled();
  });

  /* 17. Disables submission when available hours <= 0 */
  it('disables submission when available hours is 0 or negative', () => {
    goScenario();
    const hoursInput = screen.getByRole('spinbutton', {
      name: new RegExp(en.availableHours.replace(/\s*\(.*\)/, ''), 'i'),
    });
    fireEvent.change(hoursInput, { target: { value: '0' } });
    expect(screen.getAllByText(en.mustBeGreaterThanZero).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: en.findSharingRecommendation })).toBeDisabled();
  });

  /* 18. Native radio buttons are used for urgency control */
  it('uses native radio buttons for urgency control', () => {
    goScenario();
    const radios = screen.getAllByRole('radio', { name: /1|2|3|4|5/ });
    expect(radios.length).toBeGreaterThan(0);
    expect(radios[0]).toHaveAttribute('type', 'radio');
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

describe('PowerShare dashboard contract rendering', () => {
  it('renders canonical fixture values without browser calculations', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: 'Mock demo data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run full analysis' }));
    expect(screen.getByText('76.50')).toBeInTheDocument();
    expect(screen.getByText('Nash: MM')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Uncertainty' }));
    expect(screen.getAllByText('HYBRID').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Arbitration' }));
    expect(screen.getAllByText(/10,440/).length).toBeGreaterThan(0);
    expect(screen.getByText(/5.5, 4.5/)).toBeInTheDocument();
  });

  it('uses a live V1.1 endpoint and surfaces validation errors', async () => {
    const response = { error: { code: 'INVALID_CAPACITY', message: 'Available capacity must be greater than zero.', field: 'resource.capacity_kwh', correction: 'Enter a number greater than zero.' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 422, headers: { 'Content-Type': 'application/json' } })));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Run full analysis' }));
    await screen.findByText(/Available capacity must be greater than zero/);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/analysis/full'), expect.objectContaining({ method: 'POST' }));
    vi.unstubAllGlobals();
  });
});

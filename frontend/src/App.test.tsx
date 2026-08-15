import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { mockEnvelope } from './data/mockFixture';

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void };

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => { resolve = nextResolve; reject = nextReject; });
  return { promise, resolve, reject };
}

function fullResponse(explanation = 'request result'): Response {
  return new Response(JSON.stringify({ ...mockEnvelope, data: { ...mockEnvelope.data, explanations: [explanation] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => vi.unstubAllGlobals());

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
  });

  it('aborts request A when request B starts and ignores A AbortError', async () => {
    const requestA = deferred<Response>();
    const requestB = deferred<Response>();
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      signals.push(init?.signal as AbortSignal);
      return signals.length === 1 ? requestA.promise : requestB.promise;
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const form = screen.getByRole('button', { name: 'Run full analysis' }).closest('form')!;

    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(signals[0].aborted).toBe(true);
    expect(signals[1]).not.toBe(signals[0]);
    requestA.reject(new DOMException('The request was superseded.', 'AbortError'));
    await act(async () => requestB.resolve(fullResponse('request B')));
    await waitFor(() => expect(screen.getByText('Payoff matrix & equilibrium')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not let a late response A overwrite completed response B', async () => {
    const requestA = deferred<Response>();
    const requestB = deferred<Response>();
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => requestA.promise)
      .mockImplementationOnce(() => requestB.promise);
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    const form = screen.getByRole('button', { name: 'Run full analysis' }).closest('form')!;

    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await act(async () => requestB.resolve(fullResponse('request B')));
    await waitFor(() => expect(screen.getByText('Payoff matrix & equilibrium')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Results / theory' }));
    await waitFor(() => expect(screen.getByText('request B')).toBeInTheDocument());

    await act(async () => requestA.resolve(fullResponse('request A')));
    await waitFor(() => expect(screen.getByText('request B')).toBeInTheDocument());
    expect(screen.queryByText('request A')).not.toBeInTheDocument();
  });
});

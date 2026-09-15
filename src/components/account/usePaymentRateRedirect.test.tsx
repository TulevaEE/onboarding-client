import { render, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { usePaymentRateRedirect } from './usePaymentRateRedirect';
import { postPaymentRateRedirect } from '../common/api';

jest.mock('../common/api', () => ({ postPaymentRateRedirect: jest.fn() }));

const post = postPaymentRateRedirect as jest.Mock;

const Probe = () => {
  usePaymentRateRedirect();
  return null;
};

const renderAt = (history: History) =>
  render(
    <Router history={history}>
      <Probe />
    </Router>,
  );

describe('usePaymentRateRedirect', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ redirect: false });
  });

  it('asks for nothing when the account page was not the login landing', async () => {
    const history = createMemoryHistory();
    history.push('/account');
    renderAt(history);

    await waitFor(() => expect(post).not.toHaveBeenCalled());
  });

  it('asks once and clears the landing flag without adding history entries', async () => {
    const history = createMemoryHistory();
    history.push('/account', { justLoggedIn: true });
    const entriesAfterLanding = history.length;
    renderAt(history);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(history.location.state).toBeUndefined();
    expect(history.length).toBe(entriesAfterLanding);
  });

  it('replaces the route with the nudge state when the server redirects', async () => {
    post.mockResolvedValue({ redirect: true, arm: 'TREATMENT', seasonYear: 2026 });
    const history = createMemoryHistory();
    history.push('/account', { justLoggedIn: true });
    const entriesAfterLanding = history.length;
    renderAt(history);

    await waitFor(() => expect(history.location.pathname).toBe('/2nd-pillar-payment-rate'));
    expect(history.location.state).toEqual({ nudge: { arm: 'TREATMENT', seasonYear: 2026 } });
    expect(history.length).toBe(entriesAfterLanding);
  });

  it('keeps the account page when the redirect call fails', async () => {
    post.mockRejectedValue(new Error('nope'));
    const history = createMemoryHistory();
    history.push('/account', { justLoggedIn: true });
    renderAt(history);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(history.location.pathname).toBe('/account');
  });
});

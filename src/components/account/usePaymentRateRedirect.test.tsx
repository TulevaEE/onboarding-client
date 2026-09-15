import { act, render, waitFor } from '@testing-library/react';
import { Redirect, Router } from 'react-router-dom';
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

  it('leaves a person who already moved on where they are', async () => {
    let answer: (decision: { redirect: boolean; arm: string; seasonYear: number }) => void = () =>
      undefined;
    post.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const history = createMemoryHistory();
    history.push('/account', { justLoggedIn: true });
    const { unmount } = renderAt(history);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    unmount();
    history.push('/3rd-pillar-flow');
    await act(async () => {
      answer({ redirect: true, arm: 'TREATMENT', seasonYear: 2026 });
    });

    expect(history.location.pathname).toBe('/3rd-pillar-flow');
  });

  it('lets a mandatory AML redirect win over the login landing', async () => {
    const ToAml = () => {
      usePaymentRateRedirect();
      return <Redirect to="/aml" />;
    };
    const history = createMemoryHistory();
    history.push('/account', { justLoggedIn: true });
    render(
      <Router history={history}>
        <ToAml />
      </Router>,
    );

    await waitFor(() => expect(history.location.pathname).toBe('/aml'));
    expect(history.location.state).toBeUndefined();
    expect(post).not.toHaveBeenCalled();
  });

  it('keeps the query string when it clears the login flag', async () => {
    const history = createMemoryHistory();
    history.push('/account?dev', { justLoggedIn: true });
    renderAt(history);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(history.location.pathname).toBe('/account');
    expect(history.location.search).toBe('?dev');
    expect(history.location.state).toBeUndefined();
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

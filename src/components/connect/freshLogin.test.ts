import { getCurrentScope, getIsolationScope } from '@sentry/browser';
import { LOG_OUT } from '../login/constants';
import { startFreshLoginFor } from './freshLogin';

describe('startFreshLoginFor', () => {
  const environment = process.env as { NODE_ENV?: string };
  const nodeEnvironment = environment.NODE_ENV;

  beforeEach(() => {
    environment.NODE_ENV = 'production';
  });

  afterEach(() => {
    environment.NODE_ENV = nodeEnvironment;
    jest.clearAllMocks();
    localStorage.clear();
  });

  const aConnectRequest = () => ({
    requestId: 'a-request-id',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  });

  it('ends the previous session, including who errors are reported for and what they did', () => {
    const dispatch = jest.fn();
    getIsolationScope().setUser({ id: 'the-previous-user' });
    getIsolationScope().addBreadcrumb({ category: 'navigation', data: { to: '/account' } });

    startFreshLoginFor(aConnectRequest(), dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT });
    expect(getIsolationScope().getUser()).toEqual({});
    expect(getIsolationScope().getScopeData().breadcrumbs).toStrictEqual([]);
  });

  it('reports errors of the next session on a trace of their own, unlinked from the previous one', () => {
    const previousTrace = getCurrentScope().getPropagationContext().traceId;

    startFreshLoginFor(aConnectRequest(), jest.fn());

    expect(getCurrentScope().getPropagationContext().traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(getCurrentScope().getPropagationContext().traceId).not.toBe(previousTrace);
  });
});

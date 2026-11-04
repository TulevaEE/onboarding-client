import { getCurrentScope, getIsolationScope } from '@sentry/browser';

import { LOG_OUT } from './constants';
import { endTheSession } from './endTheSession';

jest.mock('@sentry/browser', () => ({
  getCurrentScope: jest.fn(),
  getIsolationScope: jest.fn(),
}));

describe('endTheSession', () => {
  const originalEnvironment = process.env.NODE_ENV;

  beforeEach(() => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    (getCurrentScope as jest.Mock).mockReturnValue({ setPropagationContext: jest.fn() });
  });

  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = originalEnvironment as string;
  });

  it('forgets the person in error reports and logs out', () => {
    const setUser = jest.fn();
    const clearBreadcrumbs = jest.fn();
    (getIsolationScope as jest.Mock).mockReturnValue({ setUser, clearBreadcrumbs });
    const dispatch = jest.fn();

    endTheSession(dispatch);

    expect(setUser).toHaveBeenCalledWith(null);
    expect(clearBreadcrumbs).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT });
  });

  it('still logs out when error reporting cannot be reset', () => {
    (getIsolationScope as jest.Mock).mockImplementation(() => {
      throw new Error('error reporting is unavailable');
    });
    const dispatch = jest.fn();

    expect(() => endTheSession(dispatch)).toThrow('error reporting is unavailable');

    expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT });
  });
});

import { configureScope, Scope } from '@sentry/browser';
import { LOG_OUT } from '../login/constants';
import { startFreshLoginFor } from './freshLogin';

jest.mock('@sentry/browser', () => ({ configureScope: jest.fn() }));

describe('startFreshLoginFor', () => {
  const environment = process.env as { NODE_ENV?: string };
  const nodeEnvironment = environment.NODE_ENV;
  const scope = { clear: jest.fn() } as unknown as Scope;

  beforeEach(() => {
    (configureScope as jest.Mock).mockImplementation((clearIt) => clearIt(scope));
    environment.NODE_ENV = 'production';
  });

  afterEach(() => {
    environment.NODE_ENV = nodeEnvironment;
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('ends the previous session, including the user errors are reported for', () => {
    const dispatch = jest.fn();

    startFreshLoginFor(
      {
        requestId: 'a-request-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      },
      dispatch,
    );

    expect(dispatch).toHaveBeenCalledWith({ type: LOG_OUT });
    expect(scope.clear).toHaveBeenCalled();
  });
});

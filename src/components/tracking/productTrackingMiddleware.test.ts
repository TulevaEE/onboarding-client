import { AnyAction, Dispatch } from 'redux';
import { createAnonymousEvent, createTrackedEvent } from '../common/api';
import {
  GET_USER_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_SUCCESS,
} from '../login/constants';
import { productTrackingMiddleware } from './productTrackingMiddleware';

jest.mock('../common/api', () => ({
  createTrackedEvent: jest.fn(() => Promise.resolve()),
  createAnonymousEvent: jest.fn(() => Promise.resolve()),
}));

const next = jest.fn((action) => action) as unknown as Dispatch<AnyAction>;

const dispatch = (action: AnyAction) =>
  productTrackingMiddleware({ dispatch: jest.fn(), getState: jest.fn() })(next)(action);

describe('productTrackingMiddleware', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    (createTrackedEvent as jest.Mock).mockClear();
    (createAnonymousEvent as jest.Mock).mockClear();
  });

  it('sends how the login went once the person is logged in', () => {
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    dispatch({
      type: MOBILE_AUTHENTICATION_ERROR,
      error: { body: { errors: [{ code: 'smart.id.timeout' }] } },
    });
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    dispatch({ type: MOBILE_AUTHENTICATION_SUCCESS, method: 'SMART_ID' });
    dispatch({ type: GET_USER_SUCCESS, user: { id: 7 } });

    expect(createTrackedEvent).toHaveBeenCalledWith(
      'LOGIN_ATTEMPTS',
      expect.objectContaining({
        method: 'SMART_ID',
        starts: 2,
        failures: [{ kind: 'error', reason: 'smart.id.timeout' }],
      }),
    );
  });

  it('records login starts and failures of people who are not logged in yet', () => {
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    dispatch({
      type: MOBILE_AUTHENTICATION_ERROR,
      error: { body: { errors: [{ code: 'smart.id.timeout' }] } },
    });

    expect(createAnonymousEvent).toHaveBeenCalledWith('LOGIN_STARTED', {});
    expect(createAnonymousEvent).toHaveBeenCalledWith('LOGIN_FAILED', {
      kind: 'error',
      reason: 'smart.id.timeout',
    });
  });

  it('sends nothing about logins when the user is loaded from a saved session', () => {
    dispatch({ type: GET_USER_SUCCESS, user: { id: 7 } });

    expect(createTrackedEvent).not.toHaveBeenCalled();
  });

  it('sends the attribution once per new campaign, not on every load', () => {
    const touch = {
      source: 'meta',
      medium: 'paid_social',
      campaign: 'lapsele',
      content: null,
      term: null,
      clickId: 'fbclid',
      referrerHost: null,
      landingPath: '/lapsele-kogumine',
      at: new Date().toISOString(),
    };
    window.localStorage.setItem(
      'tuleva.attribution',
      JSON.stringify({ first: touch, last: touch }),
    );

    dispatch({ type: GET_USER_SUCCESS, user: { id: 7 } });
    dispatch({ type: GET_USER_SUCCESS, user: { id: 7 } });

    expect(createTrackedEvent).toHaveBeenCalledTimes(1);
    expect(createTrackedEvent).toHaveBeenCalledWith('ATTRIBUTION', { first: touch, last: touch });
  });
});

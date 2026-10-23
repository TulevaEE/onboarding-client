import { Dispatch } from 'redux';

import { getAuthentication, loginTimeOf } from '../common/authenticationManager';
import { endTheSession } from '../login/endTheSession';

const CONNECT_LOGINS_IN_FLIGHT = 'connectLoginsInFlight';

type ConnectLoginInFlight = {
  createdAt: string;
  expiresAt: string;
};

const ALLOWANCE_FOR_A_BROWSER_CLOCK_AHEAD_OF_THE_SERVER_MILLIS = 5 * 60 * 1000;

const isServerTime = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));
type ConnectLoginsInFlight = Record<string, ConnectLoginInFlight>;

const isConnectLoginInFlight = (value: unknown): value is ConnectLoginInFlight => {
  const login = value as Partial<ConnectLoginInFlight> | null;
  return isServerTime(login?.createdAt) && isServerTime(login?.expiresAt);
};

const hasNotExpired = ({ expiresAt }: ConnectLoginInFlight) =>
  Date.now() < Date.parse(expiresAt) + ALLOWANCE_FOR_A_BROWSER_CLOCK_AHEAD_OF_THE_SERVER_MILLIS;

const ownLoginOf = (
  logins: ConnectLoginsInFlight,
  requestId: string,
): ConnectLoginInFlight | undefined =>
  Object.prototype.hasOwnProperty.call(logins, requestId) ? logins[requestId] : undefined;

function storedLogins(): unknown {
  try {
    return JSON.parse(localStorage.getItem(CONNECT_LOGINS_IN_FLIGHT) ?? '{}');
  } catch (error) {
    return {};
  }
}

function save(logins: ConnectLoginsInFlight): boolean {
  try {
    if (Object.keys(logins).length === 0) {
      localStorage.removeItem(CONNECT_LOGINS_IN_FLIGHT);
    } else {
      localStorage.setItem(CONNECT_LOGINS_IN_FLIGHT, JSON.stringify(logins));
    }
    return true;
  } catch (error) {
    return false;
  }
}

function liveLogins(): ConnectLoginsInFlight {
  const stored = storedLogins();
  const entries = stored && typeof stored === 'object' ? Object.entries(stored) : [];
  const live = Object.fromEntries(
    entries.filter(([, login]) => isConnectLoginInFlight(login) && hasNotExpired(login)),
  );
  save(live);
  return live;
}

const wholeSecondOf = (millis: number) => Math.floor(millis / 1000) * 1000;

export function startFreshLoginFor(
  { requestId, createdAt, expiresAt }: { requestId: string; createdAt: string; expiresAt: string },
  dispatch: Dispatch,
): boolean {
  const recordKept = save({ ...liveLogins(), [requestId]: { createdAt, expiresAt } });
  if (recordKept) {
    endTheSession(dispatch);
  }
  return recordKept;
}

export function hasFreshLoginFor(requestId: string): boolean {
  const authentication = getAuthentication();
  const login = ownLoginOf(liveLogins(), requestId);
  const loginTime = loginTimeOf(authentication.accessToken);
  return (
    authentication.isAuthenticated() &&
    login !== undefined &&
    loginTime !== null &&
    loginTime >= wholeSecondOf(Date.parse(login.createdAt))
  );
}

export function hasALoginThatCannotCountFor(requestId: string): boolean {
  const authentication = getAuthentication();
  return (
    authentication.isAuthenticated() &&
    ownLoginOf(liveLogins(), requestId) !== undefined &&
    loginTimeOf(authentication.accessToken) === null
  );
}

export function forgetConnectLoginInFlight(requestId: string): void {
  save(Object.fromEntries(Object.entries(liveLogins()).filter(([id]) => id !== requestId)));
}

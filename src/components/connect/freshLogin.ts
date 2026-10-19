import { Dispatch } from 'redux';

import { getAuthentication } from '../common/authenticationManager';
import { endTheSession } from '../login/endTheSession';
import { parseJwt } from '../common/jwt';
import { connectPathOf, connectRequestIdOf } from './connectPath';

const CONNECT_LOGINS_IN_FLIGHT = 'connectLoginsInFlight';

type ConnectLoginInFlight = {
  startedAt: number;
  createdAt: string;
  expiresAt: string;
  steersTheCallback: boolean;
};

const ALLOWANCE_FOR_A_BROWSER_CLOCK_AHEAD_OF_THE_SERVER_MILLIS = 5 * 60 * 1000;

const isServerTime = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));
type ConnectLoginsInFlight = Record<string, ConnectLoginInFlight>;

const isConnectLoginInFlight = (value: unknown): value is ConnectLoginInFlight => {
  const login = value as Partial<ConnectLoginInFlight> | null;
  return (
    typeof login?.startedAt === 'number' &&
    isServerTime(login.createdAt) &&
    isServerTime(login.expiresAt) &&
    typeof login.steersTheCallback === 'boolean'
  );
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

function changeStorage(change: () => void): boolean {
  try {
    change();
    return true;
  } catch (error) {
    return false;
  }
}

function save(logins: ConnectLoginsInFlight): boolean {
  return changeStorage(() =>
    Object.keys(logins).length === 0
      ? localStorage.removeItem(CONNECT_LOGINS_IN_FLIGHT)
      : localStorage.setItem(CONNECT_LOGINS_IN_FLIGHT, JSON.stringify(logins)),
  );
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

function loginTimeOf(accessToken: unknown): number | null {
  try {
    const loginTime = Date.parse(parseJwt(accessToken as string).attributes.authTime);
    return Number.isNaN(loginTime) ? null : loginTime;
  } catch (error) {
    return null;
  }
}

const wholeSecondOf = (millis: number) => Math.floor(millis / 1000) * 1000;

export function startFreshLoginFor(
  { requestId, createdAt, expiresAt }: { requestId: string; createdAt: string; expiresAt: string },
  dispatch: Dispatch,
): boolean {
  const recordKept = save({
    ...liveLogins(),
    [requestId]: { startedAt: Date.now(), createdAt, expiresAt, steersTheCallback: true },
  });
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

export function stopSteeringTheCallbackTo(requestId: string): void {
  const logins = liveLogins();
  const login = ownLoginOf(logins, requestId);
  if (login) {
    save({ ...logins, [requestId]: { ...login, steersTheCallback: false } });
  }
}

export function noteALoginStartingFor(returnPath: string | undefined): void {
  const requestOfTheLogin = connectRequestIdOf(returnPath);
  save(
    Object.fromEntries(
      Object.entries(liveLogins()).map(([requestId, login]) => [
        requestId,
        { ...login, steersTheCallback: requestId === requestOfTheLogin },
      ]),
    ),
  );
}

export function connectPathOfTheLatestLoginInFlight(): string | undefined {
  const [latest] = Object.entries(liveLogins())
    .filter(([, login]) => login.steersTheCallback)
    .sort(([, one], [, other]) => other.startedAt - one.startedAt);
  return latest ? connectPathOf(latest[0]) : undefined;
}

export function forgetConnectLoginInFlight(requestId: string): void {
  save(Object.fromEntries(Object.entries(liveLogins()).filter(([id]) => id !== requestId)));
}

export function forgetAllConnectLoginsInFlight(): void {
  changeStorage(() => localStorage.removeItem(CONNECT_LOGINS_IN_FLIGHT));
}

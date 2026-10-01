import { LocationDescriptor } from 'history';
import { ACCOUNT_PATH } from '../paths';

export type LoginLandingState = { justLoggedIn: true };

const ACCOUNT_LANDING_PATHS = ['', '/', ACCOUNT_PATH, `${ACCOUNT_PATH}/`];

export function loginLanding(from: string | undefined): LocationDescriptor<LoginLandingState> {
  const [path, query] = (from ?? '').split('?');
  if (from && !ACCOUNT_LANDING_PATHS.includes(path)) {
    return from;
  }
  return {
    pathname: ACCOUNT_PATH,
    search: query ? `?${query}` : '',
    state: { justLoggedIn: true },
  };
}

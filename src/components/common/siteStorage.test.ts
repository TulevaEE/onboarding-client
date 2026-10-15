import { isSessionStorageBlocked } from './siteStorage';
import { blockSiteStorage } from '../../test/siteStorage';

const offerNoSessionStorage = (): (() => void) => {
  const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
  Object.defineProperty(window, 'sessionStorage', { value: null, configurable: true });
  return () => {
    if (original) {
      Object.defineProperty(window, 'sessionStorage', original);
    }
  };
};

describe('session storage', () => {
  let restoreSessionStorage = () => {};

  afterEach(() => {
    restoreSessionStorage();
    restoreSessionStorage = () => {};
  });

  it('is not blocked on a browser that keeps it', () => {
    expect(isSessionStorageBlocked()).toBe(false);
  });

  it('is blocked when the browser refuses access to it', () => {
    restoreSessionStorage = blockSiteStorage();

    expect(isSessionStorageBlocked()).toBe(true);
  });

  it('is not blocked on a browser that offers none, where cookies may still work', () => {
    restoreSessionStorage = offerNoSessionStorage();

    expect(isSessionStorageBlocked()).toBe(false);
  });
});

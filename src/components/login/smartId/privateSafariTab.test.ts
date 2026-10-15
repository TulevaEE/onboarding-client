import { inAPrivateSafariTab } from './privateSafariTab';

describe('telling a private Safari tab from a normal one', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(navigator, 'storage');

  const giveTheBrowserStorage = (storage: unknown) =>
    Object.defineProperty(navigator, 'storage', { value: storage, configurable: true });

  afterEach(() => {
    if (originalStorage) {
      Object.defineProperty(navigator, 'storage', originalStorage);
    } else {
      delete (navigator as { storage?: unknown }).storage;
    }
  });

  const safariPrivateTabRefusal = () =>
    new Error('The operation failed for an unknown transient reason (e.g. out of memory).');

  it('is a private tab when Safari refuses the origin private file system for an unknown transient reason', async () => {
    giveTheBrowserStorage({ getDirectory: () => Promise.reject(safariPrivateTabRefusal()) });

    expect(await inAPrivateSafariTab()).toBe(true);
  });

  it('is a normal tab when the browser hands out the origin private file system', async () => {
    giveTheBrowserStorage({ getDirectory: () => Promise.resolve({}) });

    expect(await inAPrivateSafariTab()).toBe(false);
  });

  it('is not taken for a private tab when the file system is refused for another reason', async () => {
    giveTheBrowserStorage({
      getDirectory: () => Promise.reject(new Error('The request is insecure.')),
    });

    expect(await inAPrivateSafariTab()).toBe(false);
  });

  it('is not taken for a private tab when the browser has no origin private file system', async () => {
    giveTheBrowserStorage({});

    expect(await inAPrivateSafariTab()).toBe(false);
  });

  it('is not taken for a private tab when the browser has no storage manager', async () => {
    giveTheBrowserStorage(undefined);

    expect(await inAPrivateSafariTab()).toBe(false);
  });
});

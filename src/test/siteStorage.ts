type SiteStorage = 'sessionStorage' | 'localStorage';

const blockStorage = (storage: SiteStorage): (() => void) => {
  const original = Object.getOwnPropertyDescriptor(window, storage);
  const windowPrototype = Object.getPrototypeOf(window);
  // Jest's jsdom reads a throwing getter on the window itself as undefined; on its prototype it throws, as in browsers.
  delete (window as Partial<Record<SiteStorage, Storage>>)[storage];
  Object.defineProperty(windowPrototype, storage, {
    configurable: true,
    get: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  });
  return () => {
    delete windowPrototype[storage];
    if (original) {
      Object.defineProperty(window, storage, original);
    }
  };
};

export const blockSiteStorage = (): (() => void) => {
  const unblockers = [blockStorage('sessionStorage'), blockStorage('localStorage')];
  return () => unblockers.forEach((unblock) => unblock());
};

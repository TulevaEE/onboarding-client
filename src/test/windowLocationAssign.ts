export const replaceWindowLocationAssign = (assign: (url: string) => void): (() => void) => {
  const realLocation = window.location;
  const { href, origin, protocol, host, hostname, port, pathname, search, hash } = realLocation;
  Object.defineProperty(window, 'location', {
    value: { href, origin, protocol, host, hostname, port, pathname, search, hash, assign },
    writable: true,
    configurable: true,
  });
  return () =>
    Object.defineProperty(window, 'location', {
      value: realLocation,
      writable: true,
      configurable: true,
    });
};

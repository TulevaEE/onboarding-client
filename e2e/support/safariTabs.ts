export function behaveLikeANormalSafariTab(): void {
  if (typeof StorageManager !== 'undefined') {
    Object.defineProperty(StorageManager.prototype, 'getDirectory', {
      value: () => Promise.resolve({}),
      configurable: true,
    });
  }
}

type StorageChange = 'setItem' | 'removeItem';

export const refuseLocalStorageChangesTo = (key: string, change: StorageChange): void => {
  const realChange = Storage.prototype[change];
  jest.spyOn(Storage.prototype, change).mockImplementation(function refuse(
    this: Storage,
    ...args: any[]
  ) {
    if (this === localStorage && args[0] === key) {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    }
    return realChange.apply(this, args as [string, string]);
  });
};

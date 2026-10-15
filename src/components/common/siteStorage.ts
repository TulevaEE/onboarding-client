export const withSessionStorage = <T>(use: (storage: Storage) => T, whenUnavailable: T): T => {
  try {
    return use(window.sessionStorage);
  } catch (error) {
    return whenUnavailable;
  }
};

export const isSessionStorageBlocked = (): boolean => withSessionStorage(() => false, true);

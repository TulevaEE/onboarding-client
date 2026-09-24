export const HANDOVER_TOKEN_STORAGE_KEY = 'handoverToken';

const withSessionStorage = <T>(use: (storage: Storage) => T, whenUnavailable: T): T => {
  try {
    return use(window.sessionStorage);
  } catch (error) {
    return whenUnavailable;
  }
};

export const storedHandoverToken = (): string | undefined =>
  withSessionStorage(
    (storage) => storage.getItem(HANDOVER_TOKEN_STORAGE_KEY) ?? undefined,
    undefined,
  );

export const forgetHandoverToken = (): void =>
  withSessionStorage((storage) => storage.removeItem(HANDOVER_TOKEN_STORAGE_KEY), undefined);

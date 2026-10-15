import { withSessionStorage } from '../common/siteStorage';

export const HANDOVER_TOKEN_STORAGE_KEY = 'handoverToken';

export const storedHandoverToken = (): string | undefined =>
  window.handoverToken ??
  withSessionStorage(
    (storage) => storage.getItem(HANDOVER_TOKEN_STORAGE_KEY) ?? undefined,
    undefined,
  );

export const forgetHandoverToken = (): void => {
  delete window.handoverToken;
  withSessionStorage((storage) => storage.removeItem(HANDOVER_TOKEN_STORAGE_KEY), undefined);
};

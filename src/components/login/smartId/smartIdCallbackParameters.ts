import { SmartIdLoginCallback } from '../../common/apiModels';

const STORAGE_KEY = 'smartIdCallback';

type CallbackParameters = { [Name in keyof SmartIdLoginCallback]?: string | null };

const toCallback = ({
  value,
  sessionSecretDigest,
  userChallengeVerifier,
}: CallbackParameters): SmartIdLoginCallback | null =>
  value && sessionSecretDigest && userChallengeVerifier
    ? { value, sessionSecretDigest, userChallengeVerifier }
    : null;

const withSessionStorage = <T>(use: (storage: Storage) => T, whenUnavailable: T): T => {
  try {
    return use(window.sessionStorage);
  } catch (error) {
    return whenUnavailable;
  }
};

const stashedCallback = (): SmartIdLoginCallback | null =>
  withSessionStorage(
    (storage) => toCallback(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') ?? {}),
    null,
  );

const callbackInQuery = (search: string): SmartIdLoginCallback | null => {
  const parameters = new URLSearchParams(search);
  return toCallback({
    value: parameters.get('value'),
    sessionSecretDigest: parameters.get('sessionSecretDigest'),
    userChallengeVerifier: parameters.get('userChallengeVerifier'),
  });
};

export const smartIdCallbackParameters = (search: string): SmartIdLoginCallback | null =>
  stashedCallback() ?? callbackInQuery(search);

export const forgetSmartIdCallbackParameters = (): void =>
  withSessionStorage((storage) => storage.removeItem(STORAGE_KEY), undefined);

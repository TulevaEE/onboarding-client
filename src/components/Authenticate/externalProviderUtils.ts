const EXTERNAL_AUTHENTICATOR_PROVIDER = 'EXTERNAL_AUTHENTICATOR_PROVIDER';
const EXTERNAL_AUTHENTICATOR_REDIRECT_URI = 'EXTERNAL_AUTHENTICATOR_REDIRECT_URI';

enum ExternalProvider {
  PROVIDER1 = 'provider1',
  PROVIDER2 = 'provider2',
}

const stringToProvider: Record<string, ExternalProvider> = Object.fromEntries(
  Object.entries(ExternalProvider).map(([key, value]) => [
    value as string,
    key as ExternalProvider,
  ]),
);
const validateProvider = (value?: unknown): ExternalProvider => {
  if (value && typeof value === 'string' && stringToProvider[value]) {
    return stringToProvider[value];
  }
  throw new Error(`Invalid provider: ${value}`);
};
const validateUri = (_provider: ExternalProvider, uri?: unknown) => {
  if (uri && typeof uri === 'string') {
    return uri;
  }
  throw new Error('Redirect URI missing');
};

export const finish = (_result: any, _error: any) => {
  const provider = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_PROVIDER);
  const redirectUri = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI);
  // somehow differentiate between success and error results
  console.log('finishing', provider, 'flow and redirecting to', redirectUri, _result, _error);
};

export const init = (inputProvider?: unknown, redirectUri?: unknown): void => {
  const provider = validateProvider(inputProvider);
  // TODO: validate provider and redirectUri
  sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, provider);
  sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI, validateUri(provider, redirectUri));
};

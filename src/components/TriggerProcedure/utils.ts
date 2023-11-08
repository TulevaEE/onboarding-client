const EXTERNAL_AUTHENTICATOR_PROVIDER = 'EXTERNAL_AUTHENTICATOR_PROVIDER';
const EXTERNAL_AUTHENTICATOR_REDIRECT_URI = 'EXTERNAL_AUTHENTICATOR_REDIRECT_URI';

enum ExternalProvider {
  TESTPROVIDER1 = 'testprovider1',
}
enum Procedure {
  PARTNER_3RD_PILLAR = 'partner-3rd-pillar-flow',
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

const validateProcedure = (value?: unknown): Procedure => {
  if (value && typeof value === 'string' && value === Procedure.PARTNER_3RD_PILLAR) {
    return Procedure.PARTNER_3RD_PILLAR;
  }
  throw new Error(`Invalid procedure: ${value}`);
};

const validateUri = (_provider: ExternalProvider, uri?: unknown) => {
  if (uri && typeof uri === 'string') {
    const url = new URL(uri);
    return url.toString();
  }
  throw new Error('Redirect URI missing');
};

const validateHandoverToken = (value?: unknown) => {
  if (value && typeof value === 'string') {
    return value;
  }
  throw new Error(`Invalid handoverToken: ${value}`);
};

const getPath = (provider: ExternalProvider, procedure: Procedure) => {
  if (procedure === Procedure.PARTNER_3RD_PILLAR) {
    return '/partner/3rd-pillar-flow';
  }
  throw new Error(`Invalid procedure for provider(${provider}): ${procedure}`);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any -- WIP
export const finish = (result?: string, error?: string) => {
  const provider = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_PROVIDER);
  const redirectUri = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI);

  if (!provider) {
    // eslint-disable-next-line no-console -- WIP
    console.error('unexpected state: no provider');
    return;
  }

  if (!redirectUri) {
    // eslint-disable-next-line no-console -- WIP
    console.error('unexpected state: no redirectUri');
    return;
  }

  const url = new URL(redirectUri);
  if (error) {
    url.searchParams.set('error', error);
  } else if (result) {
    url.searchParams.set('result', result);
  }
  // eslint-disable-next-line no-console -- WIP
  console.log('finishing', provider, 'and redirecting to', redirectUri, result, error);
  window.location.href = url.toString();
};

export const init = (input: {
  provider?: unknown;
  redirectUri?: unknown;
  handoverToken?: unknown;
  procedure?: unknown;
}): {
  provider: ExternalProvider;
  redirectUri: string;
  handoverToken: string;
  procedure: Procedure;
  path: string;
} => {
  const provider = validateProvider(input.provider);
  const redirectUri = validateUri(provider, input.redirectUri);
  const procedure = validateProcedure(input.procedure);
  const handoverToken = validateHandoverToken(input.handoverToken);

  sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, provider);
  sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI, redirectUri);

  return {
    provider,
    redirectUri,
    procedure,
    handoverToken,
    path: getPath(provider, procedure),
  };
};

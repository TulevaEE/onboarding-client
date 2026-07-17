import { getPaymentLink } from '../common/api';
import { getAuthentication } from '../common/authenticationManager';

const EXTERNAL_AUTHENTICATOR_PROVIDER = 'EXTERNAL_AUTHENTICATOR_PROVIDER';
export const EXTERNAL_AUTHENTICATOR_REDIRECT_URI = 'EXTERNAL_AUTHENTICATOR_REDIRECT_URI';

enum ExternalProvider {
  COOP_PANK = 'COOP_PANK',
}

enum Procedure {
  PARTNER_2ND_PILLAR_FLOW = 'partner-2nd-pillar-flow',
  PARTNER_3RD_PILLAR_FLOW = 'partner-3rd-pillar-flow',
  ACCOUNT = 'account',
  SECOND_PILLAR_PAYMENT_RATE = '2nd-pillar-payment-rate',
}

const procedureToPath = new Map<Procedure, string>([
  [Procedure.PARTNER_2ND_PILLAR_FLOW, '/partner/2nd-pillar-flow'],
  [Procedure.PARTNER_3RD_PILLAR_FLOW, '/partner/3rd-pillar-flow'],
  [Procedure.ACCOUNT, '/account'],
  [Procedure.SECOND_PILLAR_PAYMENT_RATE, '/2nd-pillar-payment-rate'],
]);

const stringToProvider: Record<string, ExternalProvider> = Object.fromEntries(
  Object.entries(ExternalProvider).map(([key, value]) => [
    value as string,
    key as ExternalProvider,
  ]),
);

const stringToProcedure: Record<string, Procedure> = Object.fromEntries(
  Object.entries(Procedure).map(([key, value]) => [value as string, key as Procedure]),
);

const validateProvider = (value?: unknown): ExternalProvider => {
  if (value && typeof value === 'string' && stringToProvider[value]) {
    return value as ExternalProvider;
  }
  throw new Error(`Invalid provider: ${value}`);
};

const validateProcedure = (value?: unknown): Procedure => {
  if (value && typeof value === 'string' && stringToProcedure[value]) {
    return value as Procedure;
  }
  throw new Error(`Invalid procedure: ${value}`);
};

const validateHandoverToken = (value?: unknown) => {
  if (value && typeof value === 'string') {
    return value;
  }
  throw new Error(`Invalid handoverToken: ${value}`);
};

const getPath = (provider: ExternalProvider, procedure: Procedure): string => {
  if (procedureToPath.has(procedure)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return procedureToPath.get(procedure)!;
  }
  throw new Error(`Invalid procedure for provider(${provider}): ${procedure}`);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const finish = async (result?: string, error?: string, personalCode?: string) => {
  const provider = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_PROVIDER);
  const redirectUri = sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webView = (window as any).ReactNativeWebView;

  if (webView && error) {
    sendMessage({ errorMessage: error, time: new Date().toISOString() });
  }
  if (!result) {
    return;
  }

  if (!provider) {
    throw new Error('unexpected state: no provider');
  }
  if (!getAuthentication().isAuthenticated() || !personalCode) {
    throw new Error('unexpected state: no token/personal code');
  }

  const paymentType = result === 'newRecurringPayment' ? 'RECURRING' : 'SINGLE';

  if (webView) {
    const paymentLink = await getPaymentLink({
      type: paymentType,
      paymentChannel: 'PARTNER',
      recipientPersonalCode: personalCode,
    });
    if (!paymentLink.url) {
      throw new Error(`Payment link for partner flow (${paymentType}) is missing url`);
    }
    const message = {
      type: result,
      version: '1',
      data: JSON.parse(paymentLink.url),
      time: new Date().toISOString(),
    };

    // eslint-disable-next-line no-console -- WIP
    console.log('finishing', provider, result, error, 'and posting message', message);

    sendMessage(message);
  } else {
    const paymentLink = await getPaymentLink({
      type: paymentType,
      paymentChannel: 'COOP_WEB',
      recipientPersonalCode: personalCode,
    });
    if (!paymentLink.url) {
      throw new Error(`Payment link for COOP_WEB (${paymentType}) is missing url`);
    }
    // eslint-disable-next-line no-console -- WIP
    console.log(
      'finishing',
      provider,
      result,
      error,
      'and redirecting to',
      (redirectUri ?? '') + paymentLink.url,
    );

    window.location.href = (redirectUri ?? '') + paymentLink.url;
  }
};

const sendMessage = (message: {
  data?: unknown;
  errorMessage?: string;
  errorCode?: string;
  time?: string;
  type?: string;
  version?: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
};

export const init = (query: {
  provider?: unknown;
  redirectUri?: string;
  handoverToken?: unknown;
  procedure?: unknown;
}): {
  redirectUri: string | undefined;
  handoverToken: string;
  path: string;
  provider: ExternalProvider;
  procedure: Procedure;
} => {
  const provider = validateProvider(query.provider);
  const procedure = validateProcedure(query.procedure);
  const handoverToken = validateHandoverToken(query.handoverToken);

  sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, provider);
  sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI, query.redirectUri || '');

  return {
    provider,
    redirectUri: query.redirectUri,
    procedure,
    handoverToken,
    path: getPath(provider, procedure),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseJwt = (token: string): any => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  );

  return JSON.parse(jsonPayload);
};

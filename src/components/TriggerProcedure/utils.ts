import config from 'react-global-configuration';
import { getPaymentLink } from '../common/api';
import { getAuthentication, isLoggedInThroughPartner } from '../common/authenticationManager';
import { withSessionStorage } from '../common/siteStorage';

export const EXTERNAL_AUTHENTICATOR_PROVIDER = 'EXTERNAL_AUTHENTICATOR_PROVIDER';

enum ExternalProvider {
  COOP_PANK = 'COOP_PANK',
}

const INTERNET_BANK_CONFIG_KEY: Record<ExternalProvider, string> = {
  [ExternalProvider.COOP_PANK]: 'coopInternetBankUrl',
};

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

const isExternalProvider = (value: unknown): value is ExternalProvider =>
  (Object.values(ExternalProvider) as unknown[]).includes(value);

const isProcedure = (value: unknown): value is Procedure =>
  (Object.values(Procedure) as unknown[]).includes(value);

const validateProvider = (value?: unknown): ExternalProvider => {
  if (isExternalProvider(value)) {
    return value;
  }
  throw new Error(`Invalid provider: ${value}`);
};

const validateProcedure = (value?: unknown): Procedure => {
  if (isProcedure(value)) {
    return value;
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

export const rememberPartner = (provider: ExternalProvider): void =>
  withSessionStorage(
    (storage) => storage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, provider),
    undefined,
  );

const rememberedPartner = (): ExternalProvider | null => {
  const provider = withSessionStorage(
    (storage) => storage.getItem(EXTERNAL_AUTHENTICATOR_PROVIDER),
    null,
  );
  return isExternalProvider(provider) ? provider : null;
};

export const partnerInternetBank = (): string | null => {
  const provider = rememberedPartner();
  return provider && isLoggedInThroughPartner()
    ? config.get(INTERNET_BANK_CONFIG_KEY[provider])
    : null;
};

export const isInPartnerApp = (): boolean =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Boolean((window as any).ReactNativeWebView);

const internetBankAddress = (internetBank: string, paymentLinkUrl: string): string => {
  const destination = new URL(paymentLinkUrl, internetBank);
  if (destination.origin !== new URL(internetBank).origin) {
    throw new Error(
      `Payment link for COOP_WEB leads away from the internet bank: ${destination.origin}`,
    );
  }
  return destination.href;
};

export const isInPartnerSession = (): boolean => partnerInternetBank() !== null;

type PartnerPaymentType = 'SINGLE' | 'RECURRING';

const PARTNER_APP_MESSAGE_TYPE: Record<PartnerPaymentType, string> = {
  SINGLE: 'newPayment',
  RECURRING: 'newRecurringPayment',
};

export const handOverPaymentToPartner = async (
  paymentType: PartnerPaymentType,
  personalCode: string,
  amount?: number,
): Promise<void> => {
  const internetBank = partnerInternetBank();
  if (!internetBank) {
    throw new Error('unexpected state: no partner session');
  }
  if (!getAuthentication().isAuthenticated()) {
    throw new Error('unexpected state: no token/personal code');
  }
  const amountInEuros = amount === undefined ? {} : { amount, currency: 'EUR' as const };

  if (isInPartnerApp()) {
    const paymentLink = await getPaymentLink({
      type: paymentType,
      paymentChannel: 'PARTNER',
      recipientPersonalCode: personalCode,
      ...amountInEuros,
    });
    if (!paymentLink.url) {
      throw new Error(`Payment link for partner flow (${paymentType}) is missing url`);
    }
    sendMessage({
      type: PARTNER_APP_MESSAGE_TYPE[paymentType],
      version: '1',
      data: JSON.parse(paymentLink.url),
      time: new Date().toISOString(),
    });
  } else {
    const paymentLink = await getPaymentLink({
      type: paymentType,
      paymentChannel: 'COOP_WEB',
      recipientPersonalCode: personalCode,
      ...amountInEuros,
    });
    if (!paymentLink.url) {
      throw new Error(`Payment link for COOP_WEB (${paymentType}) is missing url`);
    }
    window.location.href = internetBankAddress(internetBank, paymentLink.url);
  }
};

export const finish = async (
  result?: string,
  error?: string,
  personalCode?: string,
): Promise<void> => {
  if (isInPartnerApp() && error) {
    sendMessage({ errorMessage: error, time: new Date().toISOString() });
  }
  if (!result) {
    return;
  }
  if (!isInPartnerSession()) {
    throw new Error('unexpected state: no partner session');
  }
  if (!personalCode) {
    throw new Error('unexpected state: no token/personal code');
  }
  await handOverPaymentToPartner(
    result === 'newRecurringPayment' ? 'RECURRING' : 'SINGLE',
    personalCode,
  );
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
  handoverToken?: unknown;
  procedure?: unknown;
}): {
  handoverToken: string;
  path: string;
  provider: ExternalProvider;
  procedure: Procedure;
} => {
  const provider = validateProvider(query.provider);
  const procedure = validateProcedure(query.procedure);
  const handoverToken = validateHandoverToken(query.handoverToken);

  return {
    provider,
    procedure,
    handoverToken,
    path: getPath(provider, procedure),
  };
};

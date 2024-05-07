import config from 'react-global-configuration';
import {
  AmlCheck,
  Application,
  Authentication,
  CancellationMandate,
  CapitalEvent,
  CapitalRow,
  Contribution,
  Fund,
  FundBalance,
  IdCardSignatureResponse,
  LoginMethod,
  Mandate,
  MandateDeadlines,
  MobileSignatureResponse,
  MobileSignatureStatusResponse,
  Payment,
  PaymentLink,
  PaymentType,
  SourceFund,
  Token,
  Transaction,
  User,
  UserConversion,
} from './apiModels';
import {
  downloadFileWithAuthentication,
  getWithAuthentication,
  patchWithAuthentication,
  post,
  postForm,
  postWithAuthentication,
  putWithAuthentication,
  simpleFetch,
} from './http';
import { getAuthentication } from './authenticationManager';

const API_URI = '/api';

export function getEndpoint(endpoint: string): string {
  // in production, we proxy through a proxy endpoint at /proxy.
  // in development, we proxy through webpack dev server without the prefix.
  if (process.env.NODE_ENV === 'production') {
    const API_BASEPATH = config && config.get('applicationUrl') ? config.get('applicationUrl') : '';
    return `${API_BASEPATH}${API_URI}${endpoint}`;
  }
  if (process.env.NODE_ENV === 'test') {
    const API_BASEPATH = config && config.get('applicationUrl') ? config.get('applicationUrl') : '';
    return `${API_BASEPATH}${endpoint}`;
  }
  return endpoint;
}

export async function authenticateWithMobileId(
  phoneNumber: string,
  personalCode: string,
): Promise<string> {
  const { challengeCode } = await post(getEndpoint('/authenticate'), {
    phoneNumber,
    personalCode,
    type: 'MOBILE_ID',
  });
  return challengeCode;
}

export async function authenticateWithIdCode(personalCode: string): Promise<Authentication> {
  const { challengeCode, authenticationHash } = await post(getEndpoint('/authenticate'), {
    personalCode,
    type: 'SMART_ID',
  });
  return { challengeCode, authenticationHash };
}

export async function authenticateWithIdCard(): Promise<boolean> {
  await simpleFetch('GET', config.get('idCardUrl')); // http://stackoverflow.com/a/16818527
  const { success } = await simpleFetch('POST', `${config.get('idCardUrl')}/idLogin`);
  return success;
}

export function logout(): Promise<void> {
  const request = getWithAuthentication(getEndpoint('/v1/logout'), {});
  getAuthentication().remove();
  return request;
}

export async function getTokensWithGrantType(
  grantType: LoginMethod,
  extraParameters: Record<string, string> = {},
): Promise<Token | null> {
  try {
    const { access_token: accessToken, refresh_token: refreshToken } = await postForm(
      getEndpoint('/oauth/token'),
      {
        grant_type: grantType,
        client_id: 'onboarding-client',
        ...extraParameters,
      },
      {
        Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=',
      },
    );

    getAuthentication().update({
      accessToken,
      refreshToken,
      loginMethod: grantType,
    });
    return { accessToken, refreshToken };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.error !== 'AUTHENTICATION_NOT_COMPLETE') {
      throw error;
    }
    return null;
  }
}

export function getMobileIdTokens(): Promise<Token | null> {
  return getTokensWithGrantType('MOBILE_ID');
}

export function getSmartIdTokens(authenticationHash: string): Promise<Token | null> {
  return getTokensWithGrantType('SMART_ID', { authenticationHash });
}

export function getIdCardTokens(): Promise<Token | null> {
  return getTokensWithGrantType('ID_CARD');
}

export function downloadMandatePreviewWithId(mandateId: string): Promise<Blob> {
  return downloadFileWithAuthentication(getEndpoint(`/v1/mandates/${mandateId}/file/preview`));
}

export function downloadMandateWithId(mandateId: string): Promise<Blob> {
  return downloadFileWithAuthentication(getEndpoint(`/v1/mandates/${mandateId}/file`));
}

export function getUserWithToken(): Promise<User> {
  return getWithAuthentication(getEndpoint('/v1/me'), undefined);
}

export async function getSourceFunds(): Promise<SourceFund[]> {
  const funds = await getWithAuthentication(
    getEndpoint('/v1/pension-account-statement'),
    undefined,
  );
  return funds.map(transformFundBalance);
}

const transformFundBalance = (fundBalance: FundBalance): SourceFund => ({
  isin: fundBalance.fund.isin,
  price: fundBalance.value,
  unavailablePrice: fundBalance.unavailableValue,
  activeFund: fundBalance.activeContributions,
  currency: fundBalance.currency || 'EUR',
  name: fundBalance.fund.name,
  fundManager: fundBalance.fund.fundManager,
  managementFeePercent: +(fundBalance.fund.managementFeeRate * 100).toFixed(2).replace(/0+$/, ''),
  pillar: fundBalance.fund.pillar,
  ongoingChargesFigure: fundBalance.fund.ongoingChargesFigure,
  contributions: fundBalance.contributions,
  subtractions: fundBalance.subtractions,
  profit: fundBalance.profit,
});

export function saveMandateWithAuthentication(mandate: string): Promise<Mandate> {
  return postWithAuthentication(getEndpoint('/v1/mandates'), mandate);
}

export async function getMobileIdSignatureChallengeCode(
  mandateId: string,
): Promise<MobileSignatureResponse> {
  const { challengeCode } = await putWithAuthentication(
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId`),
    undefined,
  );
  return challengeCode;
}

export async function getMobileIdSignatureStatus(
  mandateId: string,
): Promise<MobileSignatureStatusResponse> {
  return getWithAuthentication(
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId/status`),
    undefined,
  );
}

export async function getSmartIdSignatureChallengeCode(
  mandateId: string,
): Promise<MobileSignatureResponse> {
  const { challengeCode } = await putWithAuthentication(
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId`),
    undefined,
  );
  return challengeCode;
}

export async function getSmartIdSignatureStatus(
  mandateId: string,
): Promise<MobileSignatureStatusResponse> {
  return getWithAuthentication(
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId/status`),
    undefined,
  );
}

export async function getIdCardSignatureHash(
  mandateId: string,
  certificateHex: string,
): Promise<IdCardSignatureResponse> {
  const { hash } = await putWithAuthentication(
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard`),
    { clientCertificate: certificateHex },
  );
  return hash;
}

export async function getIdCardSignatureStatus(
  mandateId: string,
  signedHash: string,
): Promise<string> {
  const { statusCode } = await putWithAuthentication(
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard/status`),
    { signedHash },
  );
  return statusCode;
}

export function updateUserWithToken(user: User): Promise<User> {
  return patchWithAuthentication(getEndpoint('/v1/me'), user);
}

export function getUserConversionWithToken(): Promise<UserConversion> {
  return getWithAuthentication(getEndpoint('/v1/me/conversion'), undefined);
}

export function getCapitalRowsWithToken(): Promise<CapitalRow[]> {
  return getWithAuthentication(getEndpoint('/v2/me/capital'), undefined);
}

export function createAmlCheck(
  type: string,
  success: boolean,
  metadata: Record<string, unknown>,
): Promise<AmlCheck> {
  return postWithAuthentication(getEndpoint('/v1/amlchecks'), {
    type,
    success,
    metadata,
  });
}

export function getMissingAmlChecks(): Promise<AmlCheck[]> {
  return getWithAuthentication(getEndpoint('/v1/amlchecks'), undefined);
}

export function getFunds(): Promise<Fund[]> {
  return getWithAuthentication(getEndpoint('/v1/funds'));
}

export function getPendingApplications(): Promise<Application[]> {
  return getWithAuthentication(getEndpoint('/v1/applications'), {
    status: 'PENDING',
  });
}

export function getTransactions(): Promise<Transaction[]> {
  return getWithAuthentication(getEndpoint('/v1/transactions'), undefined);
}

export function getCapitalEvents(): Promise<CapitalEvent[]> {
  return getWithAuthentication(getEndpoint('/v1/me/capital/events'), undefined);
}

export function getContributions(): Promise<Contribution[]> {
  return getWithAuthentication(getEndpoint('/v1/contributions'), undefined);
}

export function getMandateDeadlines(): Promise<MandateDeadlines> {
  return getWithAuthentication(getEndpoint('/v1/mandate-deadlines'), undefined);
}

export function createApplicationCancellation(applicationId: number): Promise<CancellationMandate> {
  return postWithAuthentication(getEndpoint(`/v1/applications/${applicationId}/cancellations`), {});
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createTrackedEvent(type: string, data: Record<string, unknown>): Promise<any> {
  return postWithAuthentication(getEndpoint('/v1/t'), { type, data });
}

export function getPaymentLink(payment: Payment): Promise<PaymentLink> {
  return getWithAuthentication(getEndpoint('/v1/payments/link'), payment);
}

export function redirectToPayment(payment: Payment): void {
  const wndw = getWindow(payment.type);
  getPaymentLink(payment).then((paymentLink) => {
    wndw.location.replace(paymentLink.url);
  });
}

function getWindow(paymentType: PaymentType): Window {
  if (paymentType !== PaymentType.RECURRING) {
    return window;
  }
  const newWindow = window.open('', '_blank'); // this might be blocked by popup blockers
  if (newWindow == null) {
    return window;
  }
  newWindow.document.write('Loading...');
  return newWindow;
}

import config from 'react-global-configuration';
import {
  AmlCheck,
  Application,
  Authentication,
  CancellationMandate,
  Contribution,
  Fund,
  FundBalance,
  IdCardSignatureResponse,
  InitialCapital,
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
import { UpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal';

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

export function logout(authenticationPrincipal: UpdatableAuthenticationPrincipal): Promise<void> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/logout'), {});
}

export async function getTokensWithGrantType(
  grantType: string,
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

export function downloadMandatePreviewWithIdAndToken(
  mandateId: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Blob> {
  return downloadFileWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/file/preview`),
  );
}

export function downloadMandateWithIdAndToken(
  mandateId: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Blob> {
  return downloadFileWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/file`),
  );
}

export function getUserWithToken(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<User> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/me'), undefined);
}

export async function getSourceFundsWithToken(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<SourceFund[]> {
  const funds = await getWithAuthentication(
    authenticationPrincipal,
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

export function saveMandateWithToken(
  mandate: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Mandate> {
  return postWithAuthentication(authenticationPrincipal, getEndpoint('/v1/mandates'), mandate);
}

export async function getMobileIdSignatureChallengeCode(
  mandateId: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<MobileSignatureResponse> {
  const { challengeCode } = await putWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId`),
    undefined,
  );
  return challengeCode;
}

export async function getMobileIdSignatureStatus(
  mandateId: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<MobileSignatureStatusResponse> {
  return getWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId/status`),
    undefined,
  );
}

export async function getSmartIdSignatureChallengeCode(
  mandateId: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<MobileSignatureResponse> {
  const { challengeCode } = await putWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId`),
    undefined,
  );
  return challengeCode;
}

export async function getSmartIdSignatureStatus(
  mandateId: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<MobileSignatureStatusResponse> {
  return getWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId/status`),
    undefined,
  );
}

export async function getIdCardSignatureHash(
  mandateId: string,
  certificateHex: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<IdCardSignatureResponse> {
  const { hash } = await putWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard`),
    { clientCertificate: certificateHex },
  );
  return hash;
}

export async function getIdCardSignatureStatus(
  mandateId: string,
  signedHash: string,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<string> {
  const { statusCode } = await putWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard/status`),
    { signedHash },
  );
  return statusCode;
}

export function updateUserWithToken(
  user: User,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<User> {
  return patchWithAuthentication(authenticationPrincipal, getEndpoint('/v1/me'), user);
}

export function getUserConversionWithToken(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<UserConversion> {
  return getWithAuthentication(
    authenticationPrincipal,
    getEndpoint('/v1/me/conversion'),
    undefined,
  );
}

export function getInitialCapitalWithToken(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<InitialCapital> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/me/capital'), undefined);
}

export function createAmlCheck(
  type: string,
  success: boolean,
  metadata: Record<string, unknown>,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<AmlCheck> {
  return postWithAuthentication(authenticationPrincipal, getEndpoint('/v1/amlchecks'), {
    type,
    success,
    metadata,
  });
}

export function getMissingAmlChecks(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<AmlCheck[]> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/amlchecks'), undefined);
}

export function getFunds(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Fund[]> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/funds'));
}

export function getPendingApplications(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Application[]> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/applications'), {
    status: 'PENDING',
  });
}

export function getTransactions(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Transaction[]> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/transactions'), undefined);
}

export function getContributions(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<Contribution[]> {
  return getWithAuthentication(
    authenticationPrincipal,
    getEndpoint('/v1/contributions'),
    undefined,
  );
}

export function getMandateDeadlines(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<MandateDeadlines> {
  return getWithAuthentication(
    authenticationPrincipal,
    getEndpoint('/v1/mandate-deadlines'),
    undefined,
  );
}

export function createApplicationCancellation(
  applicationId: number,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<CancellationMandate> {
  return postWithAuthentication(
    authenticationPrincipal,
    getEndpoint(`/v1/applications/${applicationId}/cancellations`),
    {},
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createTrackedEvent(
  type: string,
  data: Record<string, unknown>,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<any> {
  return postWithAuthentication(authenticationPrincipal, getEndpoint('/v1/t'), { type, data });
}

export function getPaymentLink(
  payment: Payment,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<PaymentLink> {
  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/payments/link'), payment);
}

export function redirectToPayment(
  payment: Payment,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): void {
  const wndw = getWindow(payment.type);
  getPaymentLink(payment, authenticationPrincipal).then((paymentLink) => {
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

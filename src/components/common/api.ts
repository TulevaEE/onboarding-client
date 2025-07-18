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
  MemberCapitalListing,
  MobileSignatureResponse,
  MobileSignatureStatusResponse,
  Payment,
  PaymentLink,
  PaymentType,
  SigningMethod,
  SourceFund,
  Token,
  Transaction,
  User,
  UserConversion,
  CreateMemberCapitalListingDto,
} from './apiModels/index';
import {
  deleteWithAuthentication,
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
import {
  CreateMandateBatchDto,
  FundPensionStatus,
  MandateBatchDto,
  WithdrawalsEligibility,
} from './apiModels/withdrawals';
import { mockRequestInMockMode } from './requestMocker';

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
      signingMethod: grantType as SigningMethod,
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

export function downloadMandatePreviewWithId(entityId: string): Promise<Blob> {
  return downloadFileWithAuthentication(getEndpoint(`/v1/mandates/${entityId}/file/preview`));
}

export function downloadMandateWithId(entityId: string): Promise<Blob> {
  return downloadFileWithAuthentication(getEndpoint(`/v1/mandates/${entityId}/file`));
}

export function getUserWithToken(): Promise<User> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/me'), undefined),
    'user',
  );
}

export function getWithdrawalsEligibility(): Promise<WithdrawalsEligibility> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/withdrawals/eligibility'), undefined),
    'withdrawalsEligibility',
  );
}

export function getMemberCapitalListings(): Promise<MemberCapitalListing[]> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/listings'), undefined),
    'memberCapitalListings',
  );
}

export function createMemberCapitalListing(
  dto: CreateMemberCapitalListingDto,
): Promise<MemberCapitalListing> {
  return postWithAuthentication(getEndpoint('/v1/listings'), dto);
}

export function deleteMemberCapitalListing(
  listing: MemberCapitalListing,
): Promise<MemberCapitalListing> {
  return deleteWithAuthentication(getEndpoint(`/v1/listings/${listing.id}`));
}

export function getFundPensionStatus(): Promise<FundPensionStatus> {
  return getWithAuthentication(getEndpoint('/v1/withdrawals/fund-pension-status'), undefined);
}

export function createMandateBatch(
  createMandateBatchDto: CreateMandateBatchDto,
): Promise<MandateBatchDto> {
  return postWithAuthentication(getEndpoint('/v1/mandate-batches'), createMandateBatchDto);
}

export async function getSourceFunds(fromDate?: string, toDate?: string): Promise<SourceFund[]> {
  const params: Record<string, string> = {
    ...(fromDate && { 'from-date': fromDate }),
    ...(toDate && { 'to-date': toDate }),
  };

  const funds = await getWithAuthentication(getEndpoint('/v1/pension-account-statement'), params);

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
  units: fundBalance.units,
});

export function saveMandateWithAuthentication(mandate: string): Promise<Mandate> {
  return postWithAuthentication(getEndpoint('/v1/mandates'), mandate);
}

export async function getMobileIdSignatureChallengeCode({
  entityId,
  type = 'MANDATE',
}: {
  entityId: string;
  type?: 'MANDATE' | 'MANDATE_BATCH';
}): Promise<string | null> {
  const path =
    type === 'MANDATE'
      ? `/v1/mandates/${entityId}/signature/mobileId`
      : `/v1/mandate-batches/${entityId}/signature/mobile-id`;

  const { challengeCode } = await putWithAuthentication<MobileSignatureResponse>(
    getEndpoint(path),
    undefined,
  );
  return challengeCode;
}

export async function getMobileIdSignatureStatus({
  entityId,
  type = 'MANDATE',
}: {
  entityId: string;
  type?: 'MANDATE' | 'MANDATE_BATCH';
}): Promise<MobileSignatureStatusResponse> {
  const path =
    type === 'MANDATE'
      ? `/v1/mandates/${entityId}/signature/mobileId/status`
      : `/v1/mandate-batches/${entityId}/signature/mobile-id/status`;

  return getWithAuthentication<MobileSignatureStatusResponse>(getEndpoint(path), undefined);
}

export async function getSmartIdSignatureChallengeCode({
  entityId,
  type = 'MANDATE',
}: {
  entityId: string;
  type?: 'MANDATE' | 'MANDATE_BATCH';
}): Promise<string | null> {
  const path =
    type === 'MANDATE'
      ? `/v1/mandates/${entityId}/signature/smartId`
      : `/v1/mandate-batches/${entityId}/signature/smart-id`;

  const { challengeCode } = await putWithAuthentication<MobileSignatureResponse>(
    getEndpoint(path),
    undefined,
  );
  return challengeCode;
}

export async function getSmartIdSignatureStatus({
  entityId,
  type = 'MANDATE',
}: {
  entityId: string;
  type?: 'MANDATE' | 'MANDATE_BATCH';
}): Promise<MobileSignatureStatusResponse> {
  const path =
    type === 'MANDATE'
      ? `/v1/mandates/${entityId}/signature/smartId/status`
      : `/v1/mandate-batches/${entityId}/signature/smart-id/status`;

  return getWithAuthentication<MobileSignatureStatusResponse>(getEndpoint(path), undefined);
}

export async function getIdCardSignatureHash({
  entityId,
  type = 'MANDATE',
  certificateHex,
}: {
  entityId: string;
  certificateHex: string;
  type?: 'MANDATE' | 'MANDATE_BATCH';
}) {
  const path =
    type === 'MANDATE'
      ? `/v1/mandates/${entityId}/signature/idCard`
      : `/v1/mandate-batches/${entityId}/signature/id-card`;

  const { hash } = await putWithAuthentication<IdCardSignatureResponse>(getEndpoint(path), {
    clientCertificate: certificateHex,
  });

  return hash;
}

export async function getIdCardSignatureStatus({
  entityId,
  type = 'MANDATE',
  signedHash,
}: {
  entityId: string;
  type?: 'MANDATE' | 'MANDATE_BATCH';
  signedHash: string;
}): Promise<string> {
  const path =
    type === 'MANDATE'
      ? `/v1/mandates/${entityId}/signature/idCard/status`
      : `/v1/mandate-batches/${entityId}/signature/id-card/status`;

  const { statusCode } = await putWithAuthentication(getEndpoint(path), { signedHash });
  return statusCode;
}

export function updateUserWithToken(user: User): Promise<User> {
  return patchWithAuthentication(getEndpoint('/v1/me'), user);
}

export function getUserConversionWithToken(): Promise<UserConversion> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/me/conversion'), undefined),
    'conversion',
  );
}

export function getCapitalRowsWithToken(): Promise<CapitalRow[]> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/me/capital'), undefined),
    'memberCapital',
  );
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
  return mockRequestInMockMode(
    () =>
      getWithAuthentication(getEndpoint('/v1/applications'), {
        status: 'PENDING',
      }),
    'pendingApplications',
  );
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

export function createTrackedEvent(type: string, data: Record<string, unknown>): Promise<unknown> {
  return postWithAuthentication(getEndpoint('/v1/t'), { type, data });
}

export function getPaymentLink(payment: Payment): Promise<PaymentLink> {
  return getWithAuthentication(getEndpoint('/v1/payments/link'), payment);
}

export async function redirectToPayment(payment: Payment): Promise<void> {
  const wndw = getWindow(payment.type);
  const paymentLink = await getPaymentLink(payment);
  wndw.location.replace(paymentLink.url);
}

function getWindow(paymentType: PaymentType): Window {
  if (paymentType !== 'RECURRING' || getAuthentication().loginMethod === 'PARTNER') {
    return window;
  }
  const newWindow = window.open('', '_blank'); // this might be blocked by popup blockers
  if (newWindow == null) {
    return window;
  }
  newWindow.document.write('Loading...');
  return newWindow;
}

import config from 'react-global-configuration';
import { downloadFile, get, post, postForm, put, patch, simpleFetch } from './http';

// TODO: type API responses
/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URI = '/api';
export function getEndpoint(endpoint: string): string {
  // in production, we proxy through a proxy endpoint at /proxy.
  // in development, we proxy through webpack dev server without the prefix.
  if (process.env.NODE_ENV === 'production') {
    const API_BASEPATH = config && config.get('applicationUrl') ? config.get('applicationUrl') : '';
    return `${API_BASEPATH}${API_URI}${endpoint}`;
  }
  return endpoint;
}

function transformFundBalance(fundBalance: Record<string, any>): Record<string, any> {
  return {
    isin: fundBalance.fund.isin,
    price: fundBalance.value,
    unavailablePrice: fundBalance.unavailableValue,
    activeFund: fundBalance.activeContributions,
    currency: fundBalance.currency || 'EUR',
    name: fundBalance.fund.name,
    fundManager: fundBalance.fund.fundManager,
    managementFeePercent: (fundBalance.fund.managementFeeRate * 100).toFixed(2).replace(/0+$/, ''),
    pillar: fundBalance.pillar,
    ongoingChargesFigure: fundBalance.fund.ongoingChargesFigure,
    contributions: fundBalance.contributions,
    subtractions: fundBalance.subtractions,
    profit: fundBalance.profit,
  };
}

export async function authenticateWithMobileId(
  phoneNumber: string,
  personalCode: string,
): Promise<any> {
  const { challengeCode } = await post(getEndpoint('/authenticate'), {
    phoneNumber,
    personalCode,
    type: 'MOBILE_ID',
  });
  return challengeCode;
}

export async function authenticateWithIdCode(personalCode: string): Promise<any> {
  const { challengeCode } = await post(getEndpoint('/authenticate'), {
    personalCode,
    type: 'SMART_ID',
  });
  return challengeCode;
}

export async function authenticateWithIdCard(): Promise<any> {
  await simpleFetch('GET', 'https://id.tuleva.ee/'); // http://stackoverflow.com/a/16818527
  const { success } = await simpleFetch('POST', 'https://id.tuleva.ee/idLogin');
  return success;
}

async function getTokensWithGrantType(grantType: string): Promise<any> {
  try {
    const { access_token: accessToken, refresh_token: refreshToken } = await postForm(
      getEndpoint('/oauth/token'),
      {
        grant_type: grantType,
        client_id: 'onboarding-client',
      },
      {
        Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=',
      },
    );

    return { accessToken, refreshToken };
  } catch (error) {
    if (error.error !== 'AUTHENTICATION_NOT_COMPLETE') {
      throw error;
    }
    return null;
  }
}

export async function refreshTokenWith(refreshToken: string): Promise<any> {
  const { access_token: accessToken, refresh_token: refreshTokenFromResponse } = await postForm(
    getEndpoint('/oauth/token'),
    {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' },
  );

  return { accessToken, refreshToken: refreshTokenFromResponse };
}

export function getMobileIdTokens(): Promise<any> {
  return getTokensWithGrantType('mobile_id');
}

export function getSmartIdTokens(): Promise<any> {
  return getTokensWithGrantType('smart_id');
}

export function getIdCardTokens(): Promise<any> {
  return getTokensWithGrantType('id_card');
}

export function downloadMandatePreviewWithIdAndToken(
  mandateId: string,
  token: string,
): Promise<any> {
  return downloadFile(getEndpoint(`/v1/mandates/${mandateId}/file/preview`), {
    Authorization: `Bearer ${token}`,
  });
}

export function downloadMandateWithIdAndToken(mandateId: string, token: string): Promise<any> {
  return downloadFile(getEndpoint(`/v1/mandates/${mandateId}/file`), {
    Authorization: `Bearer ${token}`,
  });
}

export function getUserWithToken(token: string): Promise<any> {
  return get(getEndpoint('/v1/me'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getSourceFundsWithToken(token: string): Promise<any> {
  const funds = await get(getEndpoint('/v1/pension-account-statement'), undefined, {
    Authorization: `Bearer ${token}`,
  });
  return funds.map(transformFundBalance);
}

export function saveMandateWithToken(mandate: string, token: string): Promise<any> {
  return post(getEndpoint('/v1/mandates'), mandate, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getMobileIdSignatureChallengeCodeForMandateIdWithToken(
  mandateId: string,
  token: string,
): Promise<any> {
  const { challengeCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return challengeCode;
}

export async function getMobileIdSignatureStatusForMandateIdWithToken(
  mandateId: string,
  token: string,
): Promise<any> {
  return get(getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId/status`), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getSmartIdSignatureChallengeCodeForMandateIdWithToken(
  mandateId: string,
  token: string,
): Promise<any> {
  const { challengeCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return challengeCode;
}

export async function getSmartIdSignatureStatusForMandateIdWithToken(
  mandateId: string,
  token: string,
): Promise<any> {
  return get(getEndpoint(`/v1/mandates/${mandateId}/signature/smartId/status`), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
  mandateId: string,
  certificateHex: string,
  token: string,
): Promise<any> {
  const { hash } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard`),
    { clientCertificate: certificateHex },
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return hash;
}

export async function getIdCardSignatureStatusForMandateIdWithSignedHashAndToken(
  mandateId: string,
  signedHash: string,
  token: string,
): Promise<any> {
  const { statusCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard/status`),
    { signedHash },
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return statusCode;
}

export function updateUserWithToken(user: string, token: string): Promise<any> {
  return patch(getEndpoint('/v1/me'), user, {
    Authorization: `Bearer ${token}`,
  });
}

export function createUserWithToken(user: string, token: string): Promise<any> {
  return post(getEndpoint('/v1/users'), user, {
    Authorization: `Bearer ${token}`,
  });
}

export function getUserConversionWithToken(token: string): Promise<any> {
  return get(getEndpoint('/v1/me/conversion'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getInitialCapitalWithToken(token: string): Promise<any> {
  return get(getEndpoint('/v1/me/capital'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getPendingExchangesWithToken(token: string): Promise<any> {
  return get(getEndpoint('/v1/transfer-exchanges?status=PENDING'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function createAmlCheck(
  type: string,
  success: boolean,
  metadata: Record<string, unknown>,
  token: string,
): Promise<any> {
  return post(
    getEndpoint('/v1/amlchecks'),
    { type, success, metadata },
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

export function getMissingAmlChecks(token: string): Promise<any> {
  return get(getEndpoint('/v1/amlchecks'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export function getFunds(token: string): Promise<Fund[]> {
  return get(getEndpoint('/v1/funds'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function postThirdPillarStatistics(
  statistics: ThirdPillarStatistics,
  token: string,
): Promise<ThirdPillarStatistics> {
  return post(getEndpoint('/v1/statistics'), statistics, {
    Authorization: `Bearer ${token}`,
  });
}

interface ThirdPillarStatistics {
  id?: number;
  mandateId: number;
  singlePayment?: number;
  recurringPayment?: number;
}

export function getPendingApplications(token: string): Promise<Application[]> {
  return get(
    getEndpoint('/v1/applications'),
    { status: 'PENDING' },
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

export type Application =
  | TransferApplication
  | StopContributionsApplication
  | ResumeContributionsApplication
  | EarlyWithdrawalApplication
  | WithdrawalApplication;

export type TransferApplication = BaseApplication<
  ApplicationType.TRANSFER,
  {
    sourceFund: string;
    exchanges: {
      targetFund: string;
      amount: number;
    }[];
  }
>;

export type StopContributionsApplication = BaseApplication<
  ApplicationType.STOP_CONTRIBUTIONS,
  {
    stopTime: string;
    earliestResumeTime: string;
  }
>;

export type ResumeContributionsApplication = BaseApplication<
  ApplicationType.RESUME_CONTRIBUTIONS,
  {
    resumeTime: string;
  }
>;

export type EarlyWithdrawalApplication = BaseApplication<
  ApplicationType.EARLY_WITHDRAWAL,
  {
    withdrawalTime: string;
    depositAccountIBAN: string;
  }
>;

export type WithdrawalApplication = BaseApplication<
  ApplicationType.WITHDRAWAL,
  {
    withdrawalTime: string;
    depositAccountIBAN: string;
  }
>;

export enum ApplicationType {
  TRANSFER = 'TRANSFER',
  STOP_CONTRIBUTIONS = 'STOP_CONTRIBUTIONS',
  RESUME_CONTRIBUTIONS = 'RESUME_CONTRIBUTIONS',
  EARLY_WITHDRAWAL = 'EARLY_WITHDRAWAL',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export interface BaseApplication<Type extends ApplicationType, Details> {
  id: number;
  status: ApplicationStatus;
  creationTime: string;

  type: Type;
  details: Details;
}

export interface Fund {
  isin: string;
  name: string;
  pillar: number;
  managementFeeRate: number;
  ongoingChargesFigure: number;
  fundManager: FundManager;
}

export interface FundManager {
  id: number;
  name: string;
}

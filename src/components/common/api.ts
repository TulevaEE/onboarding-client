import config from 'react-global-configuration';
import {
  Fund,
  Application,
  CancellationMandate,
  User,
  SourceFund,
  UserConversion,
  InitialCapital,
  AmlCheck,
  Token,
  FundBalance,
  Mandate,
  MobileSignatureResponse,
  MobileSignatureStatusResponse,
  IdCardSignatureResponse,
  IdCardSignatureStatusResponse,
} from './apiModels';
import { downloadFile, get, post, postForm, put, patch, simpleFetch } from './http';

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

export async function authenticateWithIdCode(personalCode: string): Promise<string> {
  const { challengeCode } = await post(getEndpoint('/authenticate'), {
    personalCode,
    type: 'SMART_ID',
  });
  return challengeCode;
}

export async function authenticateWithIdCard(): Promise<boolean> {
  await simpleFetch('GET', config.get('idCardUrl')); // http://stackoverflow.com/a/16818527
  const { success } = await simpleFetch('POST', `${config.get('idCardUrl')}/idLogin`);
  return success;
}

export function logout(token: string): Promise<void> {
  return get(
    getEndpoint('/v1/logout'),
    {},
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

async function getTokensWithGrantType(grantType: string): Promise<Token | null> {
  try {
    const { access_token: accessToken } = await postForm(
      getEndpoint('/oauth/token'),
      {
        grant_type: grantType,
        client_id: 'onboarding-client',
      },
      {
        Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=',
      },
    );

    return { accessToken };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.error !== 'AUTHENTICATION_NOT_COMPLETE') {
      throw error;
    }
    return null;
  }
}

export function getMobileIdTokens(): Promise<Token | null> {
  return getTokensWithGrantType('mobile_id');
}

export function getSmartIdTokens(): Promise<Token | null> {
  return getTokensWithGrantType('smart_id');
}

export function getIdCardTokens(): Promise<Token | null> {
  return getTokensWithGrantType('id_card');
}

export function downloadMandatePreviewWithIdAndToken(
  mandateId: string,
  token: string,
): Promise<Blob> {
  return downloadFile(getEndpoint(`/v1/mandates/${mandateId}/file/preview`), {
    Authorization: `Bearer ${token}`,
  });
}

export function downloadMandateWithIdAndToken(mandateId: string, token: string): Promise<Blob> {
  return downloadFile(getEndpoint(`/v1/mandates/${mandateId}/file`), {
    Authorization: `Bearer ${token}`,
  });
}

export function getUserWithToken(token: string): Promise<User> {
  return get(getEndpoint('/v1/me'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getSourceFundsWithToken(token: string): Promise<SourceFund[]> {
  const funds = await get(getEndpoint('/v1/pension-account-statement'), undefined, {
    Authorization: `Bearer ${token}`,
  });
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
  managementFeePercent: (fundBalance.fund.managementFeeRate * 100).toFixed(2).replace(/0+$/, ''),
  pillar: fundBalance.fund.pillar,
  ongoingChargesFigure: fundBalance.fund.ongoingChargesFigure,
  contributions: fundBalance.contributions,
  subtractions: fundBalance.subtractions,
  profit: fundBalance.profit,
});

export function saveMandateWithToken(mandate: string, token: string): Promise<Mandate> {
  return post(getEndpoint('/v1/mandates'), mandate, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getMobileIdSignatureChallengeCodeForMandateIdWithToken(
  mandateId: string,
  token: string,
): Promise<MobileSignatureResponse> {
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
): Promise<MobileSignatureStatusResponse> {
  return get(getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId/status`), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getSmartIdSignatureChallengeCodeForMandateIdWithToken(
  mandateId: string,
  token: string,
): Promise<MobileSignatureResponse> {
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
): Promise<MobileSignatureStatusResponse> {
  return get(getEndpoint(`/v1/mandates/${mandateId}/signature/smartId/status`), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
  mandateId: string,
  certificateHex: string,
  token: string,
): Promise<IdCardSignatureResponse> {
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
): Promise<IdCardSignatureStatusResponse> {
  const { statusCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard/status`),
    { signedHash },
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return statusCode;
}

export function updateUserWithToken(user: User, token: string): Promise<User> {
  return patch(getEndpoint('/v1/me'), user, {
    Authorization: `Bearer ${token}`,
  });
}

export function getUserConversionWithToken(token: string): Promise<UserConversion> {
  return get(getEndpoint('/v1/me/conversion'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getInitialCapitalWithToken(token: string): Promise<InitialCapital> {
  return get(getEndpoint('/v1/me/capital'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function createAmlCheck(
  type: string,
  success: boolean,
  metadata: Record<string, unknown>,
  token: string,
): Promise<AmlCheck> {
  return post(
    getEndpoint('/v1/amlchecks'),
    { type, success, metadata },
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

export function getMissingAmlChecks(token: string): Promise<AmlCheck[]> {
  return get(getEndpoint('/v1/amlchecks'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getFunds(token: string): Promise<Fund[]> {
  return get(getEndpoint('/v1/funds'), undefined, {
    Authorization: `Bearer ${token}`,
  });
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

export function createApplicationCancellation(
  applicationId: number,
  token: string,
): Promise<CancellationMandate> {
  return post(
    getEndpoint(`/v1/applications/${applicationId}/cancellations`),
    {},
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createTrackedEvent(
  type: string,
  data: Record<string, unknown>,
  token: string,
): Promise<any> {
  return post(
    getEndpoint('/v1/t'),
    { type, data },
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

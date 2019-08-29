import config from 'react-global-configuration';
import { downloadFile, get, post, postForm, put, patch, simpleFetch } from './http';

const API_URI = '/api';
function getEndpoint(endpoint) {
  // in production, we proxy through a proxy endpoint at /proxy.
  // in development, we proxy through webpack dev server without the prefix.
  if (process.env.NODE_ENV === 'production') {
    const API_BASEPATH = config && config.get('applicationUrl') ? config.get('applicationUrl') : '';
    return `${API_BASEPATH}${API_URI}${endpoint}`;
  }
  return endpoint;
}

function transformFundBalance(fundBalance) {
  return {
    isin: fundBalance.fund.isin,
    price: fundBalance.value,
    activeFund: fundBalance.activeContributions,
    currency: fundBalance.currency || 'EUR',
    name: fundBalance.fund.name,
    managerName: fundBalance.fund.fundManager.name,
    managementFeePercent: (fundBalance.fund.managementFeeRate * 100).toFixed(2).replace(/0+$/, ''),
    pillar: fundBalance.pillar,
    ongoingChargesFigure: fundBalance.fund.ongoingChargesFigure,
    contributionSum: fundBalance.contributionSum,
    profit: fundBalance.profit,
  };
}

export async function authenticateWithPhoneNumber(phoneNumber) {
  const { challengeCode } = await post(getEndpoint('/authenticate'), {
    value: phoneNumber,
    type: 'MOBILE_ID',
  });
  return challengeCode;
}

export async function authenticateWithIdCode(identityCode) {
  const { challengeCode } = await post(getEndpoint('/authenticate'), {
    value: identityCode,
    type: 'SMART_ID',
  });
  return challengeCode;
}

export async function authenticateWithIdCard() {
  await simpleFetch('GET', 'https://id.tuleva.ee/'); // http://stackoverflow.com/a/16818527
  const { success } = await simpleFetch('POST', 'https://id.tuleva.ee/idLogin');
  return success;
}

async function getTokensWithGrantType(grantType) {
  try {
    const { access_token: accessToken, refresh_token: refreshToken } = await postForm(
      getEndpoint('/oauth/token'),
      {
        /* eslint-disable @typescript-eslint/camelcase */
        grant_type: grantType,
        client_id: 'onboarding-client',
        /* eslint-enable @typescript-eslint/camelcase */
      },
      { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' },
    );

    return { accessToken, refreshToken };
  } catch (error) {
    if (error.error !== 'AUTHENTICATION_NOT_COMPLETE') {
      throw error;
    }
    return null;
  }
}

export async function refreshTokenWith(refreshToken) {
  const { access_token: accessToken, refresh_token: refreshTokenFromResponse } = await postForm(
    getEndpoint('/oauth/token'),
    {
      /* eslint-disable @typescript-eslint/camelcase */
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      /* eslint-enable @typescript-eslint/camelcase */
    },
    { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' },
  );

  return { accessToken, refreshToken: refreshTokenFromResponse };
}

export function getMobileIdTokens() {
  return getTokensWithGrantType('mobile_id');
}

export function getSmartIdTokens() {
  return getTokensWithGrantType('smart_id');
}

export function getIdCardTokens() {
  return getTokensWithGrantType('id_card');
}

export function downloadMandatePreviewWithIdAndToken(mandateId, token) {
  return downloadFile(getEndpoint(`/v1/mandates/${mandateId}/file/preview`), {
    Authorization: `Bearer ${token}`,
  });
}

export function downloadMandateWithIdAndToken(mandateId, token) {
  return downloadFile(getEndpoint(`/v1/mandates/${mandateId}/file`), {
    Authorization: `Bearer ${token}`,
  });
}

export function getUserWithToken(token) {
  return get(getEndpoint('/v1/me'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getSourceFundsWithToken(token) {
  const funds = await get(getEndpoint('/v1/pension-account-statement'), undefined, {
    Authorization: `Bearer ${token}`,
  });
  return funds.map(transformFundBalance);
}

export function getTargetFundsWithToken(token) {
  return get(getEndpoint('/v1/funds'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

// TODO: test after demo
export function saveMandateWithToken(mandate, token) {
  return post(getEndpoint('/v1/mandates'), mandate, {
    Authorization: `Bearer ${token}`,
  });
}

export async function getMobileIdSignatureChallengeCodeForMandateIdWithToken(mandateId, token) {
  const { mobileIdChallengeCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return mobileIdChallengeCode;
}

export async function getMobileIdSignatureStatusForMandateIdWithToken(mandateId, token) {
  const { statusCode } = await get(
    getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId/status`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return statusCode;
}

export async function getSmartIdSignatureChallengeCodeForMandateIdWithToken(mandateId, token) {
  const { challengeCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return challengeCode;
}

export async function getSmartIdSignatureStatusForMandateIdWithToken(mandateId, token) {
  const { statusCode } = await get(
    getEndpoint(`/v1/mandates/${mandateId}/signature/smartId/status`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return statusCode;
}

export async function getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
  mandateId,
  certificateHex,
  token,
) {
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
  mandateId,
  signedHash,
  token,
) {
  const { statusCode } = await put(
    getEndpoint(`/v1/mandates/${mandateId}/signature/idCard/status`),
    { signedHash },
    {
      Authorization: `Bearer ${token}`,
    },
  );
  return statusCode;
}

export function updateUserWithToken(user, token) {
  return patch(getEndpoint('/v1/me'), user, {
    Authorization: `Bearer ${token}`,
  });
}

export function createUserWithToken(user, token) {
  return post(getEndpoint('/v1/users'), user, {
    Authorization: `Bearer ${token}`,
  });
}

export function getUserConversionWithToken(token) {
  return get(getEndpoint('/v1/me/conversion'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getInitialCapitalWithToken(token) {
  return get(getEndpoint('/v1/me/capital'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getPendingExchangesWithToken(token) {
  return get(getEndpoint('/v1/transfer-exchanges?status=PENDING'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getReturnComparisonForStartDateWithToken(startDate, token) {
  return get(
    getEndpoint(`/v1/fund-comparison${startDate ? `?from=${startDate}` : ''}`),
    undefined,
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

export function createAmlCheck(type, success, metadata, token) {
  return post(
    getEndpoint('/v1/amlchecks'),
    { type, success, metadata },
    {
      Authorization: `Bearer ${token}`,
    },
  );
}

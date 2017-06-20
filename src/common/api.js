import config from 'react-global-configuration';
import { downloadFile, get, post, postForm, put, patch, simpleFetch } from './http';

const API_URI = '/api';
function getEndpoint(endpoint) {
  const API_BASEPATH = config.get('applicationUrl');
  // in production, we proxy through a proxy endpoint at /proxy.
  // in development, we proxy through webpack dev server without the prefix.
  if (process.env.NODE_ENV === 'production') {
    return `${API_BASEPATH}${API_URI}${endpoint}`;
  }
  return `${API_BASEPATH}${endpoint}`;
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
  };
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function authenticateWithIdCard() {
  return simpleFetch('GET', 'https://id.tuleva.ee/') // http://stackoverflow.com/a/16818527
    .then(() => simpleFetch('POST', 'https://id.tuleva.ee/idLogin'))
    .then(({ success }) => success);
}

function getTokensWithGrantType(grantType) {
  return postForm(getEndpoint('/oauth/token'), {
    grant_type: grantType,
    client_id: 'onboarding-client',
  }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' })
    .then(({ access_token, refresh_token }) => ({
      accessToken: access_token,
      refreshToken: refresh_token,
    }))
    .catch((error) => {
      if (error.error !== 'AUTHENTICATION_NOT_COMPLETE') {
        throw error;
      }
      return null;
    });
}

export function refreshTokenWith(refreshToken) {
  return postForm(getEndpoint('/oauth/token'), {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' })
    .then(({ access_token, refresh_token }) => ({
      accessToken: access_token,
      refreshToken: refresh_token,
    }));
}

export function getMobileIdTokens() {
  return getTokensWithGrantType('mobile_id');
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
  return get(getEndpoint('/v1/me'), undefined, { Authorization: `Bearer ${token}` });
}

export function getSourceFundsWithToken(token) {
  return get(getEndpoint('/v1/pension-account-statement'), undefined, {
    Authorization: `Bearer ${token}`,
  }).then(funds => funds.map(transformFundBalance));
}

export function getTargetFundsWithToken(token) {
  return get(getEndpoint('/v1/funds'), { 'fundManager.name': 'Tuleva' }, {
    Authorization: `Bearer ${token}`,
  });
}

// TODO: test after demo
export function saveMandateWithToken(mandate, token) {
  return post(getEndpoint('/v1/mandates'), mandate, {
    Authorization: `Bearer ${token}`,
  });
}

export function getMobileIdSignatureChallengeCodeForMandateIdWithToken(mandateId, token) {
  return put(getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId`), undefined, {
    Authorization: `Bearer ${token}`,
  }).then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function getMobileIdSignatureStatusForMandateIdWithToken(mandateId, token) {
  return get(getEndpoint(`/v1/mandates/${mandateId}/signature/mobileId/status`), undefined, {
    Authorization: `Bearer ${token}`,
  }).then(({ statusCode }) => statusCode);
}

export function getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
  mandateId, certificateHex, token) {
  return put(getEndpoint(`/v1/mandates/${mandateId}/signature/idCard`), { clientCertificate: certificateHex }, {
    Authorization: `Bearer ${token}`,
  }).then(({ hash }) => hash);
}

export function getIdCardSignatureStatusForMandateIdWithSignedHashAndToken(
  mandateId, signedHash, token) {
  return put(getEndpoint(`/v1/mandates/${mandateId}/signature/idCard/status`), { signedHash }, {
    Authorization: `Bearer ${token}`,
  }).then(({ statusCode }) => statusCode);
}

export function createUserWithToken(user, token) {
  return patch(getEndpoint('/v1/me'), user, {
    Authorization: `Bearer ${token}`,
  }).then(savedUser => savedUser);
}

export function getComparisonForSalaryAndRateWithToken(monthlyWage, returnRate, token,
  isTulevaMember = false) {
  return get(getEndpoint(`/v1/comparisons?monthlyWage=${monthlyWage}&returnRate=${returnRate}&isTulevaMember=${isTulevaMember}`),
    undefined, { Authorization: `Bearer ${token}` });
}

export function getUserConversionWithToken(token) {
  return get(getEndpoint('/v1/me/conversion'), undefined, { Authorization: `Bearer ${token}` });
}

export function getInitialCapitalWithToken(token) {
  return get(getEndpoint('/v1/me/initial-capital'), undefined, { Authorization: `Bearer ${token}` });
}

export function getPendingExchangesWithToken(token) {
  return get(getEndpoint('/v1/transfer-exchanges?status=PENDING'), undefined, { Authorization: `Bearer ${token}` });
}

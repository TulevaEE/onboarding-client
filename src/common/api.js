import { downloadFile, get, post, postForm, put } from './http';

const API_URL = '/api';

function getEndpoint(endpoint) {
  // in production, we proxy through a proxy endpoint at /proxy.
  // in development, we proxy through webpack dev server without the prefix.
  if (process.env.NODE_ENV === 'production') {
    return `${API_URL}${endpoint}`;
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
    managementFeePercent: (fundBalance.fund.managementFeeRate * 100).toFixed(2).replace(/0+$/, ''),
  };
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function authenticateWithIdCard() {
  return get('https://id.tuleva.ee/') // http://stackoverflow.com/a/16818527
    .then(() => post('https://id.tuleva.ee/idLogin', undefined, { 'Content-Type': 'text/plain' })) // Firefox CORS
    .then(({ success }) => success);
}

function getTokenWithClientId(clientId) {
  return postForm(getEndpoint('/oauth/token'), {
    grant_type: clientId,
    client_id: 'onboarding-client',
  }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' })
    .then(({ access_token }) => access_token) // eslint-disable-line
    .catch((error) => {
      if (error.error !== 'AUTHENTICATION_NOT_COMPLETE') {
        throw error;
      }
      return null;
    });
}

export function getMobileIdToken() {
  return getTokenWithClientId('mobile_id');
}

export function getIdCardToken() {
  return getTokenWithClientId('id_card');
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

export function getContributionsFund(token) {
  return get(getEndpoint('/v1/contributions-fund-name'), undefined, { Authorization: `Bearer ${token}` });
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

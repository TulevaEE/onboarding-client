import { post, postForm, get, put, downloadFile } from './http';

const API_URL = 'https://onboarding-service.tuleva.ee';

function getEndpoint(endpoint) {
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
    managementFeeRate: fundBalance.fund.managementFeeRate,
  };
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function authenticateWithIdCard() {
  return post('https://id.tuleva.ee/idLogin')
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

export function downloadMandatePreviewWithIdAndToken(id, token) {
  return downloadFile(getEndpoint(`/v1/mandates/${id}/file/preview`), {
    Authorization: `Bearer ${token}`,
  });
}

export function downloadMandateWithIdAndToken(id, token) {
  return downloadFile(getEndpoint(`/v1/mandates/${id}/file`), {
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

export function getMobileIdSignatureChallengeCodeForMandateIdWithToken(id, token) {
  return put(getEndpoint(`/v1/mandates/${id}/signature/mobileId`), undefined, {
    Authorization: `Bearer ${token}`,
  }).then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function getMobileIdSignatureStatusForMandateIdWithToken(id, token) {
  return get(getEndpoint(`/v1/mandates/${id}/signature/mobileId/status`), undefined, {
    Authorization: `Bearer ${token}`,
  }).then(({ statusCode }) => statusCode);
}

export function getIdCardSignatureHashForMandateIdWithClientCertificateAndToken(
  id, clientCertificate, token) {
  return put(getEndpoint(`/v1/mandates/${id}/signature/idCard`), { clientCertificate }, {
    Authorization: `Bearer ${token}`,
  }).then(({ hash }) => hash);
}

export function getIdCardSignatureStatusForMandateIdWithSignedHashAndToken(id, signedHash, token) {
  return put(getEndpoint(`/v1/mandates/${id}/signature/idCard/status`), { signedHash }, {
    Authorization: `Bearer ${token}`,
  }).then(({ statusCode }) => statusCode);
}

import {post, postForm, get, put} from "./http";

const API_URL = 'https://onboarding-service.tuleva.ee';

function getEndpoint(endpoint) {
  if (process.env.NODE_ENV === 'production') {
    return `${API_URL}${endpoint}`;
  }
  return endpoint;
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function authenticateWithIdCard() {
  return post('https://id.tuleva.ee/idLogin')
    .then(({ success }) => success)
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

export function getUserWithToken(token) {
  return get(getEndpoint('/v1/me'), undefined, { Authorization: `Bearer ${token}` });
}

export function getSourceFundsWithToken(token) {
  return get(getEndpoint('/v1/pension-account-statement'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

export function getTargetFundsWithToken(token) {
  return get(getEndpoint('/v1/available-funds'), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

// TODO: test after demo
export function saveMandateWithToken(mandate, token) {
  return post(getEndpoint('/v1/mandate'), mandate, {
    Authorization: `Bearer ${token}`,
  });
}

// TODO: test after demo
export function getMandateControlCodeForMandateIdWithToken(id, token) {
  return put(getEndpoint(`/v1/mandate/${id}/signature`), undefined, {
    Authorization: `Bearer ${token}`,
  }).then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

// TODO: test after demo
export function getMandateSignatureForMandateIdWithToken(id, token) {
  return get(getEndpoint(`/v1/mandate/${id}/signature`), undefined, {
    Authorization: `Bearer ${token}`,
  });
}

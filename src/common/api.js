import { post, postForm, get } from './http';

const API_URL = '';

function getEndpoint(endpoint) {
  return `${API_URL}${endpoint}`;
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function getToken() {
  return postForm(getEndpoint('/oauth/token'), {
    grant_type: 'mobile_id',
    client_id: 'onboarding-client',
  }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' })
    .then(({ access_token }) => access_token) // eslint-disable-line
    .catch((error) => {
      if (error.error_description !== 'AUTHENTICATION_NOT_COMPLETE') {
        throw error;
      }
      return null;
    });
}

export function getUserWithToken(token) {
  return get(getEndpoint('/v1/me'), undefined, { Authorization: `Bearer ${token}` });
}

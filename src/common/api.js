import { post } from './http';

const API_URL = '';

function getEndpoint(endpoint) {
  return `${API_URL}${endpoint}`;
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function getToken() {
  return post(getEndpoint('/oauth/token'), {
    grant_type: 'mobile_id',
    client_id: 'onboarding_client',
  })
    .then(({ access_token }) => access_token) // eslint-disable-line
    .catch((error) => {
      if (error.message !== 'AUTHENTICATION_NOT_COMPLETE') {
        throw error;
      }
      return null;
    });
}

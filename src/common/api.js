import { post, get } from './http';

const API_URL = '';

function getEndpoint(endpoint) {
  return `${API_URL}${endpoint}`;
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return post(getEndpoint('/authenticate'), { phoneNumber })
    .then(({ mobileIdChallengeCode }) => mobileIdChallengeCode);
}

export function getAuthenticationCompletion() {
  return get(getEndpoint('/authenticate/is-complete'))
    .then(({ complete }) => complete)
    .catch((error) => {
      if (error.message) {
        throw error;
      }
      return false;
    });
}

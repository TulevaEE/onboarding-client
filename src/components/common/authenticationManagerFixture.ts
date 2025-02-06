import { AuthenticationManager } from './authenticationManager';

export const anAuthenticationManager = (
  accessToken = 'an access token',
): AuthenticationManager => ({
  accessToken,
  refreshToken: 'a refresh token',
  loginMethod: 'SMART_ID',
  signingMethod: 'SMART_ID',
  update: () => null,
  remove: () => null,
  isAuthenticated: () => true,
});

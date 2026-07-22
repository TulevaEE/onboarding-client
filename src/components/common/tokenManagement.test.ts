import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import config from 'react-global-configuration';
import { createAxiosInstance } from './tokenManagement';
import { AuthenticationManager } from './authenticationManager';
import * as authenticationManager from './authenticationManager';
import { loginPath } from '../login/constants';
import Mock = jest.Mock;

jest.mock('./authenticationManager', () => ({
  getAuthentication: jest.fn(),
}));
describe('Axios Instance Creation and Interceptors', () => {
  let mockAxios: MockAdapter;
  const mockPrincipal: AuthenticationManager = {
    accessToken: 'initialAccessToken',
    refreshToken: 'validRefreshToken',
    loginMethod: 'SMART_ID',
    signingMethod: 'SMART_ID',
    update: jest.fn(),
    remove: jest.fn(),
    isAuthenticated: jest.fn(),
  };

  config.set({ language: 'en' });

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();
    (authenticationManager.getAuthentication as jest.Mock).mockReturnValue(mockPrincipal);
    (mockPrincipal.update as Mock).mockClear();
    (mockPrincipal.remove as Mock).mockClear();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('sets Authorization header with current access token', async () => {
    const axiosInstance = createAxiosInstance();

    mockAxios.onGet('/test').reply((configuration: AxiosRequestConfig) => {
      expect(configuration.headers?.Authorization).toEqual(`Bearer ${mockPrincipal.accessToken}`);
      return [200, {}];
    });

    await axiosInstance.get('/test');
  });

  it('refreshes token on 401 response and retries original request', async () => {
    const axiosInstance = createAxiosInstance();
    const newAccessToken = 'newAccessToken';

    // First request fails with 401, triggering token refresh
    mockAxios.onGet('/test').replyOnce(401, { error: 'TOKEN_EXPIRED' });

    mockAxios.onPost('/oauth/refresh-token').reply(200, {
      access_token: newAccessToken,
      refresh_token: 'newRefreshToken',
    });

    // Original request retried after token refresh succeeds
    mockAxios.onGet('/test').reply((configuration: AxiosRequestConfig) => {
      expect(configuration.headers?.Authorization).toEqual(`Bearer ${newAccessToken}`);
      return [200, {}];
    });

    await axiosInstance.get('/test');
    expect(mockPrincipal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: newAccessToken,
      }),
    );
  });

  it('removes principal and redirects to login on refresh token expiration', async () => {
    const axiosInstance = createAxiosInstance();

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    // First request fails with 401, indicating expired token
    mockAxios.onGet('/test').replyOnce(401, { error: 'TOKEN_EXPIRED' });

    // Token refresh attempt fails due to expired refresh token
    mockAxios.onPost('/oauth/refresh-token').reply(403, { error: 'REFRESH_TOKEN_EXPIRED' });

    try {
      await axiosInstance.get('/test');
    } catch (error) {
      expect(mockPrincipal.remove).toHaveBeenCalled();
      expect(window.location.href).toBe(loginPath);
    }
  });

  it('retries all concurrently queued requests with the refreshed token', async () => {
    const axiosInstance = createAxiosInstance();
    const newAccessToken = 'newAccessToken';

    mockAxios.onGet('/first').replyOnce(401, { error: 'TOKEN_EXPIRED' });
    mockAxios.onGet('/second').replyOnce(401, { error: 'TOKEN_EXPIRED' });
    mockAxios.onPost('/oauth/refresh-token').reply(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve([200, { access_token: newAccessToken, refresh_token: 'newRefreshToken' }]),
            50,
          );
        }),
    );
    const retriedAuthHeaders: (string | undefined)[] = [];
    mockAxios.onGet('/first').reply((configuration: AxiosRequestConfig) => {
      retriedAuthHeaders.push(configuration.headers?.Authorization as string);
      return [200, {}];
    });
    mockAxios.onGet('/second').reply((configuration: AxiosRequestConfig) => {
      retriedAuthHeaders.push(configuration.headers?.Authorization as string);
      return [200, {}];
    });

    await Promise.all([axiosInstance.get('/first'), axiosInstance.get('/second')]);

    expect(retriedAuthHeaders).toEqual([`Bearer ${newAccessToken}`, `Bearer ${newAccessToken}`]);
  });

  it('rejects queued requests when the token refresh fails instead of leaving them pending', async () => {
    const axiosInstance = createAxiosInstance();

    mockAxios.onGet('/first').replyOnce(401, { error: 'TOKEN_EXPIRED' });
    mockAxios.onGet('/second').replyOnce(401, { error: 'TOKEN_EXPIRED' });
    mockAxios.onPost('/oauth/refresh-token').reply(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([500, {}]), 50);
        }),
    );

    const results = await Promise.allSettled([
      axiosInstance.get('/first'),
      axiosInstance.get('/second'),
    ]);

    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
  });

  it('bounds the refresh request with a timeout', async () => {
    const axiosInstance = createAxiosInstance();

    mockAxios.onGet('/test').replyOnce(401, { error: 'TOKEN_EXPIRED' });
    let refreshTimeout: number | undefined;
    mockAxios.onPost('/oauth/refresh-token').reply((configuration: AxiosRequestConfig) => {
      refreshTimeout = configuration.timeout;
      return [200, { access_token: 'newAccessToken', refresh_token: 'newRefreshToken' }];
    });
    mockAxios.onGet('/test').reply(200, {});

    await axiosInstance.get('/test');

    expect(refreshTimeout).toBe(15000);
  });

  it('sets Accept-Language header according to config', async () => {
    const axiosInstance = createAxiosInstance();

    mockAxios.onGet('/test-language').reply((configuration: AxiosRequestConfig) => {
      expect(configuration.headers?.['Accept-Language']).toEqual(config.get('language'));
      return [200, {}];
    });

    await axiosInstance.get('/test-language');
  });
});

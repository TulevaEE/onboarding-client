import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import config from 'react-global-configuration';
import { createAxiosInstance } from './tokenManagement';
import { UpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal';

describe('Axios Instance Creation and Interceptors', () => {
  let mockAxios: MockAdapter;
  const mockPrincipal: UpdatableAuthenticationPrincipal = {
    accessToken: 'initialAccessToken',
    refreshToken: 'validRefreshToken',
    loginMethod: 'SMART_ID',
    update: jest.fn(),
    remove: jest.fn(),
  };

  config.set({ language: 'en' });

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mockPrincipal.update.mockClear();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mockPrincipal.remove.mockClear();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('sets Authorization header with current access token', async () => {
    const axiosInstance = createAxiosInstance(mockPrincipal);

    mockAxios.onGet('/test').reply((configuration: AxiosRequestConfig) => {
      expect(configuration.headers?.Authorization).toEqual(`Bearer ${mockPrincipal.accessToken}`);
      return [200, {}];
    });

    await axiosInstance.get('/test');
  });

  it('refreshes token on 401 response and retries original request', async () => {
    const axiosInstance = createAxiosInstance(mockPrincipal);
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

  it('removes principal on refresh token expiration', async () => {
    const axiosInstance = createAxiosInstance(mockPrincipal);

    // First request fails with 401, indicating expired token
    mockAxios.onGet('/test').replyOnce(401, { error: 'TOKEN_EXPIRED' });

    // Token refresh attempt fails due to expired refresh token
    mockAxios.onPost('/oauth/refresh-token').reply(403, { error: 'REFRESH_TOKEN_EXPIRED' });

    try {
      await axiosInstance.get('/test');
    } catch (error) {
      expect(mockPrincipal.remove).toHaveBeenCalled();
    }
  });

  it('sets Accept-Language header according to config', async () => {
    const axiosInstance = createAxiosInstance(mockPrincipal);

    mockAxios.onGet('/test-language').reply((configuration: AxiosRequestConfig) => {
      expect(configuration.headers?.['Accept-Language']).toEqual(config.get('language'));
      return [200, {}];
    });

    await axiosInstance.get('/test-language');
  });
});

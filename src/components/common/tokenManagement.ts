import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import config from 'react-global-configuration';
import { AuthenticationPrincipal, Token } from './apiModels';
import { AuthenticationManager, getAuthentication } from './authenticationManager';
import { loginPath } from '../login/constants';

let currentAccessToken: string | null = null;

function setCurrentAccessToken(newToken: string): void {
  currentAccessToken = newToken;
}

function getCurrentAccessToken(): string | null {
  return currentAccessToken;
}

type TokenRefreshSubscriber = (tokens: Token) => void;
let tokenRefreshSubscribers: TokenRefreshSubscriber[] = [];
let isRefreshing = false;

function setIsRefreshing(is: boolean): void {
  isRefreshing = is;
}

function getIsRefreshing(): boolean {
  return isRefreshing;
}

async function executeRefreshTokenRequest(authenticationPrincipal: AuthenticationManager) {
  try {
    const response = await axios.post('/oauth/refresh-token', {
      refresh_token: authenticationPrincipal.refreshToken,
    });

    const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;
    const updatedPrincipal: AuthenticationPrincipal = {
      loginMethod: authenticationPrincipal.loginMethod,
      signingMethod: authenticationPrincipal.signingMethod,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
    authenticationPrincipal.update(updatedPrincipal);
    setIsRefreshing(false);

    tokenRefreshSubscribers.forEach((callback) => callback(newAccessToken));
    tokenRefreshSubscribers = [];

    return updatedPrincipal;
  } catch (error: unknown) {
    setIsRefreshing(false);

    // eslint-disable-next-line no-console
    console.error('Token refresh failed:', error);
    throw error;
  }
}

function queueRequestToWaitForANewToken(
  authenticationPrincipal: AuthenticationManager,
): Promise<AuthenticationManager> {
  return new Promise((resolve) => {
    tokenRefreshSubscribers.push((tokens: Token) => {
      const updatedPrincipal: AuthenticationManager = {
        ...authenticationPrincipal,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
      resolve(updatedPrincipal);
    });
  });
}

const refreshCurrentToken = async (
  authenticationPrincipal: AuthenticationManager,
): Promise<AuthenticationPrincipal> => {
  if (!getIsRefreshing()) {
    setIsRefreshing(true);
    return executeRefreshTokenRequest(authenticationPrincipal);
  }
  return queueRequestToWaitForANewToken(authenticationPrincipal);
};

function isAccessTokenExpired(error: AxiosError) {
  const data = error.response?.data as { error?: string } | undefined;
  return error.response?.status === 401 && data?.error === 'TOKEN_EXPIRED';
}

export function createAxiosInstance(): AxiosInstance {
  const authenticationPrincipal = getAuthentication();
  setCurrentAccessToken(authenticationPrincipal.accessToken);
  const axiosInstance = axios.create({
    withCredentials: true,
  });

  axiosInstance.interceptors.request.use(
    (configuration: InternalAxiosRequestConfig) => {
      const token = getCurrentAccessToken();
      const language = config.get('language');

      if (token) {
        configuration.headers.set('Authorization', `Bearer ${token}`);
      }
      configuration.headers.set('Accept-Language', language);

      return configuration;
    },
    (error) => Promise.reject(error),
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        isAccessTokenExpired(error) &&
        // eslint-disable-next-line no-underscore-dangle
        !originalRequest._retry
      ) {
        // eslint-disable-next-line no-underscore-dangle
        originalRequest._retry = true;
        try {
          const updatedPrincipal = await refreshCurrentToken(authenticationPrincipal);
          setCurrentAccessToken(updatedPrincipal.accessToken);

          originalRequest.headers.Authorization = `Bearer ${updatedPrincipal.accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError: unknown) {
          return handleTokenRefreshFailure(refreshError, authenticationPrincipal, error);
        }
      } else if (error.response) {
        const customError = {
          status: error.response.status,
          body: error.response.data,
        };
        return Promise.reject(customError);
      }
      // Handle other errors
      return Promise.reject(error);
    },
  );

  return axiosInstance;
}

function isRefreshTokenExpired(axiosError: AxiosError) {
  const data = axiosError.response?.data as { error?: string } | undefined;
  return axiosError.response?.status === 403 && data?.error === 'REFRESH_TOKEN_EXPIRED';
}

function handleTokenRefreshFailure(
  refreshError: unknown,
  authenticationPrincipal: AuthenticationManager,
  error: unknown,
) {
  if (refreshError && (refreshError as AxiosError).isAxiosError) {
    const axiosError = refreshError as AxiosError;
    if (axiosError.response) {
      if (isRefreshTokenExpired(axiosError)) {
        authenticationPrincipal.remove();
        window.location.href = loginPath;
        return Promise.reject(axiosError.response.data);
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('An token refresh error response:', error);
  }
  return Promise.reject(refreshError);
}

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthenticationPrincipal, Token } from './apiModels';
import { UpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal';

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

async function executeRefreshTokenRequest(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
) {
  try {
    const response = await axios.post('/oauth/refresh-token', {
      refresh_token: authenticationPrincipal.refreshToken,
    });

    const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;
    const updatedPrincipal: AuthenticationPrincipal = {
      loginMethod: authenticationPrincipal.loginMethod,
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
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<UpdatableAuthenticationPrincipal> {
  return new Promise((resolve) => {
    tokenRefreshSubscribers.push((tokens: Token) => {
      const updatedPrincipal: UpdatableAuthenticationPrincipal = {
        ...authenticationPrincipal,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
      resolve(updatedPrincipal);
    });
  });
}

const refreshCurrentToken = async (
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<AuthenticationPrincipal> => {
  if (!getIsRefreshing()) {
    setIsRefreshing(true);
    return executeRefreshTokenRequest(authenticationPrincipal);
  }
  return queueRequestToWaitForANewToken(authenticationPrincipal);
};

function isAccessTokenExpired(error: AxiosError) {
  return error.response?.status === 401 && error.response.data.error === 'TOKEN_EXPIRED';
}

export function createAxiosInstance(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): AxiosInstance {
  setCurrentAccessToken(authenticationPrincipal.accessToken);
  const axiosInstance = axios.create({
    withCredentials: true,
  });

  axiosInstance.interceptors.request.use(
    (configuration: AxiosRequestConfig) => {
      const token = getCurrentAccessToken();
      if (token) {
        // eslint-disable-next-line no-param-reassign
        configuration.headers = configuration.headers || {};
        // eslint-disable-next-line no-param-reassign
        configuration.headers.Authorization = `Bearer ${token}`;
      }
      return configuration;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
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
  return (
    axiosError.response?.status === 403 &&
    axiosError.response?.data.error === 'REFRESH_TOKEN_EXPIRED'
  );
}

function handleTokenRefreshFailure(
  refreshError: unknown,
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
  error: unknown,
) {
  if (refreshError && (refreshError as AxiosError).isAxiosError) {
    const axiosError = refreshError as AxiosError;
    if (axiosError.response) {
      if (isRefreshTokenExpired(axiosError)) {
        authenticationPrincipal.remove();
        return Promise.reject(axiosError.response.data);
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('An token refresh error response:', error);
  }
  return Promise.reject(refreshError);
}

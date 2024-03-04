import axios, { AxiosResponse } from 'axios';
import config from 'react-global-configuration';
import { UpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal';
import { createAxiosInstance } from './tokenManagement';

axios.defaults.withCredentials = true;

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformResponse(response: Response): Promise<Response> {
  if (response.ok && response.status < 400) {
    return response.json();
  }
  if (response.status >= 400) {
    return response.json().then((data) => {
      const error: { status?: number; body?: any } = {};
      error.status = response.status;
      error.body = data;
      throw error;
    });
  }
  throw response;
}

function urlEncodeParameters(params: Record<string, string>): string {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

export async function get(url: string, params = {}, headers = {}): Promise<AxiosResponse['data']> {
  try {
    const response = await axios.get(url, {
      params,
      headers: { ...headers, ...createLanguageHeaders() },
    });
    return response.data;
  } catch (error: any) {
    // eslint-disable-next-line no-throw-literal
    throw {
      status: error.response?.status,
      body: error.response?.data,
    };
  }
}
export async function getWithAuthentication(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
  url: string,
  params = {},
  axiosConfig = {},
): Promise<any> {
  checkUpdatableAuthenticationPrincipal(authenticationPrincipal);
  const axiosInstance = createAxiosInstance(authenticationPrincipal);
  return axiosInstance.get(url, { params, ...axiosConfig }).then((response) => response.data);
}

export async function postWithAuthentication(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
  url: string,
  data = {},
  axiosConfig = {},
): Promise<any> {
  checkUpdatableAuthenticationPrincipal(authenticationPrincipal);
  const axiosInstance = createAxiosInstance(authenticationPrincipal);
  return axiosInstance.post(url, data, axiosConfig).then((response) => response.data);
}

export async function putWithAuthentication(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
  url: string,
  data = {},
  axiosConfig = {},
): Promise<any> {
  checkUpdatableAuthenticationPrincipal(authenticationPrincipal);
  const axiosInstance = createAxiosInstance(authenticationPrincipal);
  return axiosInstance.put(url, data, axiosConfig).then((response) => response.data);
}

export async function patchWithAuthentication(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
  url: string,
  data = {},
  axiosConfig = {},
): Promise<any> {
  checkUpdatableAuthenticationPrincipal(authenticationPrincipal);
  const axiosInstance = createAxiosInstance(authenticationPrincipal);
  return axiosInstance.patch(url, data, axiosConfig).then((response) => response.data);
}

export async function downloadFileWithAuthentication(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
  url: string,
  headers = {},
): Promise<Blob> {
  checkUpdatableAuthenticationPrincipal(authenticationPrincipal);

  const axiosInstance = createAxiosInstance(authenticationPrincipal);

  return axiosInstance
    .get(url, {
      headers: { ...headers },
      responseType: 'blob',
    })
    .then((response) => response.data);
}

export async function post(url: string, params = {}, headers = {}): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
      ...createLanguageHeaders(),
    },
    body: JSON.stringify(params),
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  });

  return transformResponse(response);
}

export async function postForm(url: string, params = {}, headers = {}): Promise<any> {
  const body = urlEncodeParameters(params);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
      ...createLanguageHeaders(),
    },
    body,
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  });
  return transformResponse(response);
}

export async function simpleFetch(method: string, url: string): Promise<any> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'text/plain', // for Firefox CORS:
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS?redirectlocale=en-US&redirectslug=HTTP_access_control#Simple_requests
    },
    mode: 'cors',
    credentials: 'include',
    cache: 'default',
  });
  return transformResponse(response);
}

// Runtime exception if we use this file from not typed
function checkUpdatableAuthenticationPrincipal(
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
) {
  if (typeof authenticationPrincipal.update !== 'function') {
    // eslint-disable-next-line no-console
    console.error('No updatable authentication principal present');
    throw new Error('No updatable authentication principal present');
  }
}

function createLanguageHeaders(): Record<string, string> {
  return {
    'Accept-Language': config.get('language'),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

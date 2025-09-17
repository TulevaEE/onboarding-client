import axios, { AxiosResponse } from 'axios';
import config from 'react-global-configuration';
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
export async function getWithAuthentication<TResponse = any>(
  url: string,
  params = {},
  axiosConfig = {},
) {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get<TResponse>(url, { params, ...axiosConfig });
  return response.data;
}

export async function postWithAuthentication<TResponse = any>(
  url: string,
  data = {},
  axiosConfig = {},
): Promise<any> {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.post<TResponse>(url, data, axiosConfig);
  return response.data;
}

export async function deleteWithAuthentication<TResponse = any>(
  url: string,
  axiosConfig = {},
): Promise<any> {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.delete<TResponse>(url, axiosConfig);
  return response.data;
}

export async function putWithAuthentication<TResponse = any>(
  url: string,
  data = {},
  axiosConfig = {},
): Promise<any> {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.put<TResponse>(url, data, axiosConfig);
  return response.data;
}

export async function patchWithAuthentication<TResponse = any>(
  url: string,
  data = {},
  axiosConfig = {},
): Promise<any> {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.patch<TResponse>(url, data, axiosConfig);
  return response.data;
}

export async function downloadFileWithAuthentication(url: string, headers = {}): Promise<Blob> {
  const axiosInstance = createAxiosInstance();

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

export async function head(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'HEAD',
    headers: {
      'Content-Type': 'text/plain', // for Firefox CORS:
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS?redirectlocale=en-US&redirectslug=HTTP_access_control#Simple_requests
    },
    mode: 'cors',
    credentials: 'include',
    cache: 'default',
  });
  return response;
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

function createLanguageHeaders(): Record<string, string> {
  return {
    'Accept-Language': config.get('language'),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

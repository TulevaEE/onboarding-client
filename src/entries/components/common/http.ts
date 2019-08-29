import axios, { AxiosResponse } from 'axios';
import config from 'react-global-configuration';

axios.defaults.withCredentials = true;

function createCustomHeaders(): Record<string, string> {
  return {
    'Accept-Language': config.get('language'),
  };
}

function transformResponse(response: Response): Promise<Response> {
  if (response.ok && response.status < 400) {
    return response.json();
  }
  if (response.status >= 400) {
    return response.json().then(data => {
      const error: { status?: number; body?: any } = {};
      error.status = response.status;
      error.body = data;
      throw error;
    });
  }
  throw response;
}

function transformFileResponse(response: Response): Promise<Blob> {
  if (response.ok && response.status < 400) {
    return response.blob();
  }
  throw response;
}

function urlEncodeParameters(params: Record<string, string>): string {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

export async function get(url: string, params = {}, headers = {}): Promise<AxiosResponse['data']> {
  try {
    const response = await axios.get(url, {
      params,
      headers: { ...headers, ...createCustomHeaders() },
    });
    return response.data;
  } catch (error) {
    // eslint-disable-next-line no-throw-literal
    throw {
      status: error.response.status,
      body: error.response.data,
    };
  }
}

export async function downloadFile(url: string, headers = {}): Promise<any> {
  const response = await fetch(url, {
    headers: { ...headers, ...createCustomHeaders() },
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  });
  return transformFileResponse(response);
}

export async function post(url: string, params = {}, headers = {}): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
      ...createCustomHeaders(),
    },
    body: JSON.stringify(params),
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  });

  return transformResponse(response);
}

// TODO: write tests for this
export async function put(url: string, params = {}, headers = {}): Promise<any> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
      ...createCustomHeaders(),
    },
    body: JSON.stringify(params),
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  });
  return transformResponse(response);
}

export async function patch(url: string, params = {}, headers = {}): Promise<any> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
      ...createCustomHeaders(),
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
      ...createCustomHeaders(),
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

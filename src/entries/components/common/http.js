import config from 'react-global-configuration';

function createCustomHeaders() {
  return {
    'Accept-Language': config.get('language'),
  };
}

function transformResponse(response) {
  if (response.ok && response.status < 400) {
    return response.json();
  }
  if (response.status >= 400) {
    return response.json().then(data => {
      const error = {};
      error.status = response.status;
      error.body = data;
      throw error;
    });
  }
  throw response;
}

function transformFileResponse(response) {
  if (response.ok && response.status < 400) {
    return response.blob();
  }
  throw response;
}

function urlEncodeParameters(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

export async function get(url, params = {}, headers = {}) {
  const urlParameters = urlEncodeParameters(params);
  const response = await fetch(`${url}${urlParameters ? `?${urlParameters}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
      ...createCustomHeaders(),
    },
    mode: 'cors',
    credentials: 'include',
    cache: 'default',
  });
  return transformResponse(response);
}

export async function downloadFile(url, headers = {}) {
  const response = await fetch(url, {
    headers: { ...headers, ...createCustomHeaders() },
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  });
  return transformFileResponse(response);
}

export async function post(url, params = {}, headers = {}) {
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
export async function put(url, params = {}, headers = {}) {
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

export async function patch(url, params = {}, headers = {}) {
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

export async function postForm(url, params = {}, headers = {}) {
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

export async function simpleFetch(method, url) {
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

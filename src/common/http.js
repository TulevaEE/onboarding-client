
import {
  captureException,
  captureMessage,
} from '../util/error';

function transformResponse(response) {
  if (response.ok && response.status < 400) {
    return response.json();
  } else if (response.status >= 400) {
    return response
      .json()
      .catch((err) => {
        // Report JSON parsing errors
        captureException(err, {
          http_status: response.status,
          http_url: response.url,
        });
        throw err;
      })
      .then((data) => {
        if (response.status >= 500) {
          // Report 500 errors
          captureMessage(data.error, {
            http_status: response.status,
            http_url: response.url,
            error: data,
          });
        }
        throw data;
      });
  }
  throw response;
}

function urlEncodeParameters(params) {
  return Object
    .keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

export function get(url, params = {}, headers = {}) {
  const urlParameters = urlEncodeParameters(params);
  return fetch(`${url}${urlParameters ? `?${urlParameters}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    mode: 'cors',
    credentials: 'include',
    cache: 'default',
  }).then(transformResponse);
}

export function post(url, params = {}, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(params),
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  }).then(transformResponse);
}

// TODO: write tests for this
export function put(url, params = {}, headers = {}) {
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(params),
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  }).then(transformResponse);
}

export function postForm(url, params = {}, headers = {}) {
  const body = urlEncodeParameters(params);
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body,
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
  }).then(transformResponse);
}

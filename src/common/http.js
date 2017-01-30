function transformResponse(response) {
  if (response.ok && response.status < 400) {
    return response.json();
  } else if (response.status >= 400) {
    return response
      .json()
      .then((data) => {
        throw data;
      });
  }
  throw response;
}

export function get(url, params = {}, headers = {}) {
  const urlParameters = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return fetch(`${url}${urlParameters ? `?${urlParameters}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    mode: 'cors',
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
    mode: 'cors',
    cache: 'default',
  }).then(transformResponse);
}

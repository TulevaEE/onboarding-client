import qs from 'qs';

export function getQueryParams() {
  return qs.parse(window.location.search, { ignoreQueryPrefix: true });
}

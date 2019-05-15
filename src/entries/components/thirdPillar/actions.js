import { QUERY_PARAMETERS } from './constants';

export function addDataFromQueryParams(query) {
  return { type: QUERY_PARAMETERS, query };
}

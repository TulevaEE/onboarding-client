import { QUERY_PARAMETERS } from './constants';

export function mapUrlQueryParamsToState(query) {
  return { type: QUERY_PARAMETERS, query };
}

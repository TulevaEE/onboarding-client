import { AxiosAdapter } from 'axios';

export const terminatedRequestAdapter: AxiosAdapter = (configuration) =>
  Promise.resolve({
    data: '',
    status: 0,
    statusText: '',
    headers: {},
    config: configuration,
    request: {},
  });

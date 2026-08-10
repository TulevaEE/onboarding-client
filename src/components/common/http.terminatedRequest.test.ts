import { AxiosAdapter } from 'axios';
import config from 'react-global-configuration';
import { getWithAuthentication } from './http';
import * as authenticationManager from './authenticationManager';
import { anAuthenticationManager } from './authenticationManagerFixture';

jest.mock('./authenticationManager', () => ({
  getAuthentication: jest.fn(),
}));

const terminatedRequestAdapter: AxiosAdapter = (configuration) =>
  Promise.resolve({
    data: '',
    status: 0,
    statusText: '',
    headers: {},
    config: configuration,
    request: {},
  });

describe('getWithAuthentication when the browser terminates the request', () => {
  config.set({ language: 'en' });

  beforeEach(() => {
    (authenticationManager.getAuthentication as jest.Mock).mockReturnValue(
      anAuthenticationManager(),
    );
  });

  it('rejects instead of returning an empty body as successful data', async () => {
    await expect(
      getWithAuthentication('/v1/transactions', {}, { adapter: terminatedRequestAdapter }),
    ).rejects.toBeDefined();
  });
});

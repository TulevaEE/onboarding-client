import config from 'react-global-configuration';
import { getWithAuthentication } from './http';
import * as authenticationManager from './authenticationManager';
import { anAuthenticationManager } from './authenticationManagerFixture';
import { terminatedRequestAdapter } from './terminatedRequestAdapterFixture';

jest.mock('./authenticationManager', () => ({
  getAuthentication: jest.fn(),
}));

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

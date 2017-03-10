const mockHttp = jest.genMockFromModule('../common/http');
jest.mock('../common/http', () => mockHttp);

const { api } = require('.'); // need to use require because of jest mocks being weird

describe('api', () => {
  beforeEach(() => {
    mockHttp.get = jest.fn();
    mockHttp.post = jest.fn();
  });

  it('can authenticate with a phone number', () => {
    const phoneNumber = '1234567';
    const controlCode = '123123123';
    mockHttp.post.mockImplementationOnce(() => Promise.resolve({
      mobileIdChallengeCode: controlCode,
    }));
    expect(mockHttp.post).not.toHaveBeenCalled();
    return api
      .authenticateWithPhoneNumber(phoneNumber)
      .then((givenControlCode) => {
        expect(givenControlCode).toBe(controlCode);
        expect(mockHttp.post).toHaveBeenCalledTimes(1);
        expect(mockHttp.post).toHaveBeenCalledWith('/authenticate', { phoneNumber });
      });
  });

  it('can authenticate with id card', () => {
    mockHttp.post = jest.fn(() => Promise.resolve({
      success: true,
    }));
    expect(mockHttp.post).not.toHaveBeenCalled();
    return api
      .authenticateWithIdCard()
      .then((success) => {
        expect(success).toBe(true);
        expect(mockHttp.post).toHaveBeenCalledTimes(1);
        expect(mockHttp.post).toHaveBeenCalledWith('https://id.tuleva.ee/idLogin');
      });
  });

  it('can get a mobile id token', () => {
    mockHttp.postForm = jest.fn(() => Promise.resolve({ access_token: 'mobile_id_token' }));
    expect(mockHttp.postForm).not.toHaveBeenCalled();
    return api
      .getMobileIdToken()
      .then((token) => {
        expect(token).toBe('mobile_id_token');
        expect(mockHttp.postForm).toHaveBeenCalledTimes(1);
        expect(mockHttp.postForm).toHaveBeenCalledWith('/oauth/token', {
          client_id: 'onboarding-client',
          grant_type: 'mobile_id',
        }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' });
      });
  });

  it('can get an id card token', () => {
    mockHttp.postForm = jest.fn(() => Promise.resolve({ access_token: 'token' }));
    expect(mockHttp.postForm).not.toHaveBeenCalled();
    return api
      .getIdCardToken()
      .then((token) => {
        expect(token).toBe('token');
        expect(mockHttp.postForm).toHaveBeenCalledTimes(1);
        expect(mockHttp.postForm).toHaveBeenCalledWith('/oauth/token', {
          client_id: 'onboarding-client',
          grant_type: 'id_card',
        }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' });
      });
  });

  it('throws in getting token if authentication is finished but errored', () => {
    const error = { error: 'oh no!' };
    mockHttp.postForm = jest.fn(() => Promise.reject(error));
    return api
      .getMobileIdToken()
      .then(() => expect(0).toBe(1)) // fail, should not go to then.
      .catch(givenError => expect(givenError).toEqual(error));
  });

  it('gives no token in authentication check if error is auth not completed', () => {
    mockHttp.postForm = jest.fn(() => Promise.reject({ error: 'AUTHENTICATION_NOT_COMPLETE' }));
    return api
      .getMobileIdToken()
      .then(token => expect(token).toBeFalsy());
  });

  it('can get a user with a token', () => {
    const user = { iAmAUser: true };
    const token = 'token';
    mockHttp.get = jest.fn(() => Promise.resolve(user));
    return api
      .getUserWithToken(token)
      .then((givenUser) => {
        expect(givenUser).toEqual(user);
        expect(mockHttp.get).toHaveBeenCalledWith('/v1/me', undefined, {
          Authorization: `Bearer ${token}`,
        });
      });
  });

  it('can get existing funds and converts them with a token', () => {
    const pensionFunds = [
      {
        fund: {
          name: 'name',
          isin: 'AA123123123123',
          managementFeeRate: 0.5,
        },
        activeContributions: false,
        value: 100,
      },
      {
        fund: {
          name: 'name 2',
          isin: 'AA123123123124',
          managementFeeRate: 1,
        },
        activeContributions: true,
        value: 200,
        currency: 'GBP',
      },
    ];
    const token = 'token';
    mockHttp.get = jest.fn(() => Promise.resolve(pensionFunds));
    return api
      .getSourceFundsWithToken(token)
      .then((givenPensionFunds) => {
        expect(givenPensionFunds).toEqual([
          {
            name: 'name',
            isin: 'AA123123123123',
            managementFeeRate: 0.5,
            activeFund: false,
            price: 100,
            currency: 'EUR',
          },
          {
            name: 'name 2',
            isin: 'AA123123123124',
            managementFeeRate: 1,
            activeFund: true,
            price: 200,
            currency: 'GBP',
          },
        ]);
        expect(mockHttp.get).toHaveBeenCalledWith('/v1/pension-account-statement', undefined, {
          Authorization: `Bearer ${token}`,
        });
      });
  });

  it('can get target funds with a token', () => {
    const targetFunds = [{ iAmAFund: true }];
    const token = 'token';
    mockHttp.get = jest.fn(() => Promise.resolve(targetFunds));
    return api
      .getTargetFundsWithToken(token)
      .then((givenTarget) => {
        expect(givenTarget).toEqual(targetFunds);
        expect(mockHttp.get).toHaveBeenCalledWith('/v1/funds', { 'fundManager.name': 'Tuleva' }, {
          Authorization: `Bearer ${token}`,
        });
      });
  });

  it('can download a mandate', () => {
    mockHttp.downloadFile = jest.fn(() => Promise.resolve());
    const mandateId = '123';
    const token = 'a token';
    return api.downloadMandateWithIdAndToken(mandateId, token)
      .then(() => expect(mockHttp.downloadFile).toHaveBeenCalledWith('/v1/mandates/123/file', {
        Authorization: `Bearer ${token}`,
      }));
  });
});

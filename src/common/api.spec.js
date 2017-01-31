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

  it('can get a token', () => {
    mockHttp.postForm = jest.fn(() => Promise.resolve({ access_token: 'token' }));
    expect(mockHttp.postForm).not.toHaveBeenCalled();
    return api
      .getToken()
      .then((token) => {
        expect(token).toBe('token');
        expect(mockHttp.postForm).toHaveBeenCalledTimes(1);
        expect(mockHttp.postForm).toHaveBeenCalledWith('/oauth/token', {
          client_id: 'onboarding-client',
          grant_type: 'mobile_id',
        }, { Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=' });
      });
  });

  it('throws in getting token if authentication is finished but errored', () => {
    const error = { error_description: 'oh no!' };
    mockHttp.postForm = jest.fn(() => Promise.reject(error));
    return api
      .getToken()
      .then(() => expect(0).toBe(1)) // fail, should not go to then.
      .catch(givenError => expect(givenError).toEqual(error));
  });

  it('gives no token in authentication check if error is auth not completed', () => {
    mockHttp.postForm = jest.fn(() => Promise.reject({ error_description: 'AUTHENTICATION_NOT_COMPLETE' }));
    return api
      .getToken()
      .then(token => expect(token).toBeFalsy());
  });
});

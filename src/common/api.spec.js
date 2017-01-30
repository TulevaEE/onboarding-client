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

  it('can check if authentication is complete', () => Promise
      .all([true, false]
        .map((complete) => {
          mockHttp.get = jest.fn(() => Promise.resolve({ complete }));
          expect(mockHttp.get).not.toHaveBeenCalled();
          return api
            .getAuthenticationCompletion()
            .then((completion) => {
              expect(completion).toBe(complete);
              expect(mockHttp.get).toHaveBeenCalledTimes(1);
              expect(mockHttp.get).toHaveBeenCalledWith('/authenticate/is-complete');
            });
        })));
});

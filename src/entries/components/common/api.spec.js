const mockHttp = jest.genMockFromModule('../common/http');
jest.mock('../common/http', () => mockHttp);

const { api } = require('.'); // need to use require because of jest mocks being weird

describe('api', () => {
  beforeEach(() => {
    mockHttp.get = jest.fn();
    mockHttp.post = jest.fn();
    mockHttp.postForm = jest.fn();
    mockHttp.put = jest.fn();
    mockHttp.patch = jest.fn();
    mockHttp.simpleFetch = jest.fn();
  });

  it('can authenticate with a phone number', () => {
    const phoneNumber = '1234567';
    const controlCode = '123123123';
    mockHttp.post.mockImplementationOnce(() =>
      Promise.resolve({
        challengeCode: controlCode,
      }),
    );
    expect(mockHttp.post).not.toHaveBeenCalled();
    return api.authenticateWithPhoneNumber(phoneNumber).then(givenControlCode => {
      expect(givenControlCode).toBe(controlCode);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('/authenticate', {
        phoneNumber,
      });
    });
  });

  it('can authenticate with identity code', () => {
    const identityCode = '1223445567';
    const controlCode = '123123123';
    mockHttp.post.mockImplementationOnce(() =>
      Promise.resolve({
        challengeCode: controlCode,
      }),
    );
    expect(mockHttp.post).not.toHaveBeenCalled();
    return api.authenticateWithIdCode(identityCode).then(givenControlCode => {
      expect(givenControlCode).toBe(controlCode);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('/authenticate', {
        identityCode,
      });
    });
  });

  it('can authenticate with id card', () => {
    mockHttp.simpleFetch = jest.fn(() =>
      Promise.resolve({
        success: true,
      }),
    );
    expect(mockHttp.simpleFetch).not.toHaveBeenCalled();
    return api.authenticateWithIdCard().then(success => {
      expect(success).toBe(true);
      expect(mockHttp.simpleFetch).toHaveBeenCalledTimes(2);
      expect(mockHttp.simpleFetch).toHaveBeenCalledWith('GET', 'https://id.tuleva.ee/');
      expect(mockHttp.simpleFetch).toHaveBeenCalledWith('POST', 'https://id.tuleva.ee/idLogin');
    });
  });

  it('can get a mobile id token', () => {
    mockHttp.postForm = jest.fn(() =>
      Promise.resolve({
        access_token: 'mobile_id_token',
        refresh_token: 'mobile_id_refresh_token',
      }),
    );
    expect(mockHttp.postForm).not.toHaveBeenCalled();
    return api.getMobileIdTokens().then(token => {
      expect(token.accessToken).toBe('mobile_id_token');
      expect(token.refreshToken).toBe('mobile_id_refresh_token');
      expect(mockHttp.postForm).toHaveBeenCalledTimes(1);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        {
          client_id: 'onboarding-client',
          grant_type: 'mobile_id',
        },
        {
          Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=',
        },
      );
    });
  });

  it('can get an id card token', () => {
    mockHttp.postForm = jest.fn(() =>
      Promise.resolve({ access_token: 'token', refresh_token: 'refresh' }),
    );
    expect(mockHttp.postForm).not.toHaveBeenCalled();
    return api.getIdCardTokens().then(token => {
      expect(token.accessToken).toBe('token');
      expect(token.refreshToken).toBe('refresh');
      expect(mockHttp.postForm).toHaveBeenCalledTimes(1);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        {
          client_id: 'onboarding-client',
          grant_type: 'id_card',
        },
        {
          Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=',
        },
      );
    });
  });

  it('throws in getting token if authentication is finished but errored', () => {
    const error = { error: 'oh no!' };
    mockHttp.postForm = jest.fn(() => Promise.reject(error));
    return api
      .getMobileIdTokens()
      .then(() => expect(0).toBe(1)) // fail, should not go to then.
      .catch(givenError => expect(givenError).toEqual(error));
  });

  it('gives no token in authentication check if error is auth not completed', () => {
    mockHttp.postForm = jest.fn(() => Promise.reject({ error: 'AUTHENTICATION_NOT_COMPLETE' }));
    return api.getMobileIdTokens().then(token => expect(token).toBeFalsy());
  });

  it('can get a user with a token', () => {
    const user = { iAmAUser: true };
    const token = 'token';
    mockHttp.get = jest.fn(() => Promise.resolve(user));
    return api.getUserWithToken(token).then(givenUser => {
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
          managementFeeRate: 0.005,
          fundManager: {
            name: 'manager',
          },
        },
        activeContributions: false,
        value: 100,
      },
      {
        fund: {
          name: 'name 2',
          isin: 'AA123123123124',
          managementFeeRate: 0.0039,
          fundManager: {
            name: 'manager',
          },
        },
        activeContributions: true,
        value: 200,
        currency: 'GBP',
      },
    ];
    const token = 'token';
    mockHttp.get = jest.fn(() => Promise.resolve(pensionFunds));
    return api.getSourceFundsWithToken(token).then(givenPensionFunds => {
      expect(givenPensionFunds).toEqual([
        {
          name: 'name',
          isin: 'AA123123123123',
          managementFeePercent: '0.5',
          activeFund: false,
          price: 100,
          currency: 'EUR',
          managerName: 'manager',
        },
        {
          name: 'name 2',
          isin: 'AA123123123124',
          managementFeePercent: '0.39',
          activeFund: true,
          price: 200,
          currency: 'GBP',
          managerName: 'manager',
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
    return api.getTargetFundsWithToken(token).then(givenTarget => {
      expect(givenTarget).toEqual(targetFunds);
      expect(mockHttp.get).toHaveBeenCalledWith('/v1/funds', undefined, {
        Authorization: `Bearer ${token}`,
      });
    });
  });

  it('can download mandate preview', () => {
    mockHttp.downloadFile = jest.fn(() => Promise.resolve());
    const mandateId = '123';
    const token = 'a token';
    return api.downloadMandatePreviewWithIdAndToken(mandateId, token).then(() =>
      expect(mockHttp.downloadFile).toHaveBeenCalledWith('/v1/mandates/123/file/preview', {
        Authorization: `Bearer ${token}`,
      }),
    );
  });

  it('can download a mandate', () => {
    mockHttp.downloadFile = jest.fn(() => Promise.resolve());
    const mandateId = '123';
    const token = 'a token';
    return api.downloadMandateWithIdAndToken(mandateId, token).then(() =>
      expect(mockHttp.downloadFile).toHaveBeenCalledWith('/v1/mandates/123/file', {
        Authorization: `Bearer ${token}`,
      }),
    );
  });

  it('can get a mobile id signature challenge code', () => {
    mockHttp.put = jest.fn(() => Promise.resolve({ mobileIdChallengeCode: 7777 }));
    expect(mockHttp.put).not.toHaveBeenCalled();
    const mandateId = '123';
    const token = 'a token';
    return api
      .getMobileIdSignatureChallengeCodeForMandateIdWithToken(mandateId, token)
      .then(mobileIdChallengeCode => {
        expect(mobileIdChallengeCode).toBe(7777);
        expect(mockHttp.put).toHaveBeenCalledTimes(1);
        expect(mockHttp.put).toHaveBeenCalledWith(
          '/v1/mandates/123/signature/mobileId',
          undefined,
          {
            Authorization: `Bearer ${token}`,
          },
        );
      });
  });

  it('can get a mobile id signature status', () => {
    mockHttp.get = jest.fn(() => Promise.resolve({ statusCode: 'SIGNATURE' }));
    expect(mockHttp.get).not.toHaveBeenCalled();
    const mandateId = '123';
    const token = 'a token';
    return api
      .getMobileIdSignatureStatusForMandateIdWithToken(mandateId, token)
      .then(statusCode => {
        expect(statusCode).toBe('SIGNATURE');
        expect(mockHttp.get).toHaveBeenCalledTimes(1);
        expect(mockHttp.get).toHaveBeenCalledWith(
          '/v1/mandates/123/signature/mobileId/status',
          undefined,
          {
            Authorization: `Bearer ${token}`,
          },
        );
      });
  });

  it('can get an id card hash to be signed', () => {
    mockHttp.put = jest.fn(() => Promise.resolve({ hash: 'asdfg' }));
    expect(mockHttp.put).not.toHaveBeenCalled();
    const clientCertificate = 'a certificate';
    const mandateId = '123';
    const token = 'a token';
    return api
      .getIdCardSignatureHashForMandateIdWithCertificateHexAndToken(
        mandateId,
        clientCertificate,
        token,
      )
      .then(hash => {
        expect(hash).toBe('asdfg');
        expect(mockHttp.put).toHaveBeenCalledTimes(1);
        expect(mockHttp.put).toHaveBeenCalledWith(
          '/v1/mandates/123/signature/idCard',
          { clientCertificate },
          {
            Authorization: `Bearer ${token}`,
          },
        );
      });
  });

  it('can get an id card signature status', () => {
    mockHttp.put = jest.fn(() => Promise.resolve({ statusCode: 'SIGNATURE' }));
    expect(mockHttp.put).not.toHaveBeenCalled();
    const signedHash = 'a signed hash';
    const mandateId = '123';
    const token = 'a token';
    return api
      .getIdCardSignatureStatusForMandateIdWithSignedHashAndToken(mandateId, signedHash, token)
      .then(statusCode => {
        expect(statusCode).toBe('SIGNATURE');
        expect(mockHttp.put).toHaveBeenCalledTimes(1);
        expect(mockHttp.put).toHaveBeenCalledWith(
          '/v1/mandates/123/signature/idCard/status',
          { signedHash },
          {
            Authorization: `Bearer ${token}`,
          },
        );
      });
  });

  it('can update a user', () => {
    const user = { firstName: 'Erko' };
    const token = 'a token';

    mockHttp.patch = jest.fn(() =>
      Promise.resolve({
        firstName: 'Erko',
      }),
    );
    expect(mockHttp.patch).not.toHaveBeenCalled();
    return api.updateUserWithToken(user, token).then(createdUser => {
      expect(createdUser.firstName).toBe('Erko');
      expect(mockHttp.patch).toHaveBeenCalledTimes(1);
      expect(mockHttp.patch).toHaveBeenCalledWith('/v1/me', user, {
        Authorization: `Bearer ${token}`,
      });
    });
  });

  it('can create a new user', () => {
    const user = { firstName: 'Jordan' };
    const token = 'a token';

    mockHttp.post = jest.fn(() =>
      Promise.resolve({
        firstName: user.firstName,
      }),
    );
    expect(mockHttp.post).not.toHaveBeenCalled();
    return api.createUserWithToken(user, token).then(createdUser => {
      expect(createdUser.firstName).toBe(user.firstName);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('/v1/users', user, {
        Authorization: `Bearer ${token}`,
      });
    });
  });

  it('can get user conversion', () => {
    mockHttp.get = jest.fn(() => Promise.resolve());
    const token = 'a token';
    return api.getUserConversionWithToken(token).then(() =>
      expect(mockHttp.get).toHaveBeenCalledWith('/v1/me/conversion', undefined, {
        Authorization: `Bearer ${token}`,
      }),
    );
  });

  it('can get user initial capital', () => {
    mockHttp.get = jest.fn(() => Promise.resolve());
    const token = 'a token';
    return api.getInitialCapitalWithToken(token).then(() =>
      expect(mockHttp.get).toHaveBeenCalledWith('/v1/me/initial-capital', undefined, {
        Authorization: `Bearer ${token}`,
      }),
    );
  });

  it('can refresh token', () => {
    mockHttp.postForm = jest.fn(() =>
      Promise.resolve({
        access_token: 'new_token',
        refresh_token: 'new_refresh_token',
      }),
    );
    expect(mockHttp.postForm).not.toHaveBeenCalled();
    return api.refreshTokenWith('old_refresh_token').then(token => {
      expect(token.accessToken).toBe('new_token');
      expect(token.refreshToken).toBe('new_refresh_token');
      expect(mockHttp.postForm).toHaveBeenCalledTimes(1);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        {
          grant_type: 'refresh_token',
          refresh_token: 'old_refresh_token',
        },
        {
          Authorization: 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=',
        },
      );
    });
  });

  it('can get pending transfer exchanges with a token', () => {
    const exchanges = [{ iAmTransferExchange: true }];
    const token = 'token';
    mockHttp.get = jest.fn(() => Promise.resolve(exchanges));
    return api.getPendingExchangesWithToken(token).then(givenUser => {
      expect(givenUser).toEqual(exchanges);
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/v1/transfer-exchanges?status=PENDING',
        undefined,
        {
          Authorization: `Bearer ${token}`,
        },
      );
    });
  });

  it('can get return comparison with start date and token', async () => {
    expect.assertions(2);
    mockHttp.get = jest.fn(() => Promise.resolve({ actualReturnPercentage: 0.0123 }));

    const comparison = await api.getReturnComparisonForStartDateWithToken('2016-01-01', 'a-token');

    expect(comparison).toEqual({ actualReturnPercentage: 0.0123 });
    expect(mockHttp.get).toHaveBeenCalledWith('/v1/fund-comparison?from=2016-01-01', undefined, {
      Authorization: 'Bearer a-token',
    });
  });
});

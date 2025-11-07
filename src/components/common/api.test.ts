import config from 'react-global-configuration';
import {
  authenticateWithIdCard,
  authenticateWithIdCode,
  authenticateWithMobileId,
  createAmlCheck,
  createApplicationCancellation,
  createTrackedEvent,
  downloadMandatePreviewWithId,
  downloadMandateWithId,
  getCapitalRowsWithToken,
  getContributions,
  getFunds,
  getIdCardSignatureHash,
  getIdCardSignatureStatus,
  getIdCardTokens,
  getMandateDeadlines,
  getMissingAmlChecks,
  getMobileIdSignatureChallengeCode,
  getMobileIdSignatureStatus,
  getMobileIdTokens,
  getPaymentLink,
  getPendingApplications,
  getSavingsFundBalance,
  getSmartIdSignatureChallengeCode,
  getSmartIdSignatureStatus,
  getSmartIdTokens,
  getSourceFunds,
  getTokensWithGrantType,
  getTransactions,
  getUserConversionWithToken,
  getUserWithToken,
  logout,
  redirectToPayment,
  saveMandateWithAuthentication,
  updateUserWithToken,
} from './api';
import * as http from './http';
import {
  AmlCheck,
  Application,
  CancellationMandate,
  CapitalRow,
  Fund,
  LoginMethod,
  MandateDeadlines,
  Payment,
  PaymentLink,
  ThirdPillarContribution,
  Transaction,
  User,
  UserConversion,
} from './apiModels';

import * as authenticationManager from './authenticationManager';
import Mock = jest.Mock;

jest.mock('./http');
jest.mock('./authenticationManager', () => ({
  getAuthentication: jest.fn(),
  remove: jest.fn(),
}));
const mockHttp = http as jest.Mocked<typeof http>;

describe('API calls', () => {
  const mockAuthenticationUpdate = jest.fn();
  const mockAuthenticationRemove = jest.fn();
  beforeEach(() => {
    config.set({ idCardUrl: 'https://id.tuleva.ee' }, { freeze: false, assign: false });
    jest.clearAllMocks();
    (authenticationManager.getAuthentication as Mock).mockReturnValue({
      update: mockAuthenticationUpdate,
      remove: mockAuthenticationRemove,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe('authenticateWithIdCard', () => {
    it('should authenticate using ID card successfully via ALB mTLS', async () => {
      config.set({ idCardUrl: 'https://id.tuleva.ee' }, { freeze: false, assign: false });
      mockHttp.simpleFetch.mockResolvedValueOnce({ success: true });

      const result = await authenticateWithIdCard();

      expect(result).toBe(true);
      expect(mockHttp.simpleFetch).toHaveBeenCalledWith('POST', 'https://id.tuleva.ee/idLogin');
      expect(mockHttp.simpleFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should successfully logout the user', async () => {
      mockHttp.getWithAuthentication.mockResolvedValueOnce(undefined);

      await logout();

      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/logout', {});
      expect(mockAuthenticationRemove).toHaveBeenCalled();
    });
  });

  describe('getMobileIdTokens', () => {
    it('should retrieve mobile ID tokens successfully', async () => {
      const expectedToken = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockHttp.postForm.mockResolvedValueOnce({
        access_token: expectedToken.accessToken,
        refresh_token: expectedToken.refreshToken,
      });

      const token = await getMobileIdTokens();

      expect(token).toEqual(expectedToken);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockAuthenticationUpdate).toHaveBeenCalledWith({
        accessToken: expectedToken.accessToken,
        refreshToken: expectedToken.refreshToken,
        loginMethod: 'MOBILE_ID',
        signingMethod: 'MOBILE_ID',
      });
    });
  });

  describe('getSmartIdTokens', () => {
    const authenticationHash = 'auth-hash';

    it('should retrieve smart ID tokens successfully', async () => {
      const expectedToken = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockHttp.postForm.mockResolvedValueOnce({
        access_token: expectedToken.accessToken,
        refresh_token: expectedToken.refreshToken,
      });

      const token = await getSmartIdTokens(authenticationHash);

      expect(token).toEqual(expectedToken);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        {
          grant_type: 'SMART_ID',
          authenticationHash,
          client_id: 'onboarding-client',
        },
        expect.any(Object),
      );
      expect(mockAuthenticationUpdate).toHaveBeenCalledWith({
        accessToken: expectedToken.accessToken,
        refreshToken: expectedToken.refreshToken,
        loginMethod: 'SMART_ID',
        signingMethod: 'SMART_ID',
      });
    });
  });

  describe('getIdCardTokens', () => {
    it('should retrieve ID card tokens successfully', async () => {
      const expectedToken = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockHttp.postForm.mockResolvedValueOnce({
        access_token: expectedToken.accessToken,
        refresh_token: expectedToken.refreshToken,
      });

      const token = await getIdCardTokens();

      expect(token).toEqual(expectedToken);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockAuthenticationUpdate).toHaveBeenCalledWith({
        accessToken: expectedToken.accessToken,
        refreshToken: expectedToken.refreshToken,
        loginMethod: 'ID_CARD',
        signingMethod: 'ID_CARD',
      });
    });
  });

  it('can authenticate with mobile id', async () => {
    const phoneNumber = '1234567';
    const personalCode = '123456789';
    const expectedChallengeCode = '1234';
    mockHttp.post.mockResolvedValueOnce({ challengeCode: expectedChallengeCode });

    const challengeCode = await authenticateWithMobileId(phoneNumber, personalCode);
    expect(challengeCode).toBe(expectedChallengeCode);
    expect(mockHttp.post).toHaveBeenCalledWith('/authenticate', {
      phoneNumber,
      personalCode,
      type: 'MOBILE_ID',
    });
  });

  describe('authenticateWithIdCode', () => {
    it('should return both challengeCode and authenticationHash on successful authentication', async () => {
      const personalCode = '1223445567';
      const expectedAuthentication = {
        challengeCode: '1234',
        authenticationHash: 'abcd1234',
      };
      mockHttp.post.mockResolvedValueOnce(expectedAuthentication);

      const authentication = await authenticateWithIdCode(personalCode);
      expect(authentication).toEqual(expectedAuthentication);
      expect(mockHttp.post).toHaveBeenCalledWith('/authenticate', {
        personalCode,
        type: 'SMART_ID',
      });
    });
  });

  describe('getTokensWithGrantType', () => {
    const grantType = 'MOBILE_ID';
    const extraParameters = { phoneNumber: '1234567890' };
    const basicAuthHeader = 'Basic b25ib2FyZGluZy1jbGllbnQ6b25ib2FyZGluZy1jbGllbnQ=';

    it('successfully retrieves tokens', async () => {
      const expectedToken = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockHttp.postForm.mockResolvedValueOnce({
        access_token: expectedToken.accessToken,
        refresh_token: expectedToken.refreshToken,
      });

      const token = await getTokensWithGrantType(grantType, extraParameters);

      expect(token).toEqual(expectedToken);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        {
          grant_type: grantType,
          client_id: 'onboarding-client',
          ...extraParameters,
        },
        {
          Authorization: basicAuthHeader,
        },
      );
      expect(mockAuthenticationUpdate).toHaveBeenCalledWith({
        accessToken: expectedToken.accessToken,
        refreshToken: expectedToken.refreshToken,
        loginMethod: grantType,
        signingMethod: grantType,
      });
    });

    it('handles AUTHENTICATION_NOT_COMPLETE error by returning null', async () => {
      mockHttp.postForm.mockRejectedValueOnce({ error: 'AUTHENTICATION_NOT_COMPLETE' });

      const token = await getTokensWithGrantType(grantType, extraParameters);
      expect(token).toBeNull();
    });

    it('propagates unexpected errors', async () => {
      const expectedError = new Error('Network error');
      mockHttp.postForm.mockRejectedValueOnce(expectedError);

      await expect(getTokensWithGrantType(grantType, extraParameters)).rejects.toThrow(
        expectedError,
      );
    });

    it('propagates other errors', async () => {
      const expectedError = new Error('Network error');
      mockHttp.postForm.mockRejectedValueOnce(expectedError);

      await expect(getTokensWithGrantType(grantType, extraParameters)).rejects.toThrow(
        expectedError,
      );
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        {
          grant_type: grantType,
          client_id: 'onboarding-client',
          ...extraParameters,
        },
        {
          Authorization: basicAuthHeader,
        },
      );
    });

    it.each([
      ['MOBILE_ID', { phoneNumber: '1234567890' }],
      ['SMART_ID', { personalCode: '12345678901' }],
      ['ID_CARD', {}],
    ])('retrieves tokens for %s with specific parameters', async (grant, params) => {
      const expectedToken = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockHttp.postForm.mockResolvedValueOnce({
        access_token: expectedToken.accessToken,
        refresh_token: expectedToken.refreshToken,
      });

      const token = await getTokensWithGrantType(grant as LoginMethod, params);

      expect(token).toEqual(expectedToken);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: grant,
          ...params,
        }),
        expect.any(Object),
      );
      expect(mockAuthenticationUpdate).toHaveBeenCalledWith({
        accessToken: expectedToken.accessToken,
        refreshToken: expectedToken.refreshToken,
        loginMethod: grant,
        signingMethod: grant,
      });
    });
  });

  describe('downloadMandatePreviewWithIdAndToken', () => {
    const mandateId = '12345';
    const mockBlob = new Blob(['mock data'], { type: 'application/pdf' });

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.downloadFileWithAuthentication.mockResolvedValue(mockBlob);
    });

    it('downloads the mandate preview', async () => {
      const blob = await downloadMandatePreviewWithId(mandateId);

      expect(blob).toEqual(mockBlob);
      expect(mockHttp.downloadFileWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/file/preview`),
      );
    });
  });

  describe('downloadMandateWithIdAndToken', () => {
    const mandateId = '12345';
    const mockBlob = new Blob(['mock data'], { type: 'application/pdf' });

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.downloadFileWithAuthentication.mockResolvedValue(mockBlob);
    });

    it('downloads the mandate', async () => {
      const blob = await downloadMandateWithId(mandateId);

      expect(blob).toEqual(mockBlob);
      expect(mockHttp.downloadFileWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/file`),
      );
    });
  });

  describe('getUserWithToken', () => {
    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockUser);
    });

    it('retrieves the user', async () => {
      const user = await getUserWithToken();

      expect(user).toEqual(mockUser);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining('/v1/me'),
        undefined,
      );
    });
  });

  describe('getSourceFundsWithToken', () => {
    const mockFundBalances = [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva Maailma Aktsiate Pensionifond',
          pillar: 2,
          managementFeeRate: 0.0034,
          ongoingChargesFigure: 0.0047,
        },
        value: 10285.578286,
        unavailableValue: 500,
        currency: 'EUR',
        activeContributions: false,
        contributions: 1000,
        subtractions: 50,
        profit: 300,
      },
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600109443',
          name: 'Tuleva Maailma Võlakirjade Pensionifond',
          pillar: 2,
          managementFeeRate: 0.0039,
          ongoingChargesFigure: 0.0045,
        },
        value: 9939.16235298,
        unavailableValue: 200,
        currency: 'GBP',
        activeContributions: true,
        contributions: 2000,
        subtractions: 100,
        profit: 500,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockFundBalances);
    });

    it('retrieves and transforms source funds correctly', async () => {
      const sourceFunds = await getSourceFunds();

      expect(sourceFunds).toEqual([
        {
          isin: 'EE3600109435',
          price: 10285.578286,
          unavailablePrice: 500,
          activeFund: false,
          currency: 'EUR',
          name: 'Tuleva Maailma Aktsiate Pensionifond',
          fundManager: { name: 'Tuleva' },
          managementFeePercent: 0.34,
          pillar: 2,
          ongoingChargesFigure: 0.0047,
          contributions: 1000,
          subtractions: 50,
          profit: 300,
        },
        {
          isin: 'EE3600109443',
          price: 9939.16235298,
          unavailablePrice: 200,
          activeFund: true,
          currency: 'GBP',
          name: 'Tuleva Maailma Võlakirjade Pensionifond',
          fundManager: { name: 'Tuleva' },
          managementFeePercent: 0.39,
          pillar: 2,
          ongoingChargesFigure: 0.0045,
          contributions: 2000,
          subtractions: 100,
          profit: 500,
        },
      ]);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining('/v1/pension-account-statement'),
        {},
      );
    });
  });

  describe('saveMandateWithToken', () => {
    const mockMandate = 'mandate-data';
    const mockMandateResponse = {
      id: 'mandate-123',
      status: 'PENDING',
      details: 'Some details about the mandate',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.postWithAuthentication.mockResolvedValue(mockMandateResponse);
    });

    it('saves the mandate with the correct parameters', async () => {
      const mandateResponse = await saveMandateWithAuthentication(mockMandate);

      expect(mandateResponse).toEqual(mockMandateResponse);
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining('/v1/mandates'),
        mockMandate,
      );
    });
  });

  describe('getMobileIdSignatureChallengeCode', () => {
    const mandateId = '12345';
    const mockResponse = {
      challengeCode: '1234',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.putWithAuthentication.mockResolvedValue(mockResponse);
    });

    it('retrieves the mobile ID signature challenge code', async () => {
      const challengeCode = await getMobileIdSignatureChallengeCode({ entityId: mandateId });

      expect(challengeCode).toEqual(mockResponse.challengeCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/mobileId`),
        undefined,
      );
    });

    it('retrieves the mobile ID signature challenge code for mandate batch', async () => {
      const challengeCode = await getMobileIdSignatureChallengeCode({
        entityId: mandateId,
        type: 'MANDATE_BATCH',
      });

      expect(challengeCode).toEqual(mockResponse.challengeCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandate-batches/${mandateId}/signature/mobile-id`),
        undefined,
      );
    });
  });

  describe('getMobileIdSignatureStatus', () => {
    const mandateId = '12345';
    const mockStatusResponse = {
      statusCode: 'SIGNATURE',
      challengeCode: '1234',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockStatusResponse);
    });

    it('retrieves the mobile ID signature status with the correct parameters', async () => {
      const statusResponse = await getMobileIdSignatureStatus({ entityId: mandateId });

      expect(statusResponse).toEqual(mockStatusResponse);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/mobileId/status`),
        undefined,
      );
    });

    it('retrieves the mobile ID signature status with the correct parameters for mandate batch', async () => {
      const statusResponse = await getMobileIdSignatureStatus({
        entityId: mandateId,
        type: 'MANDATE_BATCH',
      });

      expect(statusResponse).toEqual(mockStatusResponse);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandate-batches/${mandateId}/signature/mobile-id/status`),
        undefined,
      );
    });
  });

  describe('getSmartIdSignatureChallengeCode', () => {
    const mandateId = '12345';
    const mockResponse = { challengeCode: 'challenge-123' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.putWithAuthentication.mockResolvedValue(mockResponse);
    });

    it('retrieves the smart ID signature challenge code correctly', async () => {
      const challengeCode = await getSmartIdSignatureChallengeCode({ entityId: mandateId });

      expect(challengeCode).toEqual(mockResponse.challengeCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/smartId`),
        undefined,
      );
    });

    it('retrieves the smart ID signature challenge code correctly for mandate batch', async () => {
      const challengeCode = await getSmartIdSignatureChallengeCode({
        entityId: mandateId,
        type: 'MANDATE_BATCH',
      });

      expect(challengeCode).toEqual(mockResponse.challengeCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandate-batches/${mandateId}/signature/smart-id`),
        undefined,
      );
    });
  });

  describe('getSmartIdSignatureStatus', () => {
    const mandateId = '12345';
    const mockStatusResponse = { statusCode: 'SIGNATURE', challengeCode: '1234' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockStatusResponse);
    });

    it('retrieves the smart ID signature status correctly', async () => {
      const statusResponse = await getSmartIdSignatureStatus({ entityId: mandateId });

      expect(statusResponse).toEqual(mockStatusResponse);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/smartId/status`),
        undefined,
      );
    });

    it('retrieves the smart ID signature status correctly for mandate batch', async () => {
      const statusResponse = await getSmartIdSignatureStatus({
        entityId: mandateId,
        type: 'MANDATE_BATCH',
      });

      expect(statusResponse).toEqual(mockStatusResponse);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandate-batches/${mandateId}/signature/smart-id/status`),
        undefined,
      );
    });
  });

  describe('getIdCardSignatureHash', () => {
    const mandateId = '12345';
    const certificateHex = 'cert-123';
    const mockResponse = { hash: 'hash-123' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.putWithAuthentication.mockResolvedValue(mockResponse);
    });

    it('retrieves the ID card signature hash correctly', async () => {
      const hash = await getIdCardSignatureHash({
        entityId: mandateId,
        certificateHex,
      });

      expect(hash).toEqual(mockResponse.hash);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/idCard`),
        { clientCertificate: certificateHex },
      );
    });

    it('retrieves the ID card signature hash correctly for mandate batch', async () => {
      const hash = await getIdCardSignatureHash({
        entityId: mandateId,
        certificateHex,
        type: 'MANDATE_BATCH',
      });

      expect(hash).toEqual(mockResponse.hash);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandate-batches/${mandateId}/signature/id-card`),
        { clientCertificate: certificateHex },
      );
    });
  });

  describe('getIdCardSignatureStatus', () => {
    const mandateId = '12345';
    const signedHash = 'signed-hash-123';
    const mockResponse = { statusCode: 'SIGNATURE' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.putWithAuthentication.mockResolvedValue(mockResponse);
    });

    it('retrieves the ID card signature status correctly', async () => {
      const statusCode = await getIdCardSignatureStatus({ entityId: mandateId, signedHash });

      expect(statusCode).toEqual(mockResponse.statusCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/idCard/status`),
        { signedHash },
      );
    });

    it('retrieves the ID card signature status correctly for mandate batch', async () => {
      const statusCode = await getIdCardSignatureStatus({
        entityId: mandateId,
        signedHash,
        type: 'MANDATE_BATCH',
      });

      expect(statusCode).toEqual(mockResponse.statusCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/mandate-batches/${mandateId}/signature/id-card/status`),
        { signedHash },
      );
    });
  });

  describe('updateUserWithToken', () => {
    const mockUser: User = {
      id: 1,
      personalCode: '12345678901',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '1234567',
      memberNumber: 123,
      memberJoinDate: null,
      pensionAccountNumber: 'EE123',
      secondPillarPikNumber: '1234567',
      address: { countryCode: 'EE' },
      secondPillarActive: true,
      thirdPillarActive: false,
      dateOfBirth: '1980-01-01',
      age: 40,
      retirementAge: 65,
      secondPillarPaymentRates: { current: 2, pending: 4 },
      secondPillarOpenDate: '2020-01-01',
      thirdPillarInitDate: '2021-01-01',
      contactDetailsLastUpdateDate: '2024-01-01',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.patchWithAuthentication.mockResolvedValue(mockUser);
    });

    it('updates the user correctly', async () => {
      const updatedUser = await updateUserWithToken(mockUser);

      expect(updatedUser).toEqual(mockUser);
      expect(mockHttp.patchWithAuthentication).toHaveBeenCalledWith('/v1/me', mockUser);
    });

    it('updates the user and verifies returned data integrity', async () => {
      const userToUpdate = mockUser;
      const updatedUser = { ...userToUpdate, id: 'user-123' };
      mockHttp.patchWithAuthentication.mockResolvedValueOnce(updatedUser);

      const result = await updateUserWithToken(userToUpdate);
      expect(result).toEqual(updatedUser);
      expect(mockHttp.patchWithAuthentication).toHaveBeenCalledWith('/v1/me', userToUpdate);
    });
  });

  describe('getUserConversionWithToken', () => {
    const mockConversion: UserConversion = {
      secondPillar: {
        selectionComplete: true,
        selectionPartial: false,
        transfersComplete: true,
        transfersPartial: false,
        paymentComplete: true,
        pendingWithdrawal: false,
        contribution: { yearToDate: 1000, lastYear: 500, total: 1500 },
        subtraction: { yearToDate: 100, lastYear: 50, total: 150 },
        weightedAverageFee: 0.5,
      },
      thirdPillar: {
        selectionComplete: false,
        selectionPartial: true,
        transfersComplete: false,
        transfersPartial: true,
        paymentComplete: false,
        pendingWithdrawal: true,
        contribution: { yearToDate: 500, lastYear: 250, total: 750 },
        subtraction: { yearToDate: 50, lastYear: 25, total: 75 },
        weightedAverageFee: 0.3,
      },
      weightedAverageFee: 0.4,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockConversion);
    });

    it('retrieves user conversion correctly', async () => {
      const conversion = await getUserConversionWithToken();

      expect(conversion).toEqual(mockConversion);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/me/conversion', undefined);
    });
  });

  describe('getCapitalRowsWithToken', () => {
    const mockCapital: CapitalRow[] = [
      {
        type: 'CAPITAL_PAYMENT',
        contributions: 100,
        profit: 50,
        value: 150,
        unitCount: 100,
        unitPrice: 1.5,
        currency: 'EUR',
      },
      {
        type: 'UNVESTED_WORK_COMPENSATION',
        contributions: 200,
        profit: 100,
        value: 300,
        unitCount: 200,
        unitPrice: 1.5,
        currency: 'EUR',
      },
      {
        type: 'WORK_COMPENSATION',
        contributions: 300,
        profit: 150,
        value: 450,
        unitCount: 300,
        unitPrice: 1.5,
        currency: 'EUR',
      },
      {
        type: 'MEMBERSHIP_BONUS',
        contributions: 400,
        profit: 200,
        value: 600,
        unitCount: 400,
        unitPrice: 1.5,
        currency: 'EUR',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockCapital);
    });

    it('retrieves initial capital correctly', async () => {
      const capital = await getCapitalRowsWithToken();

      expect(capital).toEqual(mockCapital);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/me/capital', undefined);
    });
  });

  describe('createAmlCheck', () => {
    const mockAmlCheck: AmlCheck = {
      type: 'ID_DOCUMENT',
      success: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.postWithAuthentication.mockResolvedValue(mockAmlCheck);
    });

    it('creates an AML check correctly', async () => {
      const amlCheck = await createAmlCheck('ID_DOCUMENT', true, {});

      expect(amlCheck).toEqual(mockAmlCheck);
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith('/v1/amlchecks', {
        type: 'ID_DOCUMENT',
        success: true,
        metadata: {},
      });
    });
  });

  describe('getMissingAmlChecks', () => {
    const mockAmlChecks: AmlCheck[] = [{ type: 'ID_DOCUMENT', success: true }];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockAmlChecks);
    });

    it('retrieves missing AML checks correctly', async () => {
      const amlChecks = await getMissingAmlChecks();

      expect(amlChecks).toEqual(mockAmlChecks);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/amlchecks', undefined);
    });
  });

  describe('getFunds', () => {
    const mockFunds: Fund[] = [
      {
        isin: 'EE3600109435',
        name: 'Tuleva World Stocks Pension Fund',
        pillar: 2,
        managementFeeRate: 0.0034,
        ongoingChargesFigure: 0.0047,
        fundManager: { name: 'Tuleva' },
        status: 'ACTIVE',
        inceptionDate: '2017-01-01',
        nav: 1,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockFunds);
    });

    it('retrieves funds correctly', async () => {
      const funds = await getFunds();

      expect(funds).toEqual(mockFunds);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/funds');
    });
  });

  describe('getPendingApplications', () => {
    const mockApplications: Application[] = [
      {
        id: 1,
        status: 'PENDING',
        creationTime: '2020-01-01T00:00:00Z',
        type: 'TRANSFER',
        details: {
          sourceFund: {
            nav: 1,
            isin: 'EE3600109435',
            name: 'Tuleva World Stocks Pension Fund',
            pillar: 2,
            managementFeeRate: 0.0034,
            ongoingChargesFigure: 0.0047,
            fundManager: { name: 'Tuleva' },
            status: 'ACTIVE',
            inceptionDate: '2017-01-01',
          },
          exchanges: [],
          cancellationDeadline: '2020-02-01',
        },
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockApplications);
    });

    it('retrieves pending applications correctly', async () => {
      const applications = await getPendingApplications();

      expect(applications).toEqual(mockApplications);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/applications', {
        status: 'PENDING',
      });
    });
  });

  describe('getTransactions', () => {
    const mockTransactions: Transaction[] = [
      {
        amount: 100,
        currency: 'EUR',
        time: '2020-01-01T00:00:00Z',
        isin: 'EE3600109435',
        type: 'CONTRIBUTION_CASH',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockTransactions);
    });

    it('retrieves transactions correctly', async () => {
      const transactions = await getTransactions();

      expect(transactions).toEqual(mockTransactions);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/transactions', undefined);
    });
  });

  describe('getContributions', () => {
    const mockContributions: ThirdPillarContribution[] = [
      { time: '2020-01-01T00:00:00Z', sender: 'Employer', amount: 100, currency: 'EUR', pillar: 3 },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockContributions);
    });

    it('retrieves contributions correctly', async () => {
      const contributions = await getContributions();

      expect(contributions).toEqual(mockContributions);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/contributions', undefined);
    });
  });

  describe('getMandateDeadlines', () => {
    const mockMandateDeadlines: MandateDeadlines = {
      transferMandateFulfillmentDate: '2020-02-01',
      periodEnding: '2020-01-31',
      withdrawalFulfillmentDate: '2020-03-15',
      withdrawalLatestFulfillmentDate: '2020-03-20',
      earlyWithdrawalFulfillmentDate: '2020-02-15',
      transferMandateCancellationDeadline: '2020-01-15',
      withdrawalCancellationDeadline: '2020-02-15',
      earlyWithdrawalCancellationDeadline: '2020-01-20',
      paymentRateDeadline: '2020-01-10',
      paymentRateFulfillmentDate: '2020-02-10',
      secondPillarContributionEndDate: '2021-04-01',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockMandateDeadlines);
    });

    it('retrieves mandate deadlines correctly', async () => {
      const mandateDeadlines = await getMandateDeadlines();

      expect(mandateDeadlines).toEqual(mockMandateDeadlines);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        '/v1/mandate-deadlines',
        undefined,
      );
    });
  });

  describe('createApplicationCancellation', () => {
    const applicationId = 1;
    const mockCancellationMandate: CancellationMandate = { mandateId: applicationId };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.postWithAuthentication.mockResolvedValue(mockCancellationMandate);
    });

    it('creates application cancellation correctly', async () => {
      const cancellationMandate = await createApplicationCancellation(applicationId);

      expect(cancellationMandate).toEqual(mockCancellationMandate);
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith(
        `/v1/applications/${applicationId}/cancellations`,
        {},
      );
    });
  });

  describe('createTrackedEvent', () => {
    const eventType = 'PAGE_VIEW';
    const eventData = { page: 'home' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.postWithAuthentication.mockResolvedValue({ type: eventType, data: eventData });
    });

    it('creates a tracked event correctly', async () => {
      const trackedEvent = await createTrackedEvent(eventType, eventData);

      expect(trackedEvent).toEqual({ type: eventType, data: eventData });
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith('/v1/t', {
        type: eventType,
        data: eventData,
      });
    });
  });

  describe('getPaymentLink', () => {
    const mockPayment: Payment = {
      type: 'SINGLE',
      paymentChannel: 'SWEDBANK',
      recipientPersonalCode: '12345678901',
      amount: 100,
      currency: 'EUR',
    };
    const mockPaymentLink: PaymentLink = { url: 'https://example.com/payment' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockPaymentLink);
    });

    it('retrieves payment link correctly', async () => {
      const paymentLink = await getPaymentLink(mockPayment);

      expect(paymentLink).toEqual(mockPaymentLink);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith('/v1/payments/link', mockPayment);
    });
  });

  describe('redirectToPayment', () => {
    const mockPayment: Payment = {
      type: 'SINGLE',
      paymentChannel: 'SWEDBANK',
      recipientPersonalCode: '12345678901',
      amount: 100,
      currency: 'EUR',
    };
    const mockPaymentLink: PaymentLink = { url: 'https://example.com/payment' };

    beforeEach(() => {
      jest.clearAllMocks();

      window.open = jest.fn().mockImplementation(() => ({
        document: { write: jest.fn() },
        location: { replace: jest.fn() }, // Add location.replace to the new window mock if needed
      }));

      mockHttp.getWithAuthentication.mockResolvedValue(mockPaymentLink);
    });
    const originalLocation = window.location;
    let replaceSpy: jest.SpyInstance;
    let openSpy: jest.SpyInstance;

    beforeAll(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete window.location;
      window.location = { replace: jest.fn() } as any;
      replaceSpy = jest.spyOn(window.location, 'replace');
      openSpy = jest.spyOn(window, 'open').mockImplementation(
        () =>
          ({
            document: { write: jest.fn() },
          } as any),
      );
    });

    afterAll(() => {
      window.location = originalLocation;
    });

    it('redirects to payment link for non-recurring payments', async () => {
      mockPayment.type = 'SINGLE';
      redirectToPayment(mockPayment);

      // Use setTimeout as an alternative to setImmediate
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(expect.any(String), mockPayment);
      expect(replaceSpy).toHaveBeenCalledWith(mockPaymentLink.url);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('opens a new window for recurring payments and writes "Loading..."', async () => {
      mockPayment.type = 'RECURRING';
      redirectToPayment(mockPayment);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(expect.any(String), mockPayment);

      expect(window.open).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const newWindow = window.open.mock.results[0].value;
      expect(newWindow.document.write).toHaveBeenCalledWith('Loading...');
    });
  });

  describe('getSavingsFundBalance', () => {
    const mockSavingsAccountStatement = {
      fund: {
        fundManager: {
          name: 'Tuleva',
        },
        isin: 'EE0000000000',
        name: 'Tuleva Täiendav Kogumisfond',
        managementFeeRate: 0.002,
        pillar: null,
        ongoingChargesFigure: 0.0045,
        status: 'ACTIVE',
        inceptionDate: '2025-10-01',
      },
      value: 12,
      unavailableValue: null,
      currency: 'EUR',
      activeContributions: null,
      contributions: 10,
      subtractions: 0,
      profit: 2,
      units: 10,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockSavingsAccountStatement);
    });

    it('retrieves and transforms savings fund balance correctly', async () => {
      const savingsFundBalance = await getSavingsFundBalance();

      expect(savingsFundBalance).toEqual({
        isin: 'EE0000000000',
        price: 12,
        unavailablePrice: 0,
        activeFund: null,
        currency: 'EUR',
        name: 'Tuleva Täiendav Kogumisfond',
        fundManager: { name: 'Tuleva' },
        managementFeePercent: 0.2,
        pillar: null,
        ongoingChargesFigure: 0.0045,
        contributions: 10,
        subtractions: 0,
        profit: 2,
        units: 10,
      });
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        expect.stringContaining('/v1/savings-account-statement'),
      );
    });
  });
});

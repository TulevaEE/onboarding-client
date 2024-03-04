import config from 'react-global-configuration';
import {
  authenticateWithIdCard,
  authenticateWithIdCode,
  authenticateWithMobileId,
  createAmlCheck,
  createApplicationCancellation,
  createTrackedEvent,
  downloadMandatePreviewWithIdAndToken,
  downloadMandateWithIdAndToken,
  getContributions,
  getFunds,
  getIdCardSignatureHash,
  getIdCardSignatureStatus,
  getIdCardTokens,
  getInitialCapitalWithToken,
  getMandateDeadlines,
  getMissingAmlChecks,
  getMobileIdSignatureChallengeCode,
  getMobileIdSignatureStatus,
  getMobileIdTokens,
  getPaymentLink,
  getPendingApplications,
  getSmartIdSignatureChallengeCode,
  getSmartIdSignatureStatus,
  getSmartIdTokens,
  getSourceFundsWithToken,
  getTokensWithGrantType,
  getTransactions,
  getUserConversionWithToken,
  getUserWithToken,
  logout,
  redirectToPayment,
  saveMandateWithToken,
  updateUserWithToken,
} from './api';
import * as http from './http';
import {
  AmlCheck,
  Application,
  ApplicationStatus,
  ApplicationType,
  CancellationMandate,
  Contribution,
  Fund,
  FundStatus,
  InitialCapital,
  MandateDeadlines,
  Payment,
  PaymentChannel,
  PaymentLink,
  PaymentType,
  Transaction,
  TransactionType,
  User,
  UserConversion,
} from './apiModels';
import { UpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal';
import { anUpdatableAuthenticationPrincipal } from './updatableAuthenticationPrincipal.test';

jest.mock('./http');

const mockHttp = http as jest.Mocked<typeof http>;

describe('API calls', () => {
  let mockPrincipal: UpdatableAuthenticationPrincipal;

  beforeEach(() => {
    mockPrincipal = anUpdatableAuthenticationPrincipal();
    config.set({ idCardUrl: 'https://id.tuleva.ee' }, { freeze: false, assign: false });
    jest.clearAllMocks();
  });

  describe('authenticateWithIdCard', () => {
    it('should authenticate using ID card successfully', async () => {
      mockHttp.simpleFetch.mockResolvedValueOnce({});

      mockHttp.simpleFetch.mockResolvedValueOnce({ success: true });

      const result = await authenticateWithIdCard();

      expect(result).toBe(true);
      expect(mockHttp.simpleFetch).toHaveBeenCalledWith('GET', 'https://id.tuleva.ee');
      expect(mockHttp.simpleFetch).toHaveBeenCalledWith('POST', 'https://id.tuleva.ee/idLogin');
    });
  });

  describe('logout', () => {
    it('should successfully logout the user', async () => {
      mockHttp.getWithAuthentication.mockResolvedValueOnce(undefined);

      await logout(mockPrincipal);

      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(mockPrincipal, '/v1/logout', {});
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

      const token = await getTokensWithGrantType(grant, params);

      expect(token).toEqual(expectedToken);
      expect(mockHttp.postForm).toHaveBeenCalledWith(
        '/oauth/token',
        expect.objectContaining({
          grant_type: grant,
          ...params,
        }),
        expect.any(Object),
      );
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
      const blob = await downloadMandatePreviewWithIdAndToken(mandateId, mockPrincipal);

      expect(blob).toEqual(mockBlob);
      expect(mockHttp.downloadFileWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
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
      const blob = await downloadMandateWithIdAndToken(mandateId, mockPrincipal);

      expect(blob).toEqual(mockBlob);
      expect(mockHttp.downloadFileWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
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
      const user = await getUserWithToken(mockPrincipal);

      expect(user).toEqual(mockUser);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
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
      const sourceFunds = await getSourceFundsWithToken(mockPrincipal);

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
        mockPrincipal,
        expect.stringContaining('/v1/pension-account-statement'),
        undefined,
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
      const mandateResponse = await saveMandateWithToken(mockMandate, mockPrincipal);

      expect(mandateResponse).toEqual(mockMandateResponse);
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
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
      const challengeCode = await getMobileIdSignatureChallengeCode(mandateId, mockPrincipal);

      expect(challengeCode).toEqual(mockResponse.challengeCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/mobileId`),
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
      const statusResponse = await getMobileIdSignatureStatus(mandateId, mockPrincipal);

      expect(statusResponse).toEqual(mockStatusResponse);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/mobileId/status`),
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
      const challengeCode = await getSmartIdSignatureChallengeCode(mandateId, mockPrincipal);

      expect(challengeCode).toEqual(mockResponse.challengeCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/smartId`),
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
      const statusResponse = await getSmartIdSignatureStatus(mandateId, mockPrincipal);

      expect(statusResponse).toEqual(mockStatusResponse);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/smartId/status`),
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
      const hash = await getIdCardSignatureHash(mandateId, certificateHex, mockPrincipal);

      expect(hash).toEqual(mockResponse.hash);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/idCard`),
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
      const statusCode = await getIdCardSignatureStatus(mandateId, signedHash, mockPrincipal);

      expect(statusCode).toEqual(mockResponse.statusCode);
      expect(mockHttp.putWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.stringContaining(`/v1/mandates/${mandateId}/signature/idCard/status`),
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
      pensionAccountNumber: 'EE123',
      secondPillarPikNumber: '1234567',
      address: { countryCode: 'EE' },
      secondPillarActive: true,
      thirdPillarActive: false,
      dateOfBirth: '1980-01-01',
      age: 40,
      retirementAge: 65,
      secondPillarPaymentRates: { current: 2, pending: 4 },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.patchWithAuthentication.mockResolvedValue(mockUser);
    });

    it('updates the user correctly', async () => {
      const updatedUser = await updateUserWithToken(mockUser, mockPrincipal);

      expect(updatedUser).toEqual(mockUser);
      expect(mockHttp.patchWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/me',
        mockUser,
      );
    });

    it('updates the user and verifies returned data integrity', async () => {
      const userToUpdate = mockUser;
      const updatedUser = { ...userToUpdate, id: 'user-123' };
      mockHttp.patchWithAuthentication.mockResolvedValueOnce(updatedUser);

      const result = await updateUserWithToken(userToUpdate, mockPrincipal);
      expect(result).toEqual(updatedUser);
      expect(mockHttp.patchWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/me',
        userToUpdate,
      );
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
      const conversion = await getUserConversionWithToken(mockPrincipal);

      expect(conversion).toEqual(mockConversion);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/me/conversion',
        undefined,
      );
    });
  });

  describe('getInitialCapitalWithToken', () => {
    const mockCapital: InitialCapital = {
      membershipBonus: 100,
      capitalPayment: 200,
      unvestedWorkCompensation: 50,
      workCompensation: 150,
      profit: 300,
      total: 800,
      currency: 'EUR',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockCapital);
    });

    it('retrieves initial capital correctly', async () => {
      const capital = await getInitialCapitalWithToken(mockPrincipal);

      expect(capital).toEqual(mockCapital);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/me/capital',
        undefined,
      );
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
      const amlCheck = await createAmlCheck('ID_DOCUMENT', true, {}, mockPrincipal);

      expect(amlCheck).toEqual(mockAmlCheck);
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith(mockPrincipal, '/v1/amlchecks', {
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
      const amlChecks = await getMissingAmlChecks(mockPrincipal);

      expect(amlChecks).toEqual(mockAmlChecks);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/amlchecks',
        undefined,
      );
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
        status: FundStatus.ACTIVE,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockFunds);
    });

    it('retrieves funds correctly', async () => {
      const funds = await getFunds(mockPrincipal);

      expect(funds).toEqual(mockFunds);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(mockPrincipal, '/v1/funds');
    });
  });

  describe('getPendingApplications', () => {
    const mockApplications: Application[] = [
      {
        id: 1,
        status: ApplicationStatus.PENDING,
        creationTime: '2020-01-01T00:00:00Z',
        type: ApplicationType.TRANSFER,
        details: {
          sourceFund: {
            isin: 'EE3600109435',
            name: 'Tuleva World Stocks Pension Fund',
            pillar: 2,
            managementFeeRate: 0.0034,
            ongoingChargesFigure: 0.0047,
            fundManager: { name: 'Tuleva' },
            status: FundStatus.ACTIVE,
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
      const applications = await getPendingApplications(mockPrincipal);

      expect(applications).toEqual(mockApplications);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/applications',
        { status: 'PENDING' },
      );
    });
  });

  describe('getTransactions', () => {
    const mockTransactions: Transaction[] = [
      {
        amount: 100,
        currency: 'EUR',
        time: '2020-01-01T00:00:00Z',
        isin: 'EE3600109435',
        type: TransactionType.CONTRIBUTION_CASH,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockTransactions);
    });

    it('retrieves transactions correctly', async () => {
      const transactions = await getTransactions(mockPrincipal);

      expect(transactions).toEqual(mockTransactions);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/transactions',
        undefined,
      );
    });
  });

  describe('getContributions', () => {
    const mockContributions: Contribution[] = [
      { time: '2020-01-01T00:00:00Z', sender: 'Employer', amount: 100, currency: 'EUR', pillar: 2 },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockContributions);
    });

    it('retrieves contributions correctly', async () => {
      const contributions = await getContributions(mockPrincipal);

      expect(contributions).toEqual(mockContributions);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/contributions',
        undefined,
      );
    });
  });

  describe('getMandateDeadlines', () => {
    const mockMandateDeadlines: MandateDeadlines = {
      transferMandateFulfillmentDate: '2020-02-01',
      periodEnding: '2020-01-31',
      withdrawalFulfillmentDate: '2020-03-01',
      earlyWithdrawalFulfillmentDate: '2020-02-15',
      transferMandateCancellationDeadline: '2020-01-15',
      withdrawalCancellationDeadline: '2020-02-15',
      earlyWithdrawalCancellationDeadline: '2020-01-20',
      paymentRateDeadline: '2020-01-10',
      paymentRateFulfillmentDate: '2020-02-10',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockHttp.getWithAuthentication.mockResolvedValue(mockMandateDeadlines);
    });

    it('retrieves mandate deadlines correctly', async () => {
      const mandateDeadlines = await getMandateDeadlines(mockPrincipal);

      expect(mandateDeadlines).toEqual(mockMandateDeadlines);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
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
      const cancellationMandate = await createApplicationCancellation(applicationId, mockPrincipal);

      expect(cancellationMandate).toEqual(mockCancellationMandate);
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
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
      const trackedEvent = await createTrackedEvent(eventType, eventData, mockPrincipal);

      expect(trackedEvent).toEqual({ type: eventType, data: eventData });
      expect(mockHttp.postWithAuthentication).toHaveBeenCalledWith(mockPrincipal, '/v1/t', {
        type: eventType,
        data: eventData,
      });
    });
  });

  describe('getPaymentLink', () => {
    const mockPayment: Payment = {
      type: PaymentType.SINGLE,
      paymentChannel: PaymentChannel.SWEDBANK,
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
      const paymentLink = await getPaymentLink(mockPayment, mockPrincipal);

      expect(paymentLink).toEqual(mockPaymentLink);
      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        '/v1/payments/link',
        mockPayment,
      );
    });
  });

  describe('redirectToPayment', () => {
    const mockPayment: Payment = {
      type: PaymentType.SINGLE,
      paymentChannel: PaymentChannel.SWEDBANK,
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
      mockPayment.type = PaymentType.SINGLE;
      redirectToPayment(mockPayment, mockPrincipal);

      // Use setTimeout as an alternative to setImmediate
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.any(String),
        mockPayment,
      );
      expect(replaceSpy).toHaveBeenCalledWith(mockPaymentLink.url);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('opens a new window for recurring payments and writes "Loading..."', async () => {
      mockPayment.type = PaymentType.RECURRING;
      redirectToPayment(mockPayment, mockPrincipal);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockHttp.getWithAuthentication).toHaveBeenCalledWith(
        mockPrincipal,
        expect.any(String),
        mockPayment,
      );

      expect(window.open).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const newWindow = window.open.mock.results[0].value;
      expect(newWindow.document.write).toHaveBeenCalledWith('Loading...');
    });
  });
});

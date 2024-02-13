import {
  CHANGE_AGREEMENT_TO_TERMS,
  GET_SOURCE_FUNDS_ERROR,
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,
  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  NO_SIGN_MANDATE_ERROR,
  SELECT_EXCHANGE_SOURCES,
  SELECT_TARGET_FUND,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_SMART_ID_START,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
} from './constants';

const mockApi = jest.genMockFromModule('../common/api');
const mockDownload = jest.fn();
const mockHwcrypto = jest.genMockFromModule('hwcrypto-js');

jest.mock('../common/api', () => mockApi);
jest.mock('downloadjs', () => mockDownload);
jest.mock('hwcrypto-js', () => mockHwcrypto);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actions = require('./actions'); // need to use require because of jest mocks being weird

function nextTick() {
  return Promise.resolve();
}

describe('Exchange actions', () => {
  let dispatch;
  let state;

  function createBoundAction(action) {
    return (...args) => action(...args)(dispatch, () => state);
  }

  function mockDispatch() {
    state = { login: { token: 'token' }, exchange: {} };
    dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        action(dispatch, () => state);
      }
      return Promise.resolve();
    });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken = () => Promise.reject();
    mockApi.saveMandateWithToken = () => Promise.reject();
    mockApi.getMobileIdSignatureStatusForMandateIdWithToken = () => Promise.reject();
  });

  describe('When getting source funds', () => {
    it('can get pension funds', async () => {
      const sourceFunds = [{ iAmPensionFunds: true }];
      mockApi.getSourceFundsWithToken = jest.fn(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_START });
        dispatch.mockClear();
        return Promise.resolve(sourceFunds);
      });
      const getSourceFunds = createBoundAction(actions.getSourceFunds);
      expect(dispatch).not.toHaveBeenCalled();
      await getSourceFunds();
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_SOURCE_FUNDS_SUCCESS,
        sourceFunds,
      });
    });

    it('can handle errors when getting pension funds', async () => {
      const error = new Error('oh no!');
      mockApi.getSourceFundsWithToken = jest.fn(() => Promise.reject(error));
      const getSourceFunds = createBoundAction(actions.getSourceFunds);
      expect(dispatch).not.toHaveBeenCalled();
      await getSourceFunds();
      expect(dispatch).toHaveBeenCalledWith({
        type: GET_SOURCE_FUNDS_ERROR,
        error,
      });
    });
  });

  it('can select an exchange', () => {
    const sourceSelection = [{ exchangeMe: true }];
    expect(actions.selectExchangeSources(sourceSelection)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    });
    expect(actions.selectExchangeSources(sourceSelection, true)).toEqual({
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: true,
    });
  });

  it('can get target funds', async () => {
    const targetFunds = [{ iAmPensionFunds: true }];
    mockApi.getFunds = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_TARGET_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(targetFunds);
    });
    const getTargetFunds = createBoundAction(actions.getTargetFunds);
    expect(dispatch).not.toHaveBeenCalled();
    await getTargetFunds();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: GET_TARGET_FUNDS_SUCCESS,
      targetFunds,
    });
  });

  it('can handle errors when getting target funds', async () => {
    const error = new Error('oh no!');
    mockApi.getFunds = jest.fn(() => Promise.reject(error));
    const getTargetFunds = createBoundAction(actions.getTargetFunds);
    expect(dispatch).not.toHaveBeenCalled();
    await getTargetFunds();
    expect(dispatch).toHaveBeenCalledWith({
      type: GET_TARGET_FUNDS_ERROR,
      error,
    });
  });

  it('can change agreement to terms', () => {
    [true, false].forEach((agreement) =>
      expect(actions.changeAgreementToTerms(agreement)).toEqual({
        type: CHANGE_AGREEMENT_TO_TERMS,
        agreement,
      }),
    );
  });

  it('can select future contributions fund fund', () => {
    const targetFundIsin = 'AAA';
    expect(actions.selectFutureContributionsFund(targetFundIsin)).toEqual({
      type: SELECT_TARGET_FUND,
      targetFundIsin,
    });
  });

  it('can download the mandate', async () => {
    state.login.token = 'token';
    state.exchange.signedMandateId = 'mandate id';
    const file = { iAmAFakeFile: true };
    mockApi.downloadMandateWithIdAndToken = jest.fn(() => Promise.resolve(file));
    const downloadMandate = createBoundAction(actions.downloadMandate);
    await downloadMandate();
    expect(mockApi.downloadMandateWithIdAndToken).toHaveBeenCalledWith('mandate id', 'token');
    expect(mockDownload).toHaveBeenCalledWith(file, 'Tuleva_avaldus.bdoc', 'application/bdoc');
  });

  it('will not download the mandate if mandate id is missing', async () => {
    state.login.token = 'token';
    state.exchange.signedMandateId = null;
    const file = { iAmAFakeFile: true };
    mockApi.downloadMandateWithIdAndToken = jest.fn(() => Promise.resolve(file));
    const downloadMandate = createBoundAction(actions.downloadMandate);
    await downloadMandate();
    expect(mockApi.downloadMandateWithIdAndToken).not.toHaveBeenCalled();
  });

  it('can preview the mandate', async () => {
    state.login.token = 'token';
    const file = { iAmAFakeFile: true };
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve({ id: 'mandate id' }));
    mockApi.downloadMandatePreviewWithIdAndToken = jest.fn(() => Promise.resolve(file));
    const previewMandate = createBoundAction(actions.previewMandate);
    await previewMandate();
    expect(mockApi.downloadMandatePreviewWithIdAndToken).toHaveBeenCalledWith(
      'mandate id',
      'token',
    );
    expect(mockDownload).toHaveBeenCalledWith(
      file,
      'Tuleva_avaldus_eelvaade.zip',
      'application/zip',
    );
  });

  it('can sign the mandate with mobile id', async () => {
    state.login.token = 'token';
    const mandate = { id: 'mandate id' };
    const controlCode = '1337';

    mockApi.saveMandateWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: SIGN_MANDATE_MOBILE_ID_START,
      });
      dispatch.mockClear();
      return Promise.resolve(mandate);
    });
    mockApi.getMobileIdSignatureChallengeCode = jest.fn(() => {
      expect(mockApi.saveMandateWithToken).toHaveBeenCalledTimes(1);
      expect(mockApi.saveMandateWithToken).toHaveBeenCalledWith({}, 'token');
      return Promise.resolve(controlCode);
    });
    mockApi.getMobileIdSignatureStatus = jest.fn(() =>
      Promise.resolve({ statusCode: 'OUTSTANDING_TRANSACTION' }),
    );
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    expect(dispatch).not.toHaveBeenCalled();
    await signMandate({});
    expect(mockApi.getMobileIdSignatureChallengeCode).toHaveBeenCalledTimes(1);
    expect(mockApi.getMobileIdSignatureChallengeCode).toHaveBeenCalledWith(mandate.id, 'token');
    expect(dispatch).toHaveBeenCalledTimes(2); // calls next action to start polling as well.
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
      controlCode,
    });
  });

  it('starts polling until succeeds when signing the mandate with mobile id', async () => {
    state.login.token = 'token';

    const mandate = { id: 'id', pillar: 2 };
    const controlCode = '1337';
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));
    mockApi.getMobileIdSignatureChallengeCode = jest.fn(() => Promise.resolve(controlCode));
    mockApi.getMobileIdSignatureStatus = jest.fn(() =>
      Promise.resolve({ statusCode: 'OUTSTANDING_TRANSACTION' }),
    );
    const signMandate = createBoundAction(actions.signMandateWithMobileId);

    await signMandate({});
    dispatch.mockClear();

    mockApi.getMobileIdSignatureStatus = jest.fn(() =>
      Promise.resolve({ statusCode: 'SIGNATURE' }),
    );
    jest.runOnlyPendingTimers();

    expect(dispatch).not.toHaveBeenCalled();
    expect(mockApi.getMobileIdSignatureStatus).toHaveBeenCalledTimes(1);
    expect(mockApi.getMobileIdSignatureStatus).toHaveBeenCalledWith('id', 'token');
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_SUCCESS,
      signedMandateId: mandate.id,
      pillar: mandate.pillar,
    });
  });

  it('starts polling until fails when signing the mandate with mobile id', async () => {
    state.login.token = 'token';

    const mandate = { id: 'id' };
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));
    mockApi.getMobileIdSignatureChallengeCode = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdSignatureStatus = jest.fn(() => Promise.resolve('OUTSTANDING_TRANSACTION'));
    const error = new Error('oh no dude');
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    await signMandate({});
    dispatch.mockClear();
    mockApi.getMobileIdSignatureStatus = jest.fn(() => Promise.reject(error));
    jest.runOnlyPendingTimers();
    await nextTick();
    expect(dispatch).not.toHaveBeenCalled();
    expect(mockApi.getMobileIdSignatureStatus).toHaveBeenCalledTimes(1);

    jest.runOnlyPendingTimers();
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_ERROR,
      error,
    });
  });

  it('can handle errors when starting to sign the mandate with mobile id', async () => {
    const error = new Error('oh no it failed 1');
    mockApi.saveMandateWithToken = jest.fn(() => {
      dispatch.mockClear();
      return Promise.reject(error);
    });
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    await signMandate({});
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_START_ERROR,
      error,
    });
  });

  it('starts polling until succeeds when signing the mandate with id card', async () => {
    state.login.token = 'token';

    const mandate = { id: 'id', pillar: 2 };
    const hash = 'hash';
    const certificate = { hex: 'certificate' };
    const signedHash = { hex: 'signedHash' };

    global.hwcrypto = mockHwcrypto;
    mockHwcrypto.getCertificate = jest.fn(() => Promise.resolve(certificate));
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));

    mockApi.getIdCardSignatureHash = jest.fn(() => Promise.resolve(hash));
    mockHwcrypto.sign = jest.fn(() => Promise.resolve(signedHash));
    mockApi.getIdCardSignatureStatus = jest.fn(() => Promise.resolve('OUTSTANDING_TRANSACTION'));

    const signMandate = createBoundAction(actions.signMandateWithIdCard);
    await signMandate(mandate);
    dispatch.mockClear();
    mockApi.getIdCardSignatureStatus = jest.fn(() => Promise.resolve('SIGNATURE'));
    jest.runOnlyPendingTimers();
    expect(dispatch).not.toHaveBeenCalled();
    expect(mockApi.getIdCardSignatureStatus).toHaveBeenCalledTimes(1);
    expect(mockApi.getIdCardSignatureStatus).toHaveBeenCalledWith('id', 'signedHash', 'token');
    await nextTick();
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_SUCCESS,
      signedMandateId: mandate.id,
      pillar: mandate.pillar,
    });
  });

  it('can handle unprocessable entity errors when saving the mandate', async () => {
    const error = new Error('oh no it failed 2');
    error.status = 400;
    mockApi.saveMandateWithToken = jest.fn(() => {
      dispatch.mockClear();
      return Promise.reject(error);
    });
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    await signMandate({});
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_INVALID_ERROR,
      error,
    });
  });

  it('can cancel signing the mandate', () => {
    expect(actions.cancelSigningMandate()).toEqual({
      type: SIGN_MANDATE_MOBILE_ID_CANCEL,
    });
  });

  it('can close error messages', () => {
    expect(actions.closeErrorMessages()).toEqual({
      type: NO_SIGN_MANDATE_ERROR,
    });
  });

  it('defaults to id card signing', async () => {
    const signMandate = createBoundAction(actions.signMandate);
    await signMandate({});
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_ID_CARD_START,
    });
  });

  it('starts mobile id signing if logged in with mobile id', async () => {
    state.login.loginMethod = 'MOBILE_ID';
    const signMandate = createBoundAction(actions.signMandate);
    mockApi.saveMandateWithToken = jest.fn(() => Promise.reject(new Error()));
    await signMandate({});
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_MOBILE_ID_START,
    });
  });

  it('starts smart id signing if logged in with smart id', async () => {
    state.login.loginMethod = 'SMART_ID';
    const signMandate = createBoundAction(actions.signMandate);
    mockApi.saveMandateWithToken = jest.fn(() => Promise.reject(new Error()));
    await signMandate({});
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_SMART_ID_START,
    });
  });

  it('creates aml checks if needed', async () => {
    state.login.loginMethod = 'MOBILE_ID';
    mockApi.saveMandateWithToken = jest.fn(() => Promise.reject(new Error()));
    mockApi.getMobileIdSignatureStatus = jest.fn(() =>
      Promise.resolve({ statusCode: 'SIGNATURE' }),
    );
    const amlChecks = {
      isPoliticallyExposed: true,
      isResident: true,
      occupation: 'PRIVATE_SECTOR',
    };
    mockApi.createAmlCheck = jest.fn(() => Promise.resolve('{"success":true}'));
    const signMandate = createBoundAction(actions.signMandate);
    await signMandate({}, amlChecks);
    expect(dispatch).toHaveBeenCalledWith({
      type: SIGN_MANDATE_MOBILE_ID_START,
    });
    expect(mockApi.createAmlCheck).toHaveBeenCalledTimes(3);
  });

  it('does not create new mandate if one is already provided when signing with smart id', async () => {
    const mandate = { id: 'id' };
    state.login.loginMethod = 'SMART_ID';
    const signMandate = createBoundAction(actions.signMandate);
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));
    mockApi.getSmartIdSignatureStatus = jest.fn(() => Promise.reject(new Error('Stop polling')));
    await signMandate(mandate);
    expect(mockApi.saveMandateWithToken).not.toHaveBeenCalled();
  });

  it('does not create new mandate if one is already provided when signing with mobile id', async () => {
    const mandate = { id: 'id' };
    state.login.loginMethod = 'MOBILE_ID';
    const signMandate = createBoundAction(actions.signMandate);
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));
    mockApi.getMobileIdSignatureStatus = jest.fn(() => Promise.reject(new Error('Stop polling')));
    await signMandate(mandate);
    expect(mockApi.saveMandateWithToken).not.toHaveBeenCalled();
  });

  it('does not create new mandate if one is already provided when signing with id card', async () => {
    const mandate = { id: 'id' };
    state.login.loginMethod = 'ID_CARD';
    const signMandate = createBoundAction(actions.signMandate);
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));

    const certificate = { hex: 'certificate' };
    global.hwcrypto = mockHwcrypto;
    mockHwcrypto.getCertificate = jest.fn(() => Promise.resolve(certificate));
    mockApi.getIdCardSignatureHash = jest.fn(() => Promise.reject(new Error('Stop polling')));
    await signMandate(mandate);
    expect(mockApi.saveMandateWithToken).not.toHaveBeenCalled();
  });
});

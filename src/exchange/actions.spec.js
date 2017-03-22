import { push } from 'react-router-redux';

import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,

  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_START_ERROR,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_MOBILE_ID_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_ERROR,
  SIGN_MANDATE_MOBILE_ID_CANCEL,

  CHANGE_AGREEMENT_TO_TERMS,
} from './constants';

jest.useFakeTimers();

const mockApi = jest.genMockFromModule('../common/api');
const mockDownload = jest.fn();
jest.mock('../common/api', () => mockApi);
jest.mock('downloadjs', () => mockDownload);

const actions = require('./actions'); // need to use require because of jest mocks being weird

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
    });
  }

  beforeEach(() => {
    mockDispatch();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken = () => Promise.reject();
    mockApi.saveMandateWithToken = () => Promise.reject();
    mockApi.getMobileIdSignatureStatusForMandateIdWithToken = () => Promise.reject();
  });

  describe('When getting source funds', () => {
    it('can get pension funds', () => {
      const sourceFunds = [{ iAmPensionFunds: true }];
      mockApi.getSourceFundsWithToken = jest.fn(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_START });
        dispatch.mockClear();
        return Promise.resolve(sourceFunds);
      });
      const getSourceFunds = createBoundAction(actions.getSourceFunds);
      expect(dispatch).not.toHaveBeenCalled();
      return getSourceFunds()
        .then(() => {
          expect(dispatch).toHaveBeenCalledTimes(1);
          expect(dispatch).toHaveBeenCalledWith({
            type: GET_SOURCE_FUNDS_SUCCESS,
            sourceFunds,
          });
        });
    });

    it('redirects to overview when no source funds detected', () => {
      const sourceFunds = [];
      mockApi.getSourceFundsWithToken = jest.fn(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_START });
        dispatch.mockClear();
        return Promise.resolve(sourceFunds);
      });
      const getSourceFunds = createBoundAction(actions.getSourceFunds);
      expect(dispatch).not.toHaveBeenCalled();
      return getSourceFunds()
        .then(() => {
          expect(dispatch).toHaveBeenCalledTimes(1);
          expect(dispatch).toHaveBeenCalledWith(push('/account'));
          expect(dispatch).not.toHaveBeenCalledWith({
            type: GET_SOURCE_FUNDS_SUCCESS,
            sourceFunds,
          });
        });
    });

    it('can handle errors when getting pension funds', () => {
      const error = new Error('oh no!');
      mockApi.getSourceFundsWithToken = jest.fn(() => Promise.reject(error));
      const getSourceFunds = createBoundAction(actions.getSourceFunds);
      expect(dispatch).not.toHaveBeenCalled();
      return getSourceFunds()
        .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_SOURCE_FUNDS_ERROR, error }));
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

  it('can get target funds', () => {
    const targetFunds = [{ iAmPensionFunds: true }];
    mockApi.getTargetFundsWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: GET_TARGET_FUNDS_START });
      dispatch.mockClear();
      return Promise.resolve(targetFunds);
    });
    const getTargetFunds = createBoundAction(actions.getTargetFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getTargetFunds()
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: GET_TARGET_FUNDS_SUCCESS,
          targetFunds,
        });
      });
  });

  it('can handle errors when getting target funds', () => {
    const error = new Error('oh no!');
    mockApi.getTargetFundsWithToken = jest.fn(() => Promise.reject(error));
    const getTargetFunds = createBoundAction(actions.getTargetFunds);
    expect(dispatch).not.toHaveBeenCalled();
    return getTargetFunds()
      .then(() => expect(dispatch).toHaveBeenCalledWith({ type: GET_TARGET_FUNDS_ERROR, error }));
  });

  it('can change agreement to terms', () => {
    [true, false].forEach(agreement =>
      expect(actions.changeAgreementToTerms(agreement)).toEqual({
        type: CHANGE_AGREEMENT_TO_TERMS,
        agreement,
      }));
  });

  it('can select future contributions fund fund', () => {
    const targetFundIsin = 'AAA';
    expect(actions.selectFutureContributionsFund(targetFundIsin)).toEqual({
      type: SELECT_TARGET_FUND,
      targetFundIsin,
    });
  });

  it('can download the mandate', () => {
    state.login.token = 'token';
    state.exchange.signedMandateId = 'mandate id';
    const file = { iAmAFakeFile: true };
    mockApi.downloadMandateWithIdAndToken = jest.fn(() => Promise.resolve(file));
    const downloadMandate = createBoundAction(actions.downloadMandate);
    downloadMandate()
      .then(() => {
        expect(mockApi.downloadMandateWithIdAndToken).toHaveBeenCalledWith('mandate id', 'token');
        expect(mockDownload).toHaveBeenCalledWith(file, 'avaldus.bdoc', 'application/bdoc');
      });
  });

  it('will not download the mandate if mandate id is missing', () => {
    state.login.token = 'token';
    state.exchange.signedMandateId = null;
    const file = { iAmAFakeFile: true };
    mockApi.downloadMandateWithIdAndToken = jest.fn(() => Promise.resolve(file));
    const downloadMandate = createBoundAction(actions.downloadMandate);
    downloadMandate()
      .then(() => expect(mockApi.downloadMandateWithIdAndToken).not.toHaveBeenCalled());
  });

// TODO: fix the test, doesn't fail
  it('can preview the mandate', () => {
    state.login.token = 'token';
    const file = { iAmAFakeFile: true };
    mockApi.downloadMandatePreviewWithIdAndToken = jest.fn(() => Promise.resolve(file));
    const previewMandate = createBoundAction(actions.previewMandate);
    previewMandate()
        .then(() => {
          expect(mockApi.downloadMandatePreviewWithIdAndToken).toHaveBeenCalledWith('mandate id', 'token');
          expect(mockDownload).toHaveBeenCalledWith(file, 'Tuleva_avaldus_eelvaade.zip', 'application/zip');
        });
  });  

  it('can sign the mandate', () => {
    state.login.token = 'token';
    const mandate = { id: 'mandate id' };
    const controlCode = '1337';
    mockApi.saveMandateWithToken = jest.fn(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: SIGN_MANDATE_MOBILE_ID_START });
      dispatch.mockClear();
      return Promise.resolve(mandate);
    });
    mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken = jest.fn(() => {
      expect(mockApi.saveMandateWithToken).toHaveBeenCalledTimes(1);
      expect(mockApi.saveMandateWithToken).toHaveBeenCalledWith(mandate, 'token');
      return Promise.resolve(controlCode);
    });
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    expect(dispatch).not.toHaveBeenCalled();
    return signMandate(mandate)
      .then(() => {
        expect(mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken)
          .toHaveBeenCalledTimes(1);
        expect(mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken)
          .toHaveBeenCalledWith(mandate.id, 'token');
        expect(dispatch).toHaveBeenCalledTimes(2); // calls next action to start polling as well.
        expect(dispatch).toHaveBeenCalledWith({
          type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
          controlCode,
        });
      });
  });

  it('starts polling until succeeds when signing the mandate', () => {
    state.login.token = 'token';
    const mandate = { id: 'id' };
    const controlCode = '1337';
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));
    mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken = jest
      .fn(() => Promise.resolve(controlCode));
    mockApi.getMobileIdSignatureStatusForMandateIdWithToken = jest.fn(() => Promise.resolve({
      statusCode: 'OUTSTANDING_TRANSACTION',
    }));
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    return signMandate(mandate)
      .then(() => {
        dispatch.mockClear();
        mockApi.getMobileIdSignatureStatusForMandateIdWithToken = jest.fn(() => Promise.resolve({}));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getMobileIdSignatureStatusForMandateIdWithToken).toHaveBeenCalledTimes(1);
        expect(mockApi.getMobileIdSignatureStatusForMandateIdWithToken).toHaveBeenCalledWith('id', 'token');
      }).then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: SIGN_MANDATE_MOBILE_ID_SUCCESS,
          signedMandateId: 'id',
        });
        expect(dispatch).toHaveBeenCalledWith(push('/steps/success'));
      });
  });

  it('starts polling until fails when signing the mandate', () => {
    state.login.token = 'token';
    const mandate = { id: 'id' };
    mockApi.saveMandateWithToken = jest.fn(() => Promise.resolve(mandate));
    mockApi.getMobileIdSignatureChallengeCodeForMandateIdWithToken = jest.fn(() => Promise.resolve('1337'));
    mockApi.getMobileIdSignatureStatusForMandateIdWithToken = jest.fn(() => Promise.resolve({
      statusCode: 'OUTSTANDING_TRANSACTION',
    }));
    const error = new Error('oh no dude');
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    return signMandate(mandate)
      .then(() => {
        dispatch.mockClear();
        mockApi.getMobileIdSignatureStatusForMandateIdWithToken = jest.fn(() => Promise.reject(error));
        jest.runOnlyPendingTimers();
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockApi.getMobileIdSignatureStatusForMandateIdWithToken).toHaveBeenCalledTimes(1);
      })
      .then(() => jest.runOnlyPendingTimers())
      .then(() => expect(dispatch).toHaveBeenCalledWith(
        { type: SIGN_MANDATE_MOBILE_ID_ERROR, error }));
  });

  it('can handle errors when starting to sign the mandate', () => {
    const error = new Error('oh no it failed');
    mockApi.saveMandateWithToken = jest.fn(() => {
      dispatch.mockClear();
      return Promise.reject(error);
    });
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    return signMandate({})
      .then(() => {
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({
          type: SIGN_MANDATE_MOBILE_ID_START_ERROR,
          error,
        });
      });
  });

  it('can handle unprocessable entity errors when saving the mandate', () => {
    const error = new Error('oh no it failed');
    error.status = 422;
    mockApi.saveMandateWithToken = jest.fn(() => {
      dispatch.mockClear();
      return Promise.reject(error);
    });
    const signMandate = createBoundAction(actions.signMandateWithMobileId);
    return signMandate({})
        .then(() => {
          expect(dispatch).toHaveBeenCalledTimes(1);
          expect(dispatch).toHaveBeenCalledWith({
            type: SIGN_MANDATE_INVALID_ERROR,
            error,
          });
        });
  });

  it('can cancel signing the mandate', () => {
    expect(actions.cancelSigningMandate()).toEqual({
      type: SIGN_MANDATE_MOBILE_ID_CANCEL,
    });
  });
});

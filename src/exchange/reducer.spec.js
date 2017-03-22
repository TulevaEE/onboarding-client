import exchangeReducer from './reducer';
import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,

  SIGN_MANDATE_START,
  SIGN_MANDATE_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_CANCEL,

  CHANGE_AGREEMENT_TO_TERMS,
} from './constants';

describe('Exchange reducer', () => {
  it('starts loading when starting to get pension funds', () => {
    const newState = exchangeReducer(undefined, { type: GET_SOURCE_FUNDS_START });
    expect(newState.loadingSourceFunds).toBe(true);
  });

  it('stops loading and saves funds when getting pension funds succeeded', () => {
    const sourceFunds = [{ name: 'name', isin: 'isin' }];
    const action = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const newState = exchangeReducer({ loadingSourceFunds: true }, action);
    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.sourceFunds).toBe(sourceFunds);
  });

  it('stops loading and saves the error when getting pension funds fails', () => {
    const error = new Error('oh no');
    const action = { type: GET_SOURCE_FUNDS_ERROR, error };
    const newState = exchangeReducer({ loadingSourceFunds: true }, action);
    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.error).toBe(error);
  });

  it('can select some source funds', () => {
    const sourceSelection = [{ iAmTheSelectedExchange: true }];
    const action = { type: SELECT_EXCHANGE_SOURCES, sourceSelection, sourceSelectionExact: false };
    expect(exchangeReducer(undefined, action).sourceSelection).toEqual(sourceSelection);
    expect(exchangeReducer(undefined, action).sourceSelectionExact).toBe(false);
    action.sourceSelectionExact = true;
    expect(exchangeReducer(undefined, action).sourceSelectionExact).toBe(true);
  });

  it('starts loading when getting target funds', () => {
    const action = { type: GET_TARGET_FUNDS_START };
    expect(exchangeReducer(undefined, action).loadingTargetFunds).toBe(true);
  });

  it('stops loading, saves and selects target funds when getting them succeeds', () => {
    const targetFunds = [
      { isin: 'AE0000000001', iShouldBeSelected: true },
      { isin: 'asd', hello: true },
    ];
    const action = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.targetFunds).toEqual(targetFunds);
    expect(newState.loadingTargetFunds).toBe(false);
    expect(newState.selectedFutureContributionsFundIsin).toEqual(targetFunds[0].isin);
  });

  it('selects full source selection when both target and source funds have arrived', () => {
    const expectedFullSelection = [
      { sourceFundIsin: 'source', targetFundIsin: 'target', percentage: 1 },
      { sourceFundIsin: 'source 2', targetFundIsin: 'target', percentage: 1 },
    ];

    const sourceFunds = [{ name: 'name', isin: 'source' }, { name: 'name', isin: 'source 2' }];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [{ name: 'name', isin: 'target' }, { name: 'name', isin: 'target 2' }];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.sourceSelection).toEqual(expectedFullSelection);
    const stateOtherWay = [targetFundsAction, sourceFundsAction].reduce(exchangeReducer);
    expect(stateOtherWay.sourceSelection).toEqual(expectedFullSelection);
  });

  it('stops loading and saves the error when getting target funds fails', () => {
    const error = new Error('oh no!');
    const action = { type: GET_TARGET_FUNDS_ERROR, error };
    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.error).toEqual(error);
    expect(newState.loadingTargetFunds).toBe(false);
  });

  it('can select a target fund for future capital contributions', () => {
    const targetFundIsin = 'AAA';
    const action = { type: SELECT_TARGET_FUND, targetFundIsin };
    expect(exchangeReducer(undefined, action).selectedFutureContributionsFundIsin)
      .toEqual(targetFundIsin);
  });

  it('can change the agreement to the terms of use', () => {
    [true, false].forEach(agreement => (
      expect(exchangeReducer(undefined, {
        type: CHANGE_AGREEMENT_TO_TERMS,
        agreement,
      }).agreedToTerms).toEqual(agreement)));
  });

  it('starts loading mandate when starting to sign mandate', () => {
    const action = { type: SIGN_MANDATE_START };
    expect(exchangeReducer(undefined, action).loadingMandate).toBe(true);
  });

  it('stops loading mandate and saves control code when starting to sign succeeds', () => {
    const controlCode = 'control code';
    const action = { type: SIGN_MANDATE_START_SUCCESS, controlCode };
    const newState = exchangeReducer({ mandateSigningControlCode: true }, action);
    expect(newState.mandateSigningControlCode).toBe(controlCode);
    expect(newState.loadingMandate).toBe(false);
  });

  it('saves the mandate id when signing mandate succeeds', () => {
    const signedMandateId = 'an id';
    const action = { type: SIGN_MANDATE_SUCCESS, signedMandateId };
    const newState = exchangeReducer({ mandateSigningControlCode: 'code' }, action);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.signedMandateId).toBe(signedMandateId);
  });

  it('sets the error when signing mandate fails', () => {
    const error = new Error('oh no!');
    const action = { type: SIGN_MANDATE_ERROR, error };
    const newState = exchangeReducer({ mandateSigningControlCode: 'code' }, action);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.mandateSigningError).toEqual(error);
  });

  it('sets an invalid mandate error when getting invalid mandate', () => {
    const error = new Error('oh no!');
    const action = { type: SIGN_MANDATE_INVALID_ERROR, error };
    const newState = exchangeReducer({ mandateSigningControlCode: 'code' }, action);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.mandateSigningError).toEqual(error);
    expect(newState.invalidMandateError).toEqual(true);
  });

  it('stops loading and sets the error when starting to sign mandate fails', () => {
    const error = new Error('oh no!');
    const action = { type: SIGN_MANDATE_START_ERROR, error };
    const newState = exchangeReducer({ loadingMandate: true }, action);
    expect(newState.loadingMandate).toBe(false);
    expect(newState.mandateSigningError).toEqual(error);
  });

  it('can cancel signing the mandate', () => {
    const action = { type: SIGN_MANDATE_CANCEL };
    const newState = exchangeReducer({
      loadingMandate: true,
      mandateSigningControlCode: '1337',
      signedMandateId: 'an id',
    }, action);
    expect(newState.loadingMandate).toBe(false);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.signedMandateId).toBe(null);
  });
});

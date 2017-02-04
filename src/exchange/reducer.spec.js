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

  SET_TRANSFER_FUTURE_CAPITAL,

  SIGN_MANDATE_START,
  SIGN_MANDATE_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
} from './constants';

describe('Exchange reducer', () => {
  it('starts loading when starting to get pension funds', () => {
    const newState = exchangeReducer(undefined, { type: GET_SOURCE_FUNDS_START });
    expect(newState.loadingSourceFunds).toBe(true);
  });

  it('stops loading and saves funds and default seletion when getting pension funds succeeded', () => {
    const sourceFunds = [{ name: 'name', isin: 'isin' }];
    const action = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const newState = exchangeReducer({ loadingSourceFunds: true }, action);
    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.sourceFunds).toBe(sourceFunds);
    expect(newState.sourceSelection).toEqual([{ name: 'name', isin: 'isin', percentage: 1 }]);
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
      { isin: 'asd', hello: true },
      { isin: 'AE123232334', iShouldBeSelected: true },
    ];
    const action = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.targetFunds).toEqual(targetFunds);
    expect(newState.loadingTargetFunds).toBe(false);
    expect(newState.selectedTargetFund).toEqual(targetFunds[1]);
  });

  it('stops loading and saves the error when getting target funds fails', () => {
    const error = new Error('oh no!');
    const action = { type: GET_TARGET_FUNDS_ERROR, error };
    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.error).toEqual(error);
    expect(newState.loadingTargetFunds).toBe(false);
  });

  it('can select a target fund', () => {
    const targetFund = { thisIsTheTarget: true };
    const action = { type: SELECT_TARGET_FUND, targetFund };
    expect(exchangeReducer(undefined, action).selectedTargetFund).toEqual(targetFund);
  });

  it('can set if the user wants to transfer future capital', () => {
    const action = { type: SET_TRANSFER_FUTURE_CAPITAL, transferFutureCapital: true };
    expect(exchangeReducer(undefined, action).transferFutureCapital).toBe(true);
    action.transferFutureCapital = false;
    expect(exchangeReducer(undefined, action).transferFutureCapital).toBe(false);
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

  it('sets mandate signing successful when signing mandate succeeds', () => {
    const action = { type: SIGN_MANDATE_SUCCESS };
    const newState = exchangeReducer({ mandateSigningControlCode: 'code' }, action);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.mandateSigningSuccessful).toBe(true);
  });

  it('sets the error when signing mandate fails', () => {
    const error = new Error('oh no!');
    const action = { type: SIGN_MANDATE_ERROR, error };
    const newState = exchangeReducer({ mandateSigningControlCode: 'code' }, action);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.mandateSigningError).toEqual(error);
  });

  it('stops loading and sets the error when starting to sign mandate fails', () => {
    const error = new Error('oh no!');
    const action = { type: SIGN_MANDATE_START_ERROR, error };
    const newState = exchangeReducer({ loadingMandate: true }, action);
    expect(newState.loadingMandate).toBe(false);
    expect(newState.mandateSigningError).toEqual(error);
  });
});

import exchangeReducer from './reducer';
import {
  LOAD_PENSION_DATA_SUCCESS,
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
  SIGN_MANDATE_SMART_ID_START,
  SIGN_MANDATE_SMART_ID_START_SUCCESS,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  CHANGE_AGREEMENT_TO_TERMS,
  NO_SIGN_MANDATE_ERROR,
  SIGN_MANDATE_IN_PROGRESS,
} from './constants';

import {
  ID_CARD_AUTHENTICATION_SUCCESS,
  LOG_OUT,
  MOBILE_AUTHENTICATION_SUCCESS,
} from '../login/constants';

describe('Exchange reducer', () => {
  it('finishes loading pension data', () => {
    const newState = exchangeReducer(undefined, {
      type: LOAD_PENSION_DATA_SUCCESS,
    });
    expect(newState.loadingPensionData).toBe(false);
  });

  it('starts loading when starting to get pension funds', () => {
    const newState = exchangeReducer(undefined, {
      type: GET_SOURCE_FUNDS_START,
    });
    expect(newState.loadingSourceFunds).toBe(true);
  });

  it('stops loading and saves funds when getting pension funds succeeded', () => {
    const sourceFunds = [
      { name: 'name', isin: 'isin', pillar: 2, price: 200, unavailablePrice: 0 },
    ];
    const action = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const newState = exchangeReducer({ loadingSourceFunds: true }, action);
    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.sourceFunds).toEqual(sourceFunds);
  });

  it('stops loading and saves the error when getting pension funds fails', () => {
    const error = { body: { errors: [{ code: 'oh no' }] } };
    const action = { type: GET_SOURCE_FUNDS_ERROR, error };

    const newState = exchangeReducer({ loadingSourceFunds: true }, action);

    expect(newState.error).toBe(error);
    expect(newState.loadingSourceFunds).toBe(false);
  });

  it('can select some source funds', () => {
    const sourceSelection = [{ iAmTheSelectedExchange: true }];
    const action = {
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    };
    expect(exchangeReducer(undefined, action).sourceSelection).toEqual(sourceSelection);
    expect(exchangeReducer(undefined, action).sourceSelectionExact).toBe(false);
    action.sourceSelectionExact = true;
    expect(exchangeReducer(undefined, action).sourceSelectionExact).toBe(true);
  });

  it('selecting source fund non exact will trigger defaulting contributions fund selection', () => {
    const sourceExchange = {
      sourceFundIsin: 'sourceFundIsin',
      targetFundIsin: 'targetFundIsin',
    };
    const sourceSelection = [sourceExchange];
    const action = {
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    };

    expect(exchangeReducer(undefined, action).selectedFutureContributionsFundIsin).toEqual(
      sourceExchange.targetFundIsin,
    );
  });

  it('selecting source fund exact will not trigger defaulting contributions fund selection', () => {
    const sourceExchange = {
      sourceFundIsin: 'sourceFundIsin',
      targetFundIsin: 'targetFundIsin',
    };
    const sourceSelection = [sourceExchange];
    const action = {
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: true,
    };

    expect(exchangeReducer(undefined, action).selectedFutureContributionsFundIsin).toEqual(null);
  });

  it('selecting source fund non exact but with empty source selection will not trigger defaulting contributions fund selection', () => {
    const sourceSelection = [];
    const action = {
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    };

    const state = {
      selectedFutureContributionsFundIsin: 'will not change',
    };

    expect(exchangeReducer(state, action).selectedFutureContributionsFundIsin).toEqual(
      state.selectedFutureContributionsFundIsin,
    );
  });

  it('defaulting contributions fund selection works with sourceFunds list', () => {
    const targetFundIsin = 'targetFundIsin';
    const state = {
      sourceFunds: [
        {
          isin: targetFundIsin,
          activeFund: false,
          price: 1,
          unavailablePrice: 0,
        },
      ],
    };

    const sourceExchange = { sourceFundIsin: 'sourceFundIsin', targetFundIsin };
    const sourceSelection = [sourceExchange];
    const action = {
      type: SELECT_EXCHANGE_SOURCES,
      sourceSelection,
      sourceSelectionExact: false,
    };

    expect(exchangeReducer(state, action).selectedFutureContributionsFundIsin).toEqual(
      sourceExchange.targetFundIsin,
    );
  });

  it('starts loading when getting target funds', () => {
    const action = { type: GET_TARGET_FUNDS_START };
    expect(exchangeReducer(undefined, action).loadingTargetFunds).toBe(true);
  });

  it('stops loading, saves and selects target funds when getting them succeeds', () => {
    const targetFunds = [
      {
        isin: 'EE3600109435',
        iShouldBeSelected: true,
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        isin: 'asd',
        hello: true,
        fundManager: { name: 'A' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];

    const fundsFromBothPillarsAndAllStates = [
      ...targetFunds,
      {
        isin: 'third pillar fund',
        hello: true,
        fundManager: { name: 'A' },
        pillar: 3,
        status: 'ACTIVE',
      },
      {
        isin: 'third pillar non active fund',
        hello: true,
        fundManager: { name: 'A' },
        pillar: 3,
        status: 'CONTRIBUTIONS_FORBIDDEN',
      },
    ];
    const action = {
      type: GET_TARGET_FUNDS_SUCCESS,
      targetFunds: fundsFromBothPillarsAndAllStates,
    };
    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.targetFunds).toEqual(targetFunds);
    expect(newState.loadingTargetFunds).toBe(false);
  });

  it('defaults contributions fund to null when source funds not present', () => {
    const targetFunds = [
      {
        isin: 'EE3600109435',
        iShouldBeSelected: true,
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        isin: 'asd',
        hello: true,
        fundManager: { name: 'A' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const action = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.selectedFutureContributionsFundIsin).toEqual(null);
  });

  it('defaults contributions fund to null when target funds not present', () => {
    const sourceFunds = [
      { name: 'name', isin: 'source', pillar: 2, price: 1, unavailablePrice: 0 },
      { name: 'name', isin: 'source 2', pillar: 2, price: 1, unavailablePrice: 0 },
    ];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const newState = exchangeReducer({}, sourceFundsAction);
    expect(newState.selectedFutureContributionsFundIsin).toEqual(null);
  });

  it('defaults future contributions fund to first current company target fund when no target fund is currently active', () => {
    const sourceFunds = [
      { name: 'name', isin: 'isin1', price: 1, unavailablePrice: 0 },
      { name: 'name', isin: 'isin2', price: 1, unavailablePrice: 0 },
      {
        name: 'other random active fund',
        isin: 'source 3',
        activeFund: true,
        price: 1,
        unavailablePrice: 0,
      },
    ];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [
      {
        name: 'name',
        isin: 'isin0',
        fundManager: { name: 'Random company fund' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'isin1',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'isin2',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.selectedFutureContributionsFundIsin).toEqual(targetFunds[1].isin);
  });

  it('defaults future contributions fund to 2nd pillar funds only', () => {
    const sourceFunds = [{ name: 'name', isin: 'source1', price: 1, unavailablePrice: 0 }];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [
      {
        name: 'name',
        isin: 'wrongtarget',
        fundManager: { name: 'Random company fund' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: '3rdpillartarget',
        fundManager: { name: 'Tuleva' },
        pillar: 3,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'target1',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'target2',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.sourceSelection).toEqual([
      { sourceFundIsin: 'source1', targetFundIsin: 'target1', percentage: 1 },
    ]);
  });

  it('defaults future contributions fund to null when the same company target fund is currently active', () => {
    const sourceFunds = [
      { name: 'name', isin: 'isin1', activeFund: true, pillar: 2 },
      { name: 'name', isin: 'isin2', pillar: 2 },
    ];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [
      {
        name: 'name',
        isin: 'isin1',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'isin2',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.selectedFutureContributionsFundIsin).toEqual(null);
  });

  it('selects full source selection when both target and source funds have arrived', () => {
    const expectedFullSelection = [
      { sourceFundIsin: 'source', targetFundIsin: 'target', percentage: 1 },
      { sourceFundIsin: 'source 2', targetFundIsin: 'target', percentage: 1 },
    ];

    const sourceFunds = [
      { name: 'name', isin: 'source', price: 100, unavailablePrice: 0, pillar: 2 },
      { name: 'name', isin: 'source 2', price: 100, unavailablePrice: 0, pillar: 2 },
    ];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [
      {
        name: 'name',
        isin: 'target',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'target 2',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.sourceSelection).toEqual(expectedFullSelection);
    const stateOtherWay = [targetFundsAction, sourceFundsAction].reduce(exchangeReducer);
    expect(stateOtherWay.sourceSelection).toEqual(expectedFullSelection);
  });

  it('selects full source selection only source funds where price is bigger than zero', () => {
    const expectedFullSelection = [
      { sourceFundIsin: 'source', targetFundIsin: 'target', percentage: 1 },
      { sourceFundIsin: 'source 3', targetFundIsin: 'target', percentage: 1 },
    ];

    const sourceFunds = [
      { name: 'name', isin: 'source', price: 100, unavailablePrice: 0, pillar: 2 },
      { name: 'name', isin: 'source 2', pillar: 2 },
      { name: 'name', isin: 'source 3', price: 100, unavailablePrice: 0, pillar: 2 },
    ];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [
      {
        name: 'name',
        isin: 'target',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'target 2',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.sourceSelection).toEqual(expectedFullSelection);
    const stateOtherWay = [targetFundsAction, sourceFundsAction].reduce(exchangeReducer);
    expect(stateOtherWay.sourceSelection).toEqual(expectedFullSelection);
  });

  it('selects full source selection and skips inter fund transfers', () => {
    const expectedFullSelection = [
      {
        sourceFundIsin: 'source',
        targetFundIsin: 'thissourcewillbeskipped',
        percentage: 1,
      },
      {
        sourceFundIsin: 'willnotbeskipped',
        targetFundIsin: 'thissourcewillbeskipped',
        percentage: 1,
      },
    ];

    const sourceFunds = [
      { name: 'name', isin: 'source', price: 100, unavailablePrice: 0, pillar: 2 },
      { name: 'name', isin: 'thissourcewillbeskipped', price: 100, unavailablePrice: 0, pillar: 2 },
      { name: 'name', isin: 'willnotbeskipped', price: 100, unavailablePrice: 0, pillar: 2 },
    ];
    const sourceFundsAction = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };
    const targetFunds = [
      {
        name: 'name',
        isin: 'thissourcewillbeskipped',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
      {
        name: 'name',
        isin: 'willnotbeskipped',
        fundManager: { name: 'Tuleva' },
        pillar: 2,
        status: 'ACTIVE',
      },
    ];
    const targetFundsAction = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };
    const state = [sourceFundsAction, targetFundsAction].reduce(exchangeReducer);
    expect(state.sourceSelection).toEqual(expectedFullSelection);
    const stateOtherWay = [targetFundsAction, sourceFundsAction].reduce(exchangeReducer);
    expect(stateOtherWay.sourceSelection).toEqual(expectedFullSelection);
  });

  it('filters out 2nd pillar source funds', () => {
    const secondPillarFund = {
      name: 'name',
      isin: 'isin',
      pillar: 2,
      price: 200,
      unavailablePrice: 0,
    };
    const thirdPillarFund = {
      name: 'name',
      isin: 'isin',
      pillar: 3,
      price: 300,
      unavailablePrice: 0,
    };
    const sourceFunds = [secondPillarFund, thirdPillarFund];
    const action = { type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds };

    const newState = exchangeReducer({ loadingSourceFunds: true }, action);

    expect(newState.loadingSourceFunds).toBe(false);
    expect(newState.sourceFunds).toEqual([secondPillarFund]);
  });

  it('filters out active 2nd pillar target funds', () => {
    const activeSecondPillarFund = {
      isin: 'asd',
      fundManager: { name: 'Tuleva' },
      pillar: 2,
      status: 'ACTIVE',
    };
    const liquidatedSecondPillarFund = {
      isin: 'hjk',
      fundManager: { name: 'B' },
      pillar: 2,
      status: 'LIQUIDATED',
    };
    const thirdPillarFund = {
      isin: 'dfg',
      fundManager: { name: 'A' },
      pillar: 3,
      status: 'ACTIVE',
    };

    const targetFunds = [activeSecondPillarFund, liquidatedSecondPillarFund, thirdPillarFund];
    const action = { type: GET_TARGET_FUNDS_SUCCESS, targetFunds };

    const newState = exchangeReducer({ loadingTargetFunds: true }, action);

    expect(newState.targetFunds).toEqual([activeSecondPillarFund]);
    expect(newState.loadingTargetFunds).toBe(false);
  });

  it('stops loading and saves the error when getting target funds fails', () => {
    const error = { body: { errors: [{ code: 'oh no!' }] } };
    const action = { type: GET_TARGET_FUNDS_ERROR, error };

    const newState = exchangeReducer({ loadingTargetFunds: true }, action);
    expect(newState.error).toEqual(error);
    expect(newState.loadingTargetFunds).toBe(false);
  });

  it('can select a target fund for future capital contributions', () => {
    const targetFundIsin = 'AAA';
    const action = { type: SELECT_TARGET_FUND, targetFundIsin };
    expect(exchangeReducer(undefined, action).selectedFutureContributionsFundIsin).toEqual(
      targetFundIsin,
    );
  });

  it('can change the agreement to the terms of use', () => {
    [true, false].forEach((agreement) =>
      expect(
        exchangeReducer(undefined, {
          type: CHANGE_AGREEMENT_TO_TERMS,
          agreement,
        }).agreedToTerms,
      ).toEqual(agreement),
    );
  });

  it('starts loading mandate when starting to sign mandate with mobile id', () => {
    const action = { type: SIGN_MANDATE_MOBILE_ID_START };
    expect(exchangeReducer(undefined, action).loadingMandate).toBe(true);
  });

  it('starts loading mandate when starting to sign mandate with smart id', () => {
    const action = { type: SIGN_MANDATE_SMART_ID_START };
    expect(exchangeReducer(undefined, action).loadingMandate).toBe(true);
  });

  it('starts loading mandate when starting to sign mandate with id card', () => {
    const action = { type: SIGN_MANDATE_ID_CARD_START };
    expect(exchangeReducer(undefined, action).loadingMandate).toBe(true);
  });

  it('stops loading mandate and saves control code when starting to sign with mobile id succeeds', () => {
    const controlCode = 'control code';
    const action = { type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode };
    const newState = exchangeReducer({ mandateSigningControlCode: true }, action);
    expect(newState.mandateSigningControlCode).toBe(controlCode);
    expect(newState.loadingMandate).toBe(false);
  });

  it('stops loading mandate and saves control code when starting to sign with smart id succeeds', () => {
    const controlCode = 'control code';
    const action = { type: SIGN_MANDATE_SMART_ID_START_SUCCESS, controlCode };
    const newState = exchangeReducer({ mandateSigningControlCode: true }, action);
    expect(newState.mandateSigningControlCode).toBe(controlCode);
    expect(newState.loadingMandate).toBe(false);
  });

  it('keeps on loading mandate when no challenge code', () => {
    const controlCode = null;
    const action = { type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode };
    const newState = exchangeReducer({ mandateSigningControlCode: true }, action);
    expect(newState.mandateSigningControlCode).toBe(controlCode);
    expect(newState.loadingMandate).toBe(true);
  });

  it('stops loading mandate and saves control code when it becomes available', () => {
    const controlCode = 'control code';
    const action = { type: SIGN_MANDATE_IN_PROGRESS, controlCode };
    const newState = exchangeReducer({ mandateSigningControlCode: true }, action);
    expect(newState.mandateSigningControlCode).toBe(controlCode);
    expect(newState.loadingMandate).toBe(false);
  });

  it('saves the mandate id when signing mandate succeeds', () => {
    const signedMandateId = 1234566;
    const action = { type: SIGN_MANDATE_SUCCESS, signedMandateId, pillar: 2 };
    const newState = exchangeReducer(
      { mandateSigningControlCode: 'code', loadingMandate: true },
      action,
    );
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.signedMandateId).toBe(signedMandateId);
    expect(newState.loadingMandate).toBe(false);
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
  });

  it('stops loading and sets the error when starting to sign mandate fails', () => {
    const error = new Error('oh no!');
    const action = { type: SIGN_MANDATE_START_ERROR, error };
    const newState = exchangeReducer({ loadingMandate: true }, action);
    expect(newState.loadingMandate).toBe(false);
    expect(newState.mandateSigningError).toEqual(error);
  });

  it('can cancel signing the mandate', () => {
    const action = { type: SIGN_MANDATE_MOBILE_ID_CANCEL };
    const newState = exchangeReducer(
      {
        loadingMandate: true,
        mandateSigningControlCode: '1337',
        signedMandateId: 2135415,
      },
      action,
    );
    expect(newState.loadingMandate).toBe(false);
    expect(newState.mandateSigningControlCode).toBeFalsy();
    expect(newState.signedMandateId).toBe(null);
  });

  it('can remove mandate sign errors', () => {
    const action = { type: NO_SIGN_MANDATE_ERROR };
    const newState = exchangeReducer(
      {
        mandateSigningError: { error: [] },
      },
      action,
    );
    expect(newState.mandateSigningError).toBe(null);
  });

  it('reverts to initial state when logging out or logging in', () => {
    [LOG_OUT, MOBILE_AUTHENTICATION_SUCCESS, ID_CARD_AUTHENTICATION_SUCCESS].forEach((type) => {
      const action = { type };
      const newState = exchangeReducer(
        {
          sourceFunds: [{ sourceFund: true }],
          loadingSourceFunds: true,
          sourceSelection: '123',
          sourceSelectionExact: true,
          targetFunds: [],
          loadingTargetFunds: true,
          selectedFutureContributionsFundIsin: '123',
          error: '123',
          loadingMandate: true,
          mandateSigningControlCode: '123',
          mandateSigningError: '123',
          signedMandateId: 123,
          agreedToTerms: true,
        },
        action,
      );

      expect(newState.sourceFunds).toBe(null);
      expect(newState.loadingSourceFunds).toBe(false);
      expect(newState.sourceSelection).toHaveLength(0);
      expect(newState.sourceSelectionExact).toBe(false);
      expect(newState.targetFunds).toBe(null);
      expect(newState.loadingTargetFunds).toBe(false);
      expect(newState.selectedFutureContributionsFundIsin).toBe(null);
      expect(newState.error).toBe(null);

      expect(newState.loadingMandate).toBe(false);
      expect(newState.mandateSigningControlCode).toBe(null);
      expect(newState.mandateSigningError).toBe(null);
      expect(newState.signedMandateId).toBe(null);
      expect(newState.agreedToTerms).toBe(false);
    });
  });
});

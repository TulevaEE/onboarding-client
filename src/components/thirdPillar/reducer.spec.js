import {
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_MONTHLY_CONTRIBUTION,
  QUERY_PARAMETERS,
  SELECT_THIRD_PILLAR_SOURCES,
} from './constants';
import initialState, { EXIT_RESTRICTED_FUNDS } from './initialState';
import reducer from './reducer';
import {
  GET_SOURCE_FUNDS_ERROR,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,
  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  SIGN_MANDATE_SUCCESS,
} from '../exchange/constants';
import { LOG_OUT } from '../login/constants';

describe('Third pillar reducer', () => {
  it('saves monthly contribution as a number when monthlyContribution is in query params and parsable as a number', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: { monthlyThirdPillarContribution: '500' },
    });

    expect(state).toEqual({ ...initialState, monthlyContribution: 500 });
  });

  it('saves monthly contribution as null when monthlyContribution is in query params and not a number', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: { monthlyThirdPillarContribution: 'f500' },
    });

    expect(state).toEqual({ ...initialState, monthlyContribution: null });
  });

  it('saves monthly contribution as null when monthlyContribution is not in query params', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: {},
    });

    expect(state).toEqual({ ...initialState, monthlyContribution: null });
  });

  it('saves that existing units should be exchanged when exchangeExistingUnits is the string true in query params', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: { exchangeExistingThirdPillarUnits: 'true' },
    });

    expect(state).toEqual({ ...initialState, exchangeExistingUnits: true });
  });

  it('saves that existing units should not be exchanged when exchangeExistingUnits is false in query params', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: { exchangeExistingThirdPillarUnits: 'false' },
    });

    expect(state).toEqual({ ...initialState, exchangeExistingUnits: false });
  });

  it('keeps the values in store when no query parameters', () => {
    const state = reducer(
      {
        ...initialState,
        monthlyContribution: 500,
        exchangeExistingUnits: true,
      },
      {
        type: QUERY_PARAMETERS,
        query: {},
      },
    );

    expect(state).toEqual({
      ...initialState,
      monthlyContribution: 500,
      exchangeExistingUnits: true,
    });
  });

  it('updates monthly contribution', () => {
    const state = reducer(
      {
        ...initialState,
        monthlyContribution: 500,
      },
      {
        type: CHANGE_MONTHLY_CONTRIBUTION,
        monthlyContribution: 1000,
      },
    );

    expect(state).toEqual({
      ...initialState,
      monthlyContribution: 1000,
    });
  });

  it('updates whether should exchange existing units', () => {
    const state = reducer(
      {
        ...initialState,
        exchangeExistingUnits: false,
      },
      {
        type: CHANGE_EXCHANGE_EXISTING_UNITS,
        exchangeExistingUnits: true,
      },
    );

    expect(state).toEqual({
      ...initialState,
      exchangeExistingUnits: true,
    });
  });

  it('updates source funds with exchangeable third pillar funds on success', () => {
    const oldState = {
      ...initialState,
      selectedFutureContributionsFundIsin: 'EE456',
    };

    const thirdPillarFund = {
      isin: 'EE123',
      pillar: 3,
      price: 100,
      unavailablePrice: 0,
    };
    const secondPillarFund = {
      isin: 'EE234',
      pillar: 2,
      price: 100,
      unavailablePrice: 0,
    };
    const tulevaThirdPillarFund = {
      isin: 'EE456',
      pillar: 3,
      price: 100,
      unavailablePrice: 0,
    };
    const movedThirdPillarFund = {
      isin: 'EE567',
      pillar: 3,
      price: 0,
      unavailablePrice: 100,
    };
    const zeroThirdPillarFund = {
      isin: 'EE678',
      pillar: 3,
      price: 0,
      unavailablePrice: 0,
    };

    const state = reducer(oldState, {
      type: GET_SOURCE_FUNDS_SUCCESS,
      sourceFunds: [
        thirdPillarFund,
        secondPillarFund,
        tulevaThirdPillarFund,
        movedThirdPillarFund,
        zeroThirdPillarFund,
      ],
    });

    expect(state).toEqual({
      ...oldState,
      sourceFunds: [thirdPillarFund, tulevaThirdPillarFund, movedThirdPillarFund],
      exchangeExistingUnits: true,
      exchangeableSourceFunds: [thirdPillarFund],
    });
  });

  it('sets exchange existing units to false when no exchangeable third pillar source funds', () => {
    const oldState = {
      ...initialState,
      exchangeExistingUnits: true,
      selectedFutureContributionsFundIsin: 'EE789',
    };
    const secondPillarFund = {
      isin: 'EE123',
      pillar: 2,
      price: 100,
      unavailablePrice: 0,
    };
    const anotherSecondPillarFund = {
      isin: 'EE456',
      pillar: 2,
      price: 100,
      unavailablePrice: 0,
    };
    const thirdPillarFund = {
      isin: 'EE789',
      pillar: 3,
      price: 100,
      unavailablePrice: 0,
    };
    const activeThirdPillarFund = {
      isin: 'EE890',
      pillar: 3,
      price: 0,
      unavailablePrice: 0,
      activeFund: true,
    };

    const sourceFunds = [
      secondPillarFund,
      anotherSecondPillarFund,
      thirdPillarFund,
      activeThirdPillarFund,
    ];

    const state = reducer(oldState, {
      type: GET_SOURCE_FUNDS_SUCCESS,
      sourceFunds,
    });

    expect(state).toEqual({
      ...oldState,
      sourceFunds: [thirdPillarFund, activeThirdPillarFund],
      exchangeableSourceFunds: [],
      exchangeExistingUnits: false,
    });
  });

  it('filters out exit restricted funds', () => {
    const oldState = {
      ...initialState,
      exchangeExistingUnits: true,
      selectedFutureContributionsFundIsin: 'EE789',
    };
    const sourceFunds = [
      { isin: EXIT_RESTRICTED_FUNDS[0], pillar: 3, price: 100, unavailablePrice: 0 },
      {
        isin: 'ABC123',
        pillar: 3,
        price: 100,
        unavailablePrice: 0,
        name: 'Fund One (väljumine piiratud)',
      },
      {
        isin: 'ABC123',
        pillar: 3,
        price: 100,
        unavailablePrice: 0,
        name: 'Fund Two (limited redemption)',
      },
    ];

    const state = reducer(oldState, {
      type: GET_SOURCE_FUNDS_SUCCESS,
      sourceFunds,
    });

    expect(state).toEqual({
      ...oldState,
      sourceFunds,
      exchangeableSourceFunds: [],
      exchangeExistingUnits: false,
    });
  });

  it('stops loading source funds on error', () => {
    const oldState = { ...initialState, loadingSourceFunds: true };
    const error = new Error('oh noes');
    const state = reducer(oldState, { type: GET_SOURCE_FUNDS_ERROR, error });

    expect(state).toEqual({
      ...oldState,
      loadingSourceFunds: false,
      error,
      exchangeableSourceFunds: [],
    });
  });

  it('updates target funds with Tuleva third pillar funds on success', () => {
    const state = reducer(undefined, {
      type: GET_TARGET_FUNDS_SUCCESS,
      targetFunds: [
        { isin: 'EE123', pillar: 3, fundManager: { name: 'Tuleva' }, status: 'ACTIVE' },
        { isin: 'EE456', pillar: 2, status: 'ACTIVE' },
        { isin: 'EE789', pillar: 3, status: 'ACTIVE' },
      ],
    });

    expect(state).toEqual({
      ...initialState,
      targetFunds: [
        { isin: 'EE123', pillar: 3, fundManager: { name: 'Tuleva' }, status: 'ACTIVE' },
      ],
      funds: [
        { isin: 'EE123', pillar: 3, fundManager: { name: 'Tuleva' }, status: 'ACTIVE' },
        { isin: 'EE789', pillar: 3, status: 'ACTIVE' },
      ],
    });
  });

  it('updates term agreement', () => {
    const state = reducer(undefined, {
      type: CHANGE_AGREEMENT_TO_TERMS,
      agreedToTerms: true,
    });

    expect(state).toEqual({
      ...initialState,
      agreedToTerms: true,
    });
  });

  it('updates signed mandate id', () => {
    const state = reducer(undefined, {
      type: SIGN_MANDATE_SUCCESS,
      signedMandateId: 123,
      pillar: 3,
    });

    expect(state).toEqual({
      ...initialState,
      signedMandateId: 123,
    });
  });

  it('sets state to initialState on logout', () => {
    const state = reducer(undefined, { type: LOG_OUT });
    expect(state).toEqual(initialState);
  });

  it('can can select some third pillar sources', () => {
    const action = {
      type: SELECT_THIRD_PILLAR_SOURCES,
      exchangeExistingUnits: true,
      selectedFutureContributionsFundIsin: 'EE123',
    };

    const state = reducer(undefined, action);

    expect(state.exchangeExistingUnits).toEqual(true);
    expect(state.selectedFutureContributionsFundIsin).toBe('EE123');
  });

  it('starts loading when getting target funds', () => {
    const action = { type: GET_TARGET_FUNDS_START };
    expect(reducer(undefined, action).loadingTargetFunds).toBe(true);
  });

  it('stops loading and saves the error when getting target funds fails', () => {
    const error = { body: { errors: [{ code: 'oh no!' }] } };
    const action = { type: GET_TARGET_FUNDS_ERROR, error };

    const newState = reducer({ loadingTargetFunds: true }, action);
    expect(newState.error).toEqual(error);
    expect(newState.loadingTargetFunds).toBe(false);
  });

  it('saves recurring payment count from query params', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: { recurringPaymentCount: '2' },
    });

    expect(state).toEqual({ ...initialState, recurringPaymentCount: 2 });
  });
});

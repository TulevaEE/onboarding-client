import {
  QUERY_PARAMETERS,
  CHANGE_MONTHLY_CONTRIBUTION,
  CHANGE_EXCHANGE_EXISTING_UNITS,
  CHANGE_AGREEMENT_TO_TERMS,
  CHANGE_POLITICALLY_EXPOSED,
  CHANGE_RESIDENCY,
} from './constants';
import initialState from './initialState';
import reducer from './reducer';
import {
  GET_SOURCE_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_SUCCESS,
  SIGN_MANDATE_SUCCESS,
} from '../exchange/constants';

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

  it('saves that existing units should not be exchanged when exchangeExistingUnits is any other string in query params', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: { exchangeExistingUnits: 'false' },
    });

    expect(state).toEqual({ ...initialState, exchangeExistingUnits: false });
  });

  it('saves that existing units should not be exchanged when exchangeExistingUnits is not in query params', () => {
    const state = reducer(undefined, {
      type: QUERY_PARAMETERS,
      query: {},
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
      selectedFutureContributionsFundIsin: 'EE789',
    };

    const state = reducer(oldState, {
      type: GET_SOURCE_FUNDS_SUCCESS,
      sourceFunds: [
        { isin: 'EE123', pillar: 3 },
        { isin: 'EE456', pillar: 2 },
        { isin: 'EE789', pillar: 3 },
      ],
    });

    expect(state).toEqual({
      ...oldState,
      exchangeableSourceFunds: [{ isin: 'EE123', pillar: 3 }],
    });
  });

  it('sets exchange existing units to false when no exchangeable third pillar source funds', () => {
    const oldState = {
      ...initialState,
      exchangeExistingUnits: true,
      selectedFutureContributionsFundIsin: 'EE789',
    };

    const state = reducer(oldState, {
      type: GET_SOURCE_FUNDS_SUCCESS,
      sourceFunds: [
        { isin: 'EE123', pillar: 2 },
        { isin: 'EE456', pillar: 2 },
        { isin: 'EE789', pillar: 3 },
      ],
    });

    expect(state).toEqual({
      ...oldState,
      exchangeExistingUnits: false,
    });
  });

  it('updates target funds with third pillar funds on success', () => {
    const state = reducer(undefined, {
      type: GET_TARGET_FUNDS_SUCCESS,
      targetFunds: [
        { isin: 'EE123', pillar: 3 },
        { isin: 'EE456', pillar: 2 },
        { isin: 'EE789', pillar: 3 },
      ],
    });

    expect(state).toEqual({
      ...initialState,
      targetFunds: [{ isin: 'EE123', pillar: 3 }, { isin: 'EE789', pillar: 3 }],
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

  it('updates politically exposed', () => {
    const state = reducer(undefined, {
      type: CHANGE_POLITICALLY_EXPOSED,
      isPoliticallyExposed: true,
    });

    expect(state).toEqual({
      ...initialState,
      isPoliticallyExposed: true,
    });
  });

  it('updates residency', () => {
    const state = reducer(undefined, {
      type: CHANGE_RESIDENCY,
      isResident: true,
    });

    expect(state).toEqual({
      ...initialState,
      isResident: true,
    });
  });

  it('updates signed mandate id', () => {
    const state = reducer(undefined, {
      type: SIGN_MANDATE_SUCCESS,
      signedMandateId: 123,
    });

    expect(state).toEqual({
      ...initialState,
      signedMandateId: 123,
    });
  });
});

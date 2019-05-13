import { QUERY_PARAMETERS } from './constants';
import initialState from './initialState';
import reducer from './reducer';

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
});

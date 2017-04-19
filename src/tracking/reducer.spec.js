import trackingReducer from './reducer';
import mixpanel from 'mixpanel-browser';

import {
  SELECT_EXCHANGE_SOURCES,
  GET_TARGET_FUNDS_ERROR,
  SELECT_TARGET_FUND,
  CHANGE_AGREEMENT_TO_TERMS,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
} from '../exchange/constants';

import {
  LOG_OUT,
  MOBILE_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_SUCCESS,
  GET_USER_SUCCESS,
} from '../login/constants';

function getActionType(actionType) {
  return actionType.split('/')[1];
}

it('can track getting user', () => {
  const user = { id: 123 };
  const action = { type: GET_USER_SUCCESS, user };

  mixpanel.people = {
    set: jest.fn(),
  };

  mixpanel.track = jest.fn();
  mixpanel.identify = jest.fn();

  trackingReducer(undefined, action);
  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(GET_USER_SUCCESS), { id: user.id });
  expect(mixpanel.people.set).toHaveBeenCalledTimes(1);
  expect(mixpanel.people.set).toHaveBeenCalledWith({ id: user.id });
  expect(mixpanel.identify).toHaveBeenCalledTimes(1);
  expect(mixpanel.identify).toHaveBeenCalledWith(user.id);
});

it('can track exchange source selection', () => {
  const sourceSelection =
    [{ sourceFundIsin: 'EE3600019832', percentage: 1, targetFundIsin: 'EE3600109435' },
      { sourceFundIsin: 'EE3600109443', percentage: 1, targetFundIsin: 'EE3600109435' }];
  const sourceSelectionExact = false;

  const action = { type: SELECT_EXCHANGE_SOURCES, sourceSelection, sourceSelectionExact };

  mixpanel.track = jest.fn();

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track)
    .toHaveBeenCalledWith(getActionType(SELECT_EXCHANGE_SOURCES),
    { sourceSelection, sourceSelectionExact });
});

it('can track target fund selection', () => {
  const targetFundIsin = '123';
  const action = { type: SELECT_TARGET_FUND, targetFundIsin };

  mixpanel.track = jest.fn();

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track)
    .toHaveBeenCalledWith(getActionType(SELECT_TARGET_FUND),
      { targetFundIsin });
});

it('can track sign mandate errors', () => {
  const error = {};
  const action = { type: SIGN_MANDATE_ERROR, error };

  mixpanel.track = jest.fn();

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track)
    .toHaveBeenCalledWith(getActionType(SIGN_MANDATE_ERROR),
      { error });
});

it('can track simple events', () => {

  const events = [LOG_OUT, MOBILE_AUTHENTICATION_SUCCESS,
    ID_CARD_AUTHENTICATION_SUCCESS, GET_TARGET_FUNDS_ERROR,
    CHANGE_AGREEMENT_TO_TERMS, SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
    SIGN_MANDATE_MOBILE_ID_CANCEL,
    SIGN_MANDATE_ID_CARD_START, SIGN_MANDATE_SUCCESS];

  mixpanel.track = jest.fn();

  events.forEach( (event) => {
    const action = { type: event };
    trackingReducer(undefined, action);
    expect(mixpanel.track)
      .toHaveBeenCalledWith(getActionType(event));
  });

  expect(mixpanel.track).toHaveBeenCalledTimes(events.length);
});


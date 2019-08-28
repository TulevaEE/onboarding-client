import { LOCATION_CHANGE } from 'connected-react-router';
import mixpanel from 'mixpanel-browser';

import trackingReducer from './reducer';

import {
  SELECT_EXCHANGE_SOURCES,
  GET_TARGET_FUNDS_ERROR,
  SELECT_TARGET_FUND,
  CHANGE_AGREEMENT_TO_TERMS,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_ID_CARD_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
} from '../exchange/constants';

import {
  LOG_OUT,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_SUCCESS,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
  GET_USER_CONVERSION_SUCCESS,
} from '../login/constants';

import { UPDATE_USER_SUCCESS } from '../common/user/constants';

function getActionType(actionType) {
  return actionType.split('/')[1];
}

beforeEach(() => {
  mixpanel.track = jest.fn();
});

it('can track getting user', () => {
  const user = { id: 123, firstName: 'Jordan', lastName: 'Valdma' };
  const action = { type: GET_USER_SUCCESS, user };

  mixpanel.people = {
    set: jest.fn(),
  };

  mixpanel.identify = jest.fn();

  trackingReducer(undefined, action);
  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(GET_USER_SUCCESS), {
    id: user.id,
  });
  expect(mixpanel.people.set).toHaveBeenCalledTimes(1);
  /* eslint-disable @typescript-eslint/camelcase */
  expect(mixpanel.people.set).toHaveBeenCalledWith({
    id: user.id,
    distinct_id: user.id,
    member_number: user.memberNumber,
    age: user.age,
    $first_name: user.firstName,
    $last_name: user.lastName,
  });
  /* eslint-enable @typescript-eslint/camelcase */
  expect(mixpanel.identify).toHaveBeenCalledTimes(1);
  expect(mixpanel.identify).toHaveBeenCalledWith(user.id);
});

it('can track exchange source selection', () => {
  const sourceSelection = [
    {
      sourceFundIsin: 'EE3600019832',
      percentage: 1,
      targetFundIsin: 'EE3600109435',
    },
    {
      sourceFundIsin: 'EE3600109443',
      percentage: 1,
      targetFundIsin: 'EE3600109435',
    },
  ];
  const sourceSelectionExact = false;

  const action = {
    type: SELECT_EXCHANGE_SOURCES,
    sourceSelection,
    sourceSelectionExact,
  };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(SELECT_EXCHANGE_SOURCES), {
    sourceSelection,
    sourceSelectionExact,
  });
});

it('can track target fund selection', () => {
  const targetFundIsin = '123';
  const action = { type: SELECT_TARGET_FUND, targetFundIsin };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(SELECT_TARGET_FUND), {
    targetFundIsin,
  });
});

it('can track sign mandate errors', () => {
  const error = {};
  const action = { type: SIGN_MANDATE_ERROR, error };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(SIGN_MANDATE_ERROR), { error });
});

it('can track sign mandate start errors', () => {
  const error = {};
  const action = { type: SIGN_MANDATE_START_ERROR, error };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(SIGN_MANDATE_START_ERROR), { error });
});

it('can track conversion information', () => {
  const userConversion = {};
  const action = { type: GET_USER_CONVERSION_SUCCESS, userConversion };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(
    getActionType(GET_USER_CONVERSION_SUCCESS),
    userConversion,
  );
});

it('can track location changes', () => {
  const payload = { pathname: 'newPath' };
  const action = { type: LOCATION_CHANGE, payload };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(LOCATION_CHANGE), {
    path: payload.pathname,
  });
});

it('can track simple events', () => {
  const events = [
    LOG_OUT,
    MOBILE_AUTHENTICATION_START,
    MOBILE_AUTHENTICATION_SUCCESS,
    ID_CARD_AUTHENTICATION_START,
    ID_CARD_AUTHENTICATION_SUCCESS,
    GET_TARGET_FUNDS_ERROR,
    CHANGE_AGREEMENT_TO_TERMS,
    SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
    SIGN_MANDATE_MOBILE_ID_CANCEL,
    SIGN_MANDATE_ID_CARD_START,
    SIGN_MANDATE_ID_CARD_START_SUCCESS,
    SIGN_MANDATE_SUCCESS,
    UPDATE_USER_SUCCESS,
  ];

  events.forEach(event => {
    const action = { type: event };
    trackingReducer(undefined, action);
    expect(mixpanel.track).toHaveBeenCalledWith(getActionType(event));
  });

  expect(mixpanel.track).toHaveBeenCalledTimes(events.length);
});

it('can track get user errors', () => {
  const userError = {};
  const action = { type: GET_USER_ERROR, userError };

  trackingReducer(undefined, action);

  expect(mixpanel.track).toHaveBeenCalledTimes(1);
  expect(mixpanel.track).toHaveBeenCalledWith(getActionType(GET_USER_ERROR), {
    userError,
  });
});

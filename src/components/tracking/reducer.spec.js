import { LOCATION_CHANGE } from 'connected-react-router';
jest.mock('./actions', () => ({
  __esModule: true, // not sure if needed
  trackEvent: jest.fn(),
}));

import { trackEvent } from './actions';

import trackingReducer from './reducer';

import {
  CHANGE_AGREEMENT_TO_TERMS,
  GET_TARGET_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
  SELECT_TARGET_FUND,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_ID_CARD_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_SMART_ID_START,
  SIGN_MANDATE_SMART_ID_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
} from '../exchange/constants';

import {
  GET_USER_CONVERSION_SUCCESS,
  GET_USER_ERROR,
  GET_USER_SUCCESS,
  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_SUCCESS,
  LOG_OUT,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_SUCCESS,
} from '../login/constants';

import { UPDATE_USER_SUCCESS } from '../common/user/constants';

function getActionType(actionType) {
  return actionType.split('/')[1];
}

it('can track getting user', () => {
  const user = { id: 123, firstName: 'Jordan', lastName: 'Valdma' };
  const action = { type: GET_USER_SUCCESS, user };
  trackingReducer(undefined, action);
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(GET_USER_SUCCESS), {
    id: user.id,
  });
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

  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(SELECT_EXCHANGE_SOURCES), {
    sourceSelection,
    sourceSelectionExact,
  });
});

it('can track target fund selection', () => {
  const targetFundIsin = '123';
  const action = { type: SELECT_TARGET_FUND, targetFundIsin };

  trackingReducer(undefined, action);

  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(SELECT_TARGET_FUND), {
    targetFundIsin,
  });
});

it('can track sign mandate errors', () => {
  const error = {};
  const action = { type: SIGN_MANDATE_ERROR, error };

  trackingReducer(undefined, action);

  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(SIGN_MANDATE_ERROR), { error });
});

it('can track sign mandate start errors', () => {
  const error = {};
  const action = { type: SIGN_MANDATE_START_ERROR, error };

  trackingReducer(undefined, action);

  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(SIGN_MANDATE_START_ERROR), { error });
});

it('can track conversion information', () => {
  const userConversion = {
    secondPillar: { selectionComplete: true, contribution: { total: 1000 } },
    thirdPillar: { transfersComplete: true, contribution: { total: 3000 } },
  };
  const action = { type: GET_USER_CONVERSION_SUCCESS, userConversion };

  trackingReducer(undefined, action);

  expect(trackEvent).toHaveBeenCalledWith(getActionType(GET_USER_CONVERSION_SUCCESS));
});

it('can track location changes', () => {
  const payload = { location: { pathname: 'newPath' } };
  const action = { type: LOCATION_CHANGE, payload };

  trackingReducer(undefined, action);

  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(LOCATION_CHANGE), {
    path: 'newPath',
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
    SIGN_MANDATE_MOBILE_ID_START,
    SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
    SIGN_MANDATE_MOBILE_ID_CANCEL,
    SIGN_MANDATE_SMART_ID_START,
    SIGN_MANDATE_SMART_ID_START_SUCCESS,
    SIGN_MANDATE_ID_CARD_START,
    SIGN_MANDATE_ID_CARD_START_SUCCESS,
    SIGN_MANDATE_SUCCESS,
    UPDATE_USER_SUCCESS,
  ];

  events.forEach((event) => {
    const action = { type: event };
    trackingReducer(undefined, action);
    expect(trackEvent).toHaveBeenCalledWith(getActionType(event));
  });

  expect(trackEvent).toHaveBeenCalledTimes(events.length);
});

it('can track get user errors', () => {
  const userError = {};
  const action = { type: GET_USER_ERROR, userError };

  trackingReducer(undefined, action);

  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith(getActionType(GET_USER_ERROR), {
    userError,
  });
});

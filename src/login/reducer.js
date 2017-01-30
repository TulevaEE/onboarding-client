import {
  CHANGE_PHONE_NUMBER,

  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,

  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
} from './constants';

const defaultState = {
  phoneNumber: '',
  controlCode: null,
  loadingControlCode: false,
  successful: false,
  error: null,
};

export default function loginReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_PHONE_NUMBER:
      return { ...state, phoneNumber: action.phoneNumber };

    case MOBILE_AUTHENTICATION_START:
      return { ...state, loadingControlCode: true, error: null };
    case MOBILE_AUTHENTICATION_START_SUCCESS:
      return { ...state, loadingControlCode: false, controlCode: action.controlCode };
    case MOBILE_AUTHENTICATION_START_ERROR:
      return { ...state, loadingControlCode: false, error: action.error };

    case MOBILE_AUTHENTICATION_SUCCESS:
      return { ...state, successful: true };
    case MOBILE_AUTHENTICATION_ERROR:
      return { ...state, error: action.error };

    default:
      return state;
  }
}

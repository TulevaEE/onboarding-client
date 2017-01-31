import {
  CHANGE_PHONE_NUMBER,

  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,

  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,

  MOBILE_AUTHENTICATION_CANCEL,
} from './constants';

const defaultState = {
  phoneNumber: '',
  controlCode: null,
  loadingControlCode: false,
  token: null,
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
      return { // reset all state so page is clean when entered again.
        ...state,
        token: action.token,
        loadingControlCode: false,
        controlCode: null,
        error: null,
        phoneNumber: '',
      };
    case MOBILE_AUTHENTICATION_ERROR:
      return { ...state, error: action.error };

    case MOBILE_AUTHENTICATION_CANCEL:
      return { ...state, loadingControlCode: false, error: null, controlCode: null };

    default:
      return state;
  }
}

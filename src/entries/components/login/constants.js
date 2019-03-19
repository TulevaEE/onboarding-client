const withPrefix = name => `@login/${name}`;

export const CHANGE_PHONE_NUMBER = withPrefix('CHANGE_PHONE_NUMBER');
export const CHANGE_ID_CODE = withPrefix('CHANGE_ID_CODE');

// START gets control code, then we start polling.
export const MOBILE_AUTHENTICATION_START = withPrefix('MOBILE_AUTHENTICATION_START');
export const MOBILE_AUTHENTICATION_START_SUCCESS = withPrefix(
  'MOBILE_AUTHENTICATION_START_SUCCESS',
);
export const MOBILE_AUTHENTICATION_START_ERROR = withPrefix('MOBILE_AUTHENTICATION_START_ERROR');

export const MOBILE_AUTHENTICATION_SUCCESS = withPrefix('MOBILE_AUTHENTICATION_SUCCESS');
export const MOBILE_AUTHENTICATION_ERROR = withPrefix('MOBILE_AUTHENTICATION_ERROR');
export const MOBILE_AUTHENTICATION_CANCEL = withPrefix('MOBILE_AUTHENTICATION_CANCEL');

export const ID_CARD_AUTHENTICATION_START = withPrefix('ID_CARD_AUTHENTICATION_START');
export const ID_CARD_AUTHENTICATION_START_SUCCESS = withPrefix(
  'ID_CARD_AUTHENTICATION_START_SUCCESS',
);
export const ID_CARD_AUTHENTICATION_START_ERROR = withPrefix('ID_CARD_AUTHENTICATION_START_ERROR');

export const ID_CARD_AUTHENTICATION_SUCCESS = withPrefix('ID_CARD_AUTHENTICATION_SUCCESS');
export const ID_CARD_AUTHENTICATION_ERROR = withPrefix('ID_CARD_AUTHENTICATION_ERROR');

export const GET_USER_START = withPrefix('GET_USER_START');
export const GET_USER_SUCCESS = withPrefix('GET_USER_SUCCESS');
export const GET_USER_ERROR = withPrefix('GET_USER_ERROR');

export const GET_USER_CONVERSION_START = withPrefix('GET_USER_CONVERSION_START');
export const GET_USER_CONVERSION_SUCCESS = withPrefix('GET_USER_CONVERSION_SUCCESS');
export const GET_USER_CONVERSION_ERROR = withPrefix('GET_USER_CONVERSION_ERROR');

export const TOKEN_REFRESH_START = withPrefix('TOKEN_REFRESH_START');
export const TOKEN_REFRESH_SUCCESS = withPrefix('TOKEN_REFRESH_SUCCESS');
export const TOKEN_REFRESH_ERROR = withPrefix('TOKEN_REFRESH_ERROR');

export const LOG_OUT = withPrefix('LOG_OUT');

export const USE_REDIRECT_LOGIN = withPrefix('USE_REDIRECT_LOGIN');

export const CHANGE_EMAIL = withPrefix('CHANGE_EMAIL');

export const QUERY_PARAMETERS = withPrefix('QUERY_PARAMETERS');

const withPrefix = name => `@login/${name}`;

export const CHANGE_PHONE_NUMBER = withPrefix('CHANGE_PHONE_NUMBER');

// START gets control code, then we start polling.
export const MOBILE_AUTHENTICATION_START = withPrefix('MOBILE_AUTHENTICATION_START');
export const MOBILE_AUTHENTICATION_START_SUCCESS = withPrefix('MOBILE_AUTHENTICATION_START_SUCCESS');
export const MOBILE_AUTHENTICATION_START_ERROR = withPrefix('MOBILE_AUTHENTICATION_START_ERROR');

export const MOBILE_AUTHENTICATION_SUCCESS = withPrefix('MOBILE_AUTHENTICATION_SUCCESS');
export const MOBILE_AUTHENTICATION_ERROR = withPrefix('MOBILE_AUTHENTICATION_ERROR');

export const MOBILE_AUTHENTICATION_CANCEL = withPrefix('MOBILE_AUTHENTICATION_CANCEL');

export const GET_USER_START = withPrefix('GET_USER_START');
export const GET_USER_SUCCESS = withPrefix('GET_USER_SUCCESS');
export const GET_USER_ERROR = withPrefix('GET_USER_ERROR');

export const LOG_OUT = withPrefix('LOG_OUT');

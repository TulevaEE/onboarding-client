const withPrefix = name => `@exchange/${name}`;

export const GET_SOURCE_FUNDS_START = withPrefix('GET_SOURCE_FUNDS_START');
export const GET_SOURCE_FUNDS_SUCCESS = withPrefix('GET_SOURCE_FUNDS_SUCCESS');
export const GET_SOURCE_FUNDS_ERROR = withPrefix('GET_SOURCE_FUNDS_ERROR');

export const SELECT_EXCHANGE_SOURCES = withPrefix('SELECT_EXCHANGE_SOURCES');

export const GET_TARGET_FUNDS_START = withPrefix('GET_TARGET_FUNDS_START');
export const GET_TARGET_FUNDS_SUCCESS = withPrefix('GET_TARGET_FUNDS_SUCCESS');
export const GET_TARGET_FUNDS_ERROR = withPrefix('GET_TARGET_FUNDS_ERROR');

export const SELECT_TARGET_FUND = withPrefix('SELECT_TARGET_FUND');

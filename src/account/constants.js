const withPrefix = name => `@account/${name}`;

export const GET_INITIAL_CAPITAL_START = withPrefix('GET_INITIAL_CAPITAL_START');
export const GET_INITIAL_CAPITAL_SUCCESS = withPrefix('GET_INITIAL_CAPITAL_SUCCESS');
export const GET_INITIAL_CAPITAL_ERROR = withPrefix('GET_INITIAL_CAPITAL_ERROR');

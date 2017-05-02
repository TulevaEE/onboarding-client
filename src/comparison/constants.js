const withPrefix = name => `@comparison/${name}`;

export const GET_COMPARISON_START = withPrefix('GET_COMPARISON_START');
export const GET_COMPARISON_SUCCESS = withPrefix('GET_COMPARISON_SUCCESS');
export const GET_COMPARISON_ERROR = withPrefix('GET_COMPARISON_ERROR');
export const COMPARISON_SALARY_CHANGE = withPrefix('COMPARISON_SALARY_CHANGE');
export const COMPARISON_RATE_CHANGE = withPrefix('COMPARISON_RATE_CHANGE');

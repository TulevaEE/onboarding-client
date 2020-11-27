const withPrefix = name => `@aml/${name}`;

export const GET_MISSING_AML_CHECKS_START = withPrefix('GET_MISSING_AML_CHECKS_START');
export const GET_MISSING_AML_CHECKS_SUCCESS = withPrefix('GET_MISSING_AML_CHECKS_SUCCESS');
export const GET_MISSING_AML_CHECKS_ERROR = withPrefix('GET_MISSING_AML_CHECKS_ERROR');

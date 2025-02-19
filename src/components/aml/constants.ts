const withPrefix = <T extends string>(name: T): `@aml/${T}` => `@aml/${name}`;

export const CHANGE_POLITICALLY_EXPOSED = withPrefix('CHANGE_POLITICALLY_EXPOSED');
export const CHANGE_RESIDENCY = withPrefix('CHANGE_RESIDENCY');
export const CHANGE_OCCUPATION = withPrefix('CHANGE_OCCUPATION');

export const CREATE_AML_CHECKS_START = withPrefix('CREATE_AML_CHECKS_START');
export const CREATE_AML_CHECKS_SUCCESS = withPrefix('CREATE_AML_CHECKS_SUCCESS');
export const CREATE_AML_CHECKS_ERROR = withPrefix('CREATE_AML_CHECKS_ERROR');

export const GET_MISSING_AML_CHECKS_START = withPrefix('GET_MISSING_AML_CHECKS_START');
export const GET_MISSING_AML_CHECKS_SUCCESS = withPrefix('GET_MISSING_AML_CHECKS_SUCCESS');
export const GET_MISSING_AML_CHECKS_ERROR = withPrefix('GET_MISSING_AML_CHECKS_ERROR');

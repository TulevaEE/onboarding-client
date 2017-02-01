const withPrefix = name => `@exchange/${name}`;

export const GET_PENSION_FUNDS_START = withPrefix('GET_PENSION_FUNDS_START');
export const GET_PENSION_FUNDS_SUCCESS = withPrefix('GET_PENSION_FUNDS_SUCCESS');
export const GET_PENSION_FUNDS_ERROR = withPrefix('GET_PENSION_FUNDS_ERROR');

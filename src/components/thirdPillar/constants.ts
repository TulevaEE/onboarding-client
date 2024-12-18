const withPrefix = <T extends string>(name: T): `@thirdPillar/${T}` => `@thirdPillar/${name}`;

export const QUERY_PARAMETERS = withPrefix('QUERY_PARAMETERS');
export const CHANGE_MONTHLY_CONTRIBUTION = withPrefix('CHANGE_MONTHLY_CONTRIBUTION');
export const CHANGE_EXCHANGE_EXISTING_UNITS = withPrefix('CHANGE_EXCHANGE_EXISTING_UNITS');
export const CHANGE_AGREEMENT_TO_TERMS = withPrefix('CHANGE_AGREEMENT_TO_TERMS');
export const SELECT_THIRD_PILLAR_SOURCES = withPrefix('SELECT_THIRD_PILLAR_SOURCES');

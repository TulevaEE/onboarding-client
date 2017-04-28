const withPrefix = name => `@newUserFlow/${name}`;

export const CREATE_NEW_USER_START = withPrefix('CREATE_NEW_USER_START');
export const CREATE_NEW_USER_SUCCESS = withPrefix('CREATE_NEW_USER_SUCCESS');
export const CREATE_NEW_USER_ERROR = withPrefix('CREATE_NEW_USER_ERROR');


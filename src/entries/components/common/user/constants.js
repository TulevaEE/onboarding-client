const withPrefix = name => `@user/${name}`;

export const UPDATE_USER_START = withPrefix('UPDATE_USER_START');
export const UPDATE_USER_SUCCESS = withPrefix('UPDATE_USER_SUCCESS');
export const UPDATE_USER_ERROR = withPrefix('UPDATE_USER_ERROR');
export const USER_UPDATED = withPrefix('USER_UPDATED');

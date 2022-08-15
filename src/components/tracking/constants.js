const withPrefix = (name) => `@tracking/${name}`;

export const CREATE_TRACKED_EVENT_START = withPrefix('CREATE_TRACKED_EVENT_START');
export const CREATE_TRACKED_EVENT_SUCCESS = withPrefix('CREATE_TRACKED_EVENT_SUCCESS');
export const CREATE_TRACKED_EVENT_ERROR = withPrefix('CREATE_TRACKED_EVENT_ERROR');

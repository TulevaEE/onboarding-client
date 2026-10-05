const ERRORS_OF_A_LOGIN_CANCELLED_IN_THE_APP = ['smart.id.user.refused', 'mobile.id.cancelled'];

export const cancelledInTheApp = (errorCode: string | null | undefined): boolean =>
  errorCode != null && ERRORS_OF_A_LOGIN_CANCELLED_IN_THE_APP.includes(errorCode);

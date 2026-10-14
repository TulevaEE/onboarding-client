export const ANOTHER_LOGIN_OF_THIS_BROWSER_REJECTS_THE_CALLBACK = 'smart.id.callback.invalid';

export const ONLY_A_MISSING_SESSION_IS_TOLD_TO_LOG_IN_HERE =
  'PR #1663 tells the person to log in in the browser Smart-ID opened only for auth.session.not.found; ' +
  'when that browser holds an unfinished Smart-ID login of its own (abandoned, failed or expired), the backend ' +
  'answers the callback with smart.id.callback.invalid (Callback token mismatch) and the page shows the generic error';

import { Dispatch } from 'redux';
import { AuthenticationPrincipal } from './apiModels';
import { LOG_OUT, UPDATE_AUTHENTICATION_PRINCIPAL } from '../login/constants';

export interface UpdatableAuthenticationPrincipal extends AuthenticationPrincipal {
  update: (authenticationPrincipal: AuthenticationPrincipal) => void;
  remove: () => void;
}

export function withUpdatableAuthenticationPrincipal(
  authenticationPrincipal: AuthenticationPrincipal,
  dispatch: Dispatch,
): UpdatableAuthenticationPrincipal {
  const update = (newAuthenticationPrincipal: AuthenticationPrincipal): void => {
    dispatch({
      type: UPDATE_AUTHENTICATION_PRINCIPAL,
      principal: newAuthenticationPrincipal,
    });
  };

  const remove = (): void => {
    dispatch({
      type: LOG_OUT,
    });
  };

  return {
    ...authenticationPrincipal,
    update,
    remove,
  };
}

// This is only needed, because there is 1 API call outside of the dispatch context. We should refactor that call.
export function withNotUpdatableAuthenticationPrincipal(
  authenticationPrincipal: AuthenticationPrincipal,
): UpdatableAuthenticationPrincipal {
  const update = (): void => {};

  const remove = (): void => {};

  return {
    ...authenticationPrincipal,
    update,
    remove,
  };
}

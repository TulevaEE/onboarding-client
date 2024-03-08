// yourModule.test.ts
import { Action, Dispatch } from 'redux';
import {
  withUpdatableAuthenticationPrincipal,
  withNotUpdatableAuthenticationPrincipal,
  UpdatableAuthenticationPrincipal,
} from './updatableAuthenticationPrincipal';
import { UPDATE_AUTHENTICATION_PRINCIPAL, LOG_OUT } from '../login/constants';
import { AuthenticationPrincipal } from './apiModels';

type MockDispatch = jest.Mock<void, [Action]>;
describe('withUpdatableAuthenticationPrincipal', () => {
  const mockDispatch: MockDispatch = jest.fn();
  const initialPrincipal: AuthenticationPrincipal = {
    accessToken: 'an access token',
    refreshToken: 'a refresh token',
    loginMethod: 'SMART_ID',
  };

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('dispatches UPDATE_AUTHENTICATION_PRINCIPAL with new principal on update', () => {
    const updatable: UpdatableAuthenticationPrincipal = withUpdatableAuthenticationPrincipal(
      initialPrincipal,
      mockDispatch as Dispatch,
    );
    const newPrincipal: AuthenticationPrincipal = {
      accessToken: 'new access token',
      refreshToken: 'new refresh token',
      loginMethod: 'SMART_ID',
    };
    updatable.update(newPrincipal);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: UPDATE_AUTHENTICATION_PRINCIPAL,
      principal: newPrincipal,
    });
  });

  it('dispatches LOG_OUT on remove', () => {
    const updatable: UpdatableAuthenticationPrincipal = withUpdatableAuthenticationPrincipal(
      initialPrincipal,
      mockDispatch as Dispatch,
    );
    updatable.remove();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: LOG_OUT,
    });
  });
});

describe('withNotUpdatableAuthenticationPrincipal', () => {
  const initialPrincipal: AuthenticationPrincipal = {
    accessToken: 'an access token',
    refreshToken: 'a refresh token',
    loginMethod: 'SMART_ID',
  };

  it('does not dispatch on update', () => {
    const mockDispatch: MockDispatch = jest.fn();
    const notUpdatable: UpdatableAuthenticationPrincipal =
      withNotUpdatableAuthenticationPrincipal(initialPrincipal);
    notUpdatable.update({ ...initialPrincipal, accessToken: 'new access token' });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch on remove', () => {
    const mockDispatch: MockDispatch = jest.fn();
    const notUpdatable: UpdatableAuthenticationPrincipal =
      withNotUpdatableAuthenticationPrincipal(initialPrincipal);
    notUpdatable.remove();

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

export const anAuthenticationPrincipal = (
  accessToken = 'an access token',
): AuthenticationPrincipal => {
  return {
    accessToken,
    refreshToken: 'a refresh token',
    loginMethod: 'SMART_ID',
  };
};

export const anUpdatableAuthenticationPrincipal = (
  accessToken = 'an access token',
): UpdatableAuthenticationPrincipal => {
  return {
    accessToken,
    refreshToken: 'a refresh token',
    loginMethod: 'SMART_ID',
    update: () => null,
    remove: () => null,
  };
};

import config from 'react-global-configuration';
import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getAuthentication } from '../common/authenticationManager';
import { getGlobalErrorCode } from '../common/errorMessage';
import { isErrorResponse } from '../common/errorResponse';
import { get, post } from '../common/http';
import { forgetConnectLoginInFlight } from './freshLogin';

export interface ConnectRequest {
  clientName: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
}

interface ConnectRedirect {
  redirectUri: string;
}

const statusOf = (error: unknown) => (error as { status?: number } | null)?.status;

const codeOf = (error: unknown): string | undefined =>
  isErrorResponse(error) ? getGlobalErrorCode(error.body) : undefined;

export const asksForAFreshLogin = (error: unknown): boolean =>
  statusOf(error) === 401 ||
  (statusOf(error) === 403 && !codeOf(error)) ||
  codeOf(error) === 'connect.login.required';

export const requestIsGone = (error: unknown): boolean => statusOf(error) === 404;

const connectEndpoint = (requestId: string) =>
  `${config.get('apiUrl')}/connect/${encodeURIComponent(requestId)}`;

const forgetTheRequestWhenGone = (requestId: string) => (error: unknown) => {
  if (requestIsGone(error)) {
    forgetConnectLoginInFlight(requestId);
  }
};

const returnToTheApp =
  (requestId: string) =>
  ({ redirectUri }: ConnectRedirect) => {
    forgetConnectLoginInFlight(requestId);
    window.location.assign(redirectUri);
  };

function getConnectRequest(requestId: string): Promise<ConnectRequest> {
  return get(connectEndpoint(requestId));
}

export function useConnectRequest(requestId: string): UseQueryResult<ConnectRequest> {
  return useQuery({
    queryKey: ['connectRequest', requestId],
    queryFn: () => getConnectRequest(requestId),
    retry: false,
    staleTime: Infinity,
    cacheTime: 0,
    onError: forgetTheRequestWhenGone(requestId),
  });
}

function approveConnectRequest(requestId: string): Promise<ConnectRedirect> {
  const { accessToken } = getAuthentication();
  return post(
    `${connectEndpoint(requestId)}/approve`,
    {},
    { Authorization: `Bearer ${accessToken}` },
  );
}

export function useApproveConnectRequest(requestId: string) {
  return useMutation({
    mutationFn: () => approveConnectRequest(requestId),
    onSuccess: returnToTheApp(requestId),
    onError: forgetTheRequestWhenGone(requestId),
  });
}

function denyConnectRequest(requestId: string): Promise<ConnectRedirect> {
  return post(`${connectEndpoint(requestId)}/deny`);
}

export function useDenyConnectRequest(requestId: string) {
  return useMutation({
    mutationFn: () => denyConnectRequest(requestId),
    onSuccess: returnToTheApp(requestId),
    onError: forgetTheRequestWhenGone(requestId),
  });
}

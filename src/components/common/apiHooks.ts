import { useMutation, UseMutationResult, useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import {
  createApplicationCancellation,
  getContributions,
  getFunds,
  getMandateDeadlines,
  getPendingApplications,
  getTransactions,
  getUserConversionWithToken,
  getUserWithToken,
} from './api';
import {
  Application,
  AuthenticationPrincipal,
  CancellationMandate,
  Contribution,
  Fund,
  MandateDeadlines,
  Transaction,
  User,
  UserConversion,
} from './apiModels';
import {
  UpdatableAuthenticationPrincipal,
  withUpdatableAuthenticationPrincipal,
} from './updatableAuthenticationPrincipal';

export function useUpdatableAuthenticationPrincipalOrFail(): UpdatableAuthenticationPrincipal {
  const authenticationPrincipal = useSelector<
    { login: { authenticationPrincipal?: AuthenticationPrincipal } },
    AuthenticationPrincipal | null
  >((state) => state.login.authenticationPrincipal || null);
  if (!authenticationPrincipal?.accessToken) {
    throw new Error('Tried to use token without the user being signed up');
  }
  return withUpdatableAuthenticationPrincipal(authenticationPrincipal, useDispatch());
}

export function usePendingApplications(): UseQueryResult<Application[]> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('pendingApplications', () => getPendingApplications(authenticationPrincipal));
}

export function useTransactions(): UseQueryResult<Transaction[]> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('transactions', () => getTransactions(authenticationPrincipal));
}

export function useContributions(): UseQueryResult<Contribution[]> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('contributions', () => getContributions(authenticationPrincipal));
}

export function useFunds(): UseQueryResult<Fund[]> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('funds', () => getFunds(authenticationPrincipal));
}

export function useApplicationCancellation(): UseMutationResult<
  CancellationMandate,
  unknown,
  number,
  unknown
> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useMutation((applicationId: number) =>
    createApplicationCancellation(applicationId, authenticationPrincipal),
  );
}

export function useApplication(id: number): UseQueryResult<Application | null> {
  // TODO: replace with /:id api once one exists
  const result = usePendingApplications();
  return {
    ...result,
    data: result.data ? result.data.find((application) => application.id === id) || null : null,
  } as UseQueryResult<Application | null>;
}

export function useMandateDeadlines(): UseQueryResult<MandateDeadlines> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('mandateDeadlines', () => getMandateDeadlines(authenticationPrincipal));
}

export function useMe(): UseQueryResult<User> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('user', () => getUserWithToken(authenticationPrincipal));
}

export function useConversion(): UseQueryResult<UserConversion> {
  const authenticationPrincipal = useUpdatableAuthenticationPrincipalOrFail();
  return useQuery('conversion', () => getUserConversionWithToken(authenticationPrincipal));
}

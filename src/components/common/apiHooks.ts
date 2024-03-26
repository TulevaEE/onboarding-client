import { useMutation, UseMutationResult, useQuery, UseQueryResult } from 'react-query';

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
  CancellationMandate,
  Contribution,
  Fund,
  MandateDeadlines,
  Transaction,
  User,
  UserConversion,
} from './apiModels';

export function usePendingApplications(): UseQueryResult<Application[]> {
  return useQuery('pendingApplications', () => getPendingApplications());
}

export function useTransactions(): UseQueryResult<Transaction[]> {
  return useQuery('transactions', () => getTransactions());
}

export function useContributions(): UseQueryResult<Contribution[]> {
  return useQuery('contributions', () => getContributions());
}

export function useFunds(): UseQueryResult<Fund[]> {
  return useQuery('funds', () => getFunds());
}

export function useApplicationCancellation(): UseMutationResult<
  CancellationMandate,
  unknown,
  number,
  unknown
> {
  return useMutation((applicationId: number) => createApplicationCancellation(applicationId));
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
  return useQuery('mandateDeadlines', () => getMandateDeadlines());
}

export function useMe(): UseQueryResult<User> {
  return useQuery('user', () => getUserWithToken());
}

export function useConversion(): UseQueryResult<UserConversion> {
  return useQuery('conversion', () => getUserConversionWithToken());
}

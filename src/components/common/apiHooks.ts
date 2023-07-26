import { useMutation, UseMutationResult, useQuery, UseQueryResult } from 'react-query';
import { useSelector } from 'react-redux';

import {
  createApplicationCancellation,
  getContributions,
  getFunds,
  getMandateDeadlines,
  getPendingApplications,
  getTransactions,
} from './api';
import {
  Application,
  CancellationMandate,
  Contribution,
  Fund,
  MandateDeadlines,
  Transaction,
} from './apiModels';

function useTokenOrFail(): string {
  const token = useSelector<{ login: { token?: string } }, string | null>(
    (state) => state.login.token || null,
  );
  if (!token) {
    throw new Error('Tried to use token without the user being signed up');
  }
  return token;
}

export function usePendingApplications(): UseQueryResult<Application[]> {
  const token = useTokenOrFail();
  return useQuery('pendingApplications', () => getPendingApplications(token));
}

export function useTransactions(): UseQueryResult<Transaction[]> {
  const token = useTokenOrFail();
  return useQuery('transactions', () => getTransactions(token));
}

export function useContributions(): UseQueryResult<Contribution[]> {
  const token = useTokenOrFail();
  return useQuery('contributions', () => getContributions(token));
}

export function useFunds(): UseQueryResult<Fund[]> {
  const token = useTokenOrFail();
  return useQuery('funds', () => getFunds(token));
}

export function useApplicationCancellation(): UseMutationResult<
  CancellationMandate,
  unknown,
  number,
  unknown
> {
  const token = useTokenOrFail();
  return useMutation((applicationId: number) =>
    createApplicationCancellation(applicationId, token),
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
  const token = useTokenOrFail();
  return useQuery('mandateDeadlines', () => getMandateDeadlines(token));
}

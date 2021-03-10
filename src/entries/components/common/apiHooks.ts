import { useQuery, UseQueryResult } from 'react-query';
import { useSelector } from 'react-redux';

import { Application, getPendingApplications, getFunds, Fund } from './api';

function useTokenOrFail(): string {
  const token = useSelector<{ login: { token?: string } }, string | null>(
    (state) => state.login.token || null,
  );
  if (!token) {
    throw new Error('Tried to use token without the user being signed up');
  }
  return token;
}

export function useFunds(): UseQueryResult<Fund[]> {
  const token = useTokenOrFail();
  return useQuery('funds', () => getFunds(token));
}

export function usePendingApplications(): UseQueryResult<Application[]> {
  const token = useTokenOrFail();
  return useQuery('pendingApplications', () => getPendingApplications(token));
}

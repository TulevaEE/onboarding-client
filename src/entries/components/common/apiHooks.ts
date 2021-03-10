import { useQuery, UseQueryResult } from 'react-query';
import { useSelector } from 'react-redux';

import { Application, getPendingApplications, getFunds, Fund } from './api';

function useToken(): string | null {
  return useSelector<{ login: { token?: string } }, string | null>(
    (state) => state.login.token || null,
  );
}

export function useFunds(): UseQueryResult<Fund[]> {
  const token = useToken();
  return useQuery('funds', () => getFunds(token!));
}

export function usePendingApplications(): UseQueryResult<Application[]> {
  const token = useToken();
  return useQuery('pendingApplications', () => getPendingApplications(token!));
}

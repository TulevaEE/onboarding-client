import { useMutation, UseMutationResult, useQuery, UseQueryResult } from '@tanstack/react-query';

import {
  createApplicationCancellation,
  createMandateBatch,
  getCapitalEvents,
  getContributions,
  getFundPensionStatus,
  getFunds,
  getMandateDeadlines,
  getPendingApplications,
  getSourceFunds,
  getTransactions,
  getUserConversionWithToken,
  getUserWithToken,
  getWithdrawalsEligibility,
} from './api';
import {
  Application,
  CancellationMandate,
  CapitalEvent,
  Contribution,
  ErrorResponse,
  Fund,
  MandateDeadlines,
  SourceFund,
  Transaction,
  User,
  UserConversion,
} from './apiModels';
import {
  CreateMandateBatchDto,
  FundPensionStatus,
  MandateBatchDto,
  WithdrawalsEligibility,
} from './apiModels/withdrawals';

export function usePendingApplications(): UseQueryResult<Application[]> {
  return useQuery(['pendingApplications'], () => getPendingApplications());
}

export function useTransactions(): UseQueryResult<Transaction[]> {
  return useQuery(['transactions'], () => getTransactions());
}

export function useCapitalEvents(): UseQueryResult<CapitalEvent[]> {
  return useQuery(['capitalEvents'], () => getCapitalEvents());
}

export function useContributions(): UseQueryResult<Contribution[]> {
  return useQuery(['contributions'], () => getContributions());
}

export function useFunds(): UseQueryResult<Fund[]> {
  return useQuery(['funds'], () => getFunds());
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
  return useQuery(['mandateDeadlines'], () => getMandateDeadlines());
}

export function useMe(): UseQueryResult<User> {
  return useQuery(['user'], () => getUserWithToken());
}

export function useWithdrawalsEligibility(): UseQueryResult<WithdrawalsEligibility> {
  return useQuery(['withdrawalsEligibility'], () => getWithdrawalsEligibility());
}

export function useFundPensionStatus(): UseQueryResult<FundPensionStatus> {
  return useQuery(['fundPensionStatus'], () => getFundPensionStatus());
}

export function useConversion(): UseQueryResult<UserConversion> {
  return useQuery(['conversion'], () => getUserConversionWithToken());
}

export function useSourceFunds(fromDate?: string, toDate?: string): UseQueryResult<SourceFund[]> {
  return useQuery(['sourceFunds'], () => getSourceFunds(fromDate, toDate));
}

export function useCreateMandateBatch(): UseMutationResult<
  MandateBatchDto,
  ErrorResponse,
  CreateMandateBatchDto,
  unknown
> {
  return useMutation((dto) => createMandateBatch(dto));
}

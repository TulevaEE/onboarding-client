import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import { AxiosError } from 'axios';
import { useState } from 'react';
import {
  createApplicationCancellation,
  createCapitalTransferContract,
  createMandateBatch,
  createMemberCapitalListing,
  deleteMemberCapitalListing,
  getCapitalEvents,
  getCapitalRowsWithToken,
  getCapitalTransferContract,
  getContributions,
  getFundPensionStatus,
  getFunds,
  getMandateDeadlines,
  getMemberCapitalListings,
  getMemberLookup,
  getPendingApplications,
  getSourceFunds,
  getTransactions,
  getUserConversionWithToken,
  getUserWithToken,
  getWithdrawalsEligibility,
  updateCapitalTransferContract,
} from './api';
import {
  Application,
  CancellationMandate,
  CapitalEvent,
  CapitalRow,
  Contribution,
  CreateMemberCapitalListingDto,
  ErrorResponse,
  Fund,
  MandateDeadlines,
  MemberCapitalListing,
  MemberLookup,
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
import {
  CapitalTransferContract,
  CreateCapitalTransferDto,
  UpdateCapitalTransferContractDto,
} from './apiModels/capital-transfer';

export function usePendingApplications(): UseQueryResult<Application[]> {
  return useQuery(['pendingApplications'], () => getPendingApplications());
}

export function useTransactions(): UseQueryResult<Transaction[]> {
  return useQuery(['transactions'], () => getTransactions());
}

export function useCapitalEvents(): UseQueryResult<CapitalEvent[]> {
  return useQuery(['capitalEvents'], () => getCapitalEvents());
}

export function useCapitalRows(): UseQueryResult<CapitalRow[]> {
  return useQuery(['capitalRows'], () => getCapitalRowsWithToken());
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
  return useQuery(['sourceFunds', fromDate, toDate], () => getSourceFunds(fromDate, toDate));
}

export function useCreateMandateBatch(): UseMutationResult<
  MandateBatchDto,
  ErrorResponse,
  CreateMandateBatchDto,
  unknown
> {
  return useMutation((dto) => createMandateBatch(dto));
}

export function useCreateCapitalTransferContract(): UseMutationResult<
  CapitalTransferContract,
  ErrorResponse,
  CreateCapitalTransferDto,
  unknown
> {
  return useMutation((dto) => createCapitalTransferContract(dto));
}

export function useCapitalTransferContract(id: number): UseQueryResult<CapitalTransferContract> {
  return useQuery([], () => getCapitalTransferContract(id));
}

export function useUpdateCapitalTransferContract(): UseMutationResult<
  CapitalTransferContract,
  ErrorResponse,
  UpdateCapitalTransferContractDto,
  unknown
> {
  return useMutation((dto) => updateCapitalTransferContract(dto));
}

export function useMemberCapitalListings(): UseQueryResult<MemberCapitalListing[]> {
  return useQuery(['memberCapitalListings'], () => getMemberCapitalListings());
}

export function useCreateMemberCapitalListing(): UseMutationResult<
  MemberCapitalListing,
  ErrorResponse,
  CreateMemberCapitalListingDto,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto) => createMemberCapitalListing(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberCapitalListings'] });
    },
  });
}

export function useDeleteMemberCapitalListing(): UseMutationResult<
  MemberCapitalListing,
  ErrorResponse,
  MemberCapitalListing,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listing) => deleteMemberCapitalListing(listing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberCapitalListings'] });
    },
  });
}

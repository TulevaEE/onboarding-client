import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  contactMemberCapitalListingOwner,
  createApplicationCancellation,
  createCapitalTransferContract,
  createMandateBatch,
  createMemberCapitalListing,
  createSavingsFundPaymentCancellation,
  deleteMemberCapitalListing,
  getCapitalEvents,
  getCapitalRowsWithToken,
  getCapitalTotal,
  getCapitalTransferContract,
  getContributions,
  getFundPensionStatus,
  getFunds,
  getMandateDeadlines,
  getMemberCapitalListingCount,
  getMemberCapitalListings,
  getMyCapitalTransferContracts,
  getPendingApplications,
  getSavingsFundBalance,
  getSavingsFundOnboardingStatus,
  getSourceFunds,
  getTransactions,
  getUserConversionWithToken,
  getUserWithToken,
  getWithdrawalsEligibility,
  previewMessageForMemberCapitalListing,
  updateCapitalTransferContract,
} from './api';
import {
  Application,
  CancellationMandate,
  CapitalEvent,
  CapitalRow,
  CapitalTotal,
  ContactListingOwnerDto,
  ContactListingOwnerResponse,
  Contribution,
  CreateMemberCapitalListingDto,
  ErrorResponse,
  Fund,
  MandateDeadlines,
  MemberCapitalListing,
  SavingsFundOnboardingStatus,
  SavingsFundPaymentCancellationCommand,
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

export function useCapitalTotal(): UseQueryResult<CapitalTotal> {
  return useQuery(['capitalTotal'], () => getCapitalTotal());
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

export function useSavingsFundPaymentCancellation(): UseMutationResult<
  void,
  unknown,
  SavingsFundPaymentCancellationCommand,
  unknown
> {
  return useMutation(({ paymentId }: SavingsFundPaymentCancellationCommand) =>
    createSavingsFundPaymentCancellation(paymentId),
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

export function useSavingsFundOnboardingStatus(): UseQueryResult<SavingsFundOnboardingStatus> {
  return useQuery(['savingsFundOnboardingStatus'], () => getSavingsFundOnboardingStatus());
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

export function useMyCapitalTransferContracts(): UseQueryResult<CapitalTransferContract[]> {
  return useQuery(['myCapitalTransferContracts'], () => getMyCapitalTransferContracts());
}

export function useCapitalTransferContract(
  id: number,
  manualRefetch: boolean,
): UseQueryResult<CapitalTransferContract, { status: number }> {
  return useQuery(['capitalTransferContract', id], () => getCapitalTransferContract(id), {
    enabled: !manualRefetch,
    retry: false,
  });
}

export function useUpdateCapitalTransferContract(): UseMutationResult<
  CapitalTransferContract,
  ErrorResponse,
  UpdateCapitalTransferContractDto,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation((dto) => updateCapitalTransferContract(dto), {
    onSuccess: () => {
      queryClient.invalidateQueries(['myCapitalTransferContracts']);
    },
  });
}

export function useMemberCapitalListings(): UseQueryResult<MemberCapitalListing[]> {
  return useQuery(['memberCapitalListings'], () => getMemberCapitalListings());
}

export function useMemberCapitalListingCount(): UseQueryResult<number> {
  return useQuery(['memberCapitalListingCount'], () => getMemberCapitalListingCount());
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

export function usePreviewMemberCapitalListingMessage(dto: ContactListingOwnerDto) {
  return useQuery(
    ['listingMessage', dto.id, dto.addPersonalCode, dto.addPhoneNumber],
    () => previewMessageForMemberCapitalListing(dto),
    {
      enabled: true,
    },
  );
}

export function useContactMemberCapitalListing(): UseMutationResult<
  ContactListingOwnerResponse,
  ErrorResponse,
  ContactListingOwnerDto,
  unknown
> {
  return useMutation({
    mutationFn: (dto) => contactMemberCapitalListingOwner(dto),
  });
}

export function useSavingsFundBalance(): UseQueryResult<SourceFund | null> {
  return useQuery(['savingsFundBalance'], () => getSavingsFundBalance());
}

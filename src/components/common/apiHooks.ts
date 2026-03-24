import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import {
  cancelSavingsFundWithdrawal,
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
  getSavingsFundBankAccounts,
  getSavingsFundOnboardingStatus,
  getSourceFunds,
  getTransactions,
  getUserConversionWithToken,
  getRoles,
  switchRole,
  getUserWithToken,
  getWithdrawalsEligibility,
  postSavingsFundOnboardingSurvey,
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
  ActingAs,
  Role,
  Token,
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
import { OnboardingSurveyCommand } from '../flows/savingsAccount/SavingsFundOnboarding/types.api';

export function usePendingApplications(): UseQueryResult<Application[]> {
  return useQuery({ queryKey: ['pendingApplications'], queryFn: () => getPendingApplications() });
}

export function useTransactions(): UseQueryResult<Transaction[]> {
  return useQuery({ queryKey: ['transactions'], queryFn: () => getTransactions() });
}

export function useCapitalEvents(): UseQueryResult<CapitalEvent[]> {
  return useQuery({ queryKey: ['capitalEvents'], queryFn: () => getCapitalEvents() });
}

export function useCapitalRows(): UseQueryResult<CapitalRow[]> {
  return useQuery({ queryKey: ['capitalRows'], queryFn: () => getCapitalRowsWithToken() });
}

export function useCapitalTotal(): UseQueryResult<CapitalTotal> {
  return useQuery({ queryKey: ['capitalTotal'], queryFn: () => getCapitalTotal() });
}

export function useContributions(): UseQueryResult<Contribution[]> {
  return useQuery({ queryKey: ['contributions'], queryFn: () => getContributions() });
}

export function useFunds(): UseQueryResult<Fund[]> {
  return useQuery({ queryKey: ['funds'], queryFn: () => getFunds() });
}

export function useApplicationCancellation(): UseMutationResult<
  CancellationMandate,
  unknown,
  number,
  unknown
> {
  return useMutation({
    mutationFn: (applicationId: number) => createApplicationCancellation(applicationId),
  });
}

export function useSavingsFundPaymentCancellation(): UseMutationResult<
  void,
  unknown,
  SavingsFundPaymentCancellationCommand,
  unknown
> {
  return useMutation({
    mutationFn: ({ paymentId }: SavingsFundPaymentCancellationCommand) =>
      createSavingsFundPaymentCancellation(paymentId),
  });
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
  return useQuery({ queryKey: ['mandateDeadlines'], queryFn: () => getMandateDeadlines() });
}

export function useMe(): UseQueryResult<User> {
  return useQuery({ queryKey: ['user'], queryFn: () => getUserWithToken() });
}

export function useWithdrawalsEligibility(): UseQueryResult<WithdrawalsEligibility> {
  return useQuery({
    queryKey: ['withdrawalsEligibility'],
    queryFn: () => getWithdrawalsEligibility(),
  });
}

export function useFundPensionStatus(): UseQueryResult<FundPensionStatus> {
  return useQuery({ queryKey: ['fundPensionStatus'], queryFn: () => getFundPensionStatus() });
}

export function useConversion(): UseQueryResult<UserConversion> {
  return useQuery({ queryKey: ['conversion'], queryFn: () => getUserConversionWithToken() });
}

export function useSourceFunds(fromDate?: string, toDate?: string): UseQueryResult<SourceFund[]> {
  return useQuery({
    queryKey: ['sourceFunds', fromDate, toDate],
    queryFn: () => getSourceFunds(fromDate, toDate),
  });
}

export function useSavingsFundOnboardingStatus(): UseQueryResult<SavingsFundOnboardingStatus> {
  return useQuery({
    queryKey: ['savingsFundOnboardingStatus'],
    queryFn: () => getSavingsFundOnboardingStatus(),
  });
}

export function useCreateMandateBatch(): UseMutationResult<
  MandateBatchDto,
  ErrorResponse,
  CreateMandateBatchDto,
  unknown
> {
  return useMutation({ mutationFn: (dto) => createMandateBatch(dto) });
}

export function useCreateCapitalTransferContract(): UseMutationResult<
  CapitalTransferContract,
  ErrorResponse,
  CreateCapitalTransferDto,
  unknown
> {
  return useMutation({ mutationFn: (dto) => createCapitalTransferContract(dto) });
}

export function useMyCapitalTransferContracts(): UseQueryResult<CapitalTransferContract[]> {
  return useQuery({
    queryKey: ['myCapitalTransferContracts'],
    queryFn: () => getMyCapitalTransferContracts(),
  });
}

export function useCapitalTransferContract(
  id: number,
  manualRefetch: boolean,
): UseQueryResult<CapitalTransferContract, { status: number }> {
  return useQuery({
    queryKey: ['capitalTransferContract', id],
    queryFn: () => getCapitalTransferContract(id),
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

  return useMutation({
    mutationFn: (dto) => updateCapitalTransferContract(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCapitalTransferContracts'] });
    },
  });
}

export function useMemberCapitalListings(): UseQueryResult<MemberCapitalListing[]> {
  return useQuery({
    queryKey: ['memberCapitalListings'],
    queryFn: () => getMemberCapitalListings(),
  });
}

export function useMemberCapitalListingCount(): UseQueryResult<number> {
  return useQuery({
    queryKey: ['memberCapitalListingCount'],
    queryFn: () => getMemberCapitalListingCount(),
  });
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

export function useSubmitSavingsFundOnboardingSurvey(): UseMutationResult<
  void,
  ErrorResponse,
  OnboardingSurveyCommand,
  unknown
> {
  return useMutation({
    mutationFn: (command) => postSavingsFundOnboardingSurvey(command),
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
  return useQuery({
    queryKey: ['listingMessage', dto.id, dto.addPersonalCode, dto.addPhoneNumber],
    queryFn: () => previewMessageForMemberCapitalListing(dto),
    enabled: true,
  });
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
  return useQuery({ queryKey: ['savingsFundBalance'], queryFn: () => getSavingsFundBalance() });
}

export function useSavingsFundBankAccounts(): UseQueryResult<string[]> {
  return useQuery({
    queryKey: ['savingsFundBankAccounts'],
    queryFn: () => getSavingsFundBankAccounts(),
  });
}

export function useSavingsFundWithdrawalCancellation(): UseMutationResult<
  void,
  unknown,
  { id: string },
  unknown
> {
  return useMutation({ mutationFn: ({ id }: { id: string }) => cancelSavingsFundWithdrawal(id) });
}

export function useRoles(): UseQueryResult<Role[]> {
  return useQuery({ queryKey: ['roles'], queryFn: () => getRoles() });
}

export function useSwitchRole(): UseMutationResult<Token, ErrorResponse, ActingAs, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actingAs: ActingAs) => switchRole(actingAs),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

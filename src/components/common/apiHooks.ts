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
  createChild,
  getCompanyBusinessRegistryValidation,
  getEligibleChildren,
  getContributions,
  getFundPensionStatus,
  getKycIdentity,
  getFunds,
  getMandateDeadlines,
  getMemberCapitalListingCount,
  getMemberCapitalListings,
  getMyCapitalTransferContracts,
  getPendingApplications,
  getPendingChildOnboardings,
  getSavingsFundBalance,
  getSavingsFundBankAccounts,
  getSavingsFundCompanyOnboardingStatus,
  getSavingsFundOnboardingStatus,
  getSavingsFundPersonOnboardingStatus,
  getSecondPillarAssets,
  getSourceFunds,
  getTransactions,
  getUserConversionWithToken,
  getRoles,
  switchRole,
  getUserWithToken,
  getWithdrawalsEligibility,
  postSavingsFundCompanyOnboardingSurvey,
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
  PendingChildOnboarding,
  Role,
  SecondPillarAssets,
  SwitchRoleCommand,
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
import { BusinessRegistryValidatedData } from './apiModels/company-onboarding';
import {
  ChildResponse,
  CompanyOnboardingSurveyCommand,
  CreateChildCommand,
  EligibleChild,
  KycIdentity,
  OnboardingSurveyCommand,
} from '../flows/savingsAccount/SavingsFundOnboarding/types.api';

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

export function useSecondPillarAssets(): UseQueryResult<SecondPillarAssets> {
  return useQuery({
    queryKey: ['secondPillarAssets'],
    queryFn: () => getSecondPillarAssets(),
  });
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

export function useSourceFunds(
  fromDate?: string,
  toDate?: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<SourceFund[]> {
  return useQuery({
    queryKey: ['sourceFunds', fromDate, toDate],
    queryFn: () => getSourceFunds(fromDate, toDate),
    enabled: options.enabled ?? true,
  });
}

export function useCompanyBusinessRegistryValidation(
  registryCode: string,
): UseQueryResult<BusinessRegistryValidatedData> {
  return useQuery({
    queryKey: ['companyBusinessRegistryValidation', registryCode],
    queryFn: () => getCompanyBusinessRegistryValidation(registryCode),
    enabled: !!registryCode,
    refetchOnWindowFocus: false,
    retry: (_failureCount, error) => {
      const { status } = error as { status?: number };
      return status !== 403 && status !== 501;
    },
  });
}

export function useSavingsFundOnboardingStatus(): UseQueryResult<SavingsFundOnboardingStatus> {
  const { data: user } = useMe();
  // The endpoint resolves to the acting party's status, so key the cache by the
  // acting party. A role switch then lands on a fresh entry instead of serving
  // the previous role's status — which would otherwise leak a completed
  // company's access to a not-yet-onboarded person, and vice versa.
  return useQuery({
    queryKey: ['savingsFundOnboardingStatus', user?.role?.code],
    queryFn: () => getSavingsFundOnboardingStatus(),
  });
}

// The natural person's own onboarding status, independent of the acting role —
// use this wherever the question is about the person, not the acting party.
export function useSavingsFundPersonOnboardingStatus(): UseQueryResult<SavingsFundOnboardingStatus> {
  return useQuery({
    queryKey: ['savingsFundPersonOnboardingStatus'],
    queryFn: () => getSavingsFundPersonOnboardingStatus(),
  });
}

export function useKycIdentity(): UseQueryResult<KycIdentity> {
  // The onboarding flow blocks on this query with an explicit retry button,
  // so fail fast instead of stalling behind silent automatic retries.
  return useQuery({
    queryKey: ['kycIdentity'],
    queryFn: () => getKycIdentity(),
    retry: false,
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

export function useSavingsFundCompanyOnboardingStatus(
  registryCode: string | undefined,
): UseQueryResult<SavingsFundOnboardingStatus> {
  return useQuery({
    queryKey: ['savingsFundCompanyOnboardingStatus', registryCode],
    queryFn: () => getSavingsFundCompanyOnboardingStatus(registryCode ?? ''),
    enabled: Boolean(registryCode),
  });
}

export function useSubmitSavingsFundCompanyOnboardingSurvey(): UseMutationResult<
  void,
  ErrorResponse,
  { command: CompanyOnboardingSurveyCommand; registryCode: string },
  unknown
> {
  return useMutation({
    mutationFn: ({ command, registryCode }) =>
      postSavingsFundCompanyOnboardingSurvey(command, registryCode),
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

export function useEligibleChildren(): UseQueryResult<EligibleChild[]> {
  // The identity step falls back to manual code entry when this lookup fails,
  // so fail fast instead of stalling behind silent automatic retries.
  return useQuery({
    queryKey: ['eligibleChildren'],
    queryFn: () => getEligibleChildren(),
    retry: false,
  });
}

export function useCreateChild(): UseMutationResult<
  ChildResponse,
  ErrorResponse,
  CreateChildCommand,
  unknown
> {
  return useMutation({ mutationFn: (command) => createChild(command) });
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

export function usePendingChildOnboardings(): UseQueryResult<PendingChildOnboarding[]> {
  return useQuery({
    queryKey: ['pendingChildOnboardings'],
    queryFn: () => getPendingChildOnboardings(),
  });
}

export function useSwitchRole(): UseMutationResult<
  Token,
  ErrorResponse,
  SwitchRoleCommand,
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: SwitchRoleCommand) => switchRole(command),
    onSuccess: () => {
      // Reset rather than invalidate: the new role must not see the previous
      // role's data. Invalidate keeps the stale cache visible while refetching,
      // so the account page would flash the old role's values. Reset clears it,
      // flipping queries to a loading state until the new role's data arrives.
      queryClient.resetQueries();
    },
  });
}

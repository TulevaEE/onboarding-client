import { Application, Conversion, Pillar, User } from '../../../common/apiModels';

export type SecondPillarSuggestion =
  | 'TRANSFER_HIGH_FEE'
  | 'TRANSFER_LOW_FEE'
  | 'PENDING_TRANSFER'
  | 'INCREASE_PAYMENT_RATE'
  | 'MEMBERSHIP'
  | 'RECURRING_PAYMENT'
  | 'NONE';

export function secondPillarSuggestion(
  user: User,
  secondPillarConversion: Conversion,
  pendingApplications: Application[],
): SecondPillarSuggestion {
  if (!user.secondPillarActive || secondPillarConversion.pendingWithdrawal) {
    return 'NONE';
  }
  if (hasPendingSecondPillarTransfer(pendingApplications)) {
    return 'PENDING_TRANSFER';
  }
  const isAtTuleva =
    secondPillarConversion.selectionComplete && secondPillarConversion.transfersComplete;
  if (!isAtTuleva) {
    return secondPillarConversion.weightedAverageFee > 0.003
      ? 'TRANSFER_HIGH_FEE'
      : 'TRANSFER_LOW_FEE';
  }
  const paymentRate =
    user.secondPillarPaymentRates.pending ?? user.secondPillarPaymentRates.current;
  if (paymentRate < 6) {
    return 'INCREASE_PAYMENT_RATE';
  }
  if (user.memberNumber === null) {
    return 'MEMBERSHIP';
  }
  return 'RECURRING_PAYMENT';
}

function hasPendingSecondPillarTransfer(applications: Application[]): boolean {
  return hasPendingTransferFromPillar(applications, 2);
}

export function hasPendingThirdPillarTransfer(applications: Application[]): boolean {
  return hasPendingTransferFromPillar(applications, 3);
}

function hasPendingTransferFromPillar(applications: Application[], pillar: Pillar): boolean {
  return applications.some(
    (application) =>
      application.type === 'TRANSFER' &&
      application.status === 'PENDING' &&
      application.details.sourceFund.pillar === pillar,
  );
}

import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useMandateSigning } from '../../exchange/hooks';
import { createSecondPillarPaymentRateChange } from './api';
import { PaymentRate, SecondPillarPaymentRateChangeMandate } from './types';
import { ErrorResponse } from '../../common/apiModels';

export function useSecondPillarPaymentRate(): {
  changePaymentRate: (paymentRate: PaymentRate) => void;
  cancelSigning: () => void;
  paymentRateChangeMandateId: number | null;
  signedMandateId: number | null;
  loading: boolean;
  challengeCode: string | null;
  error: ErrorResponse | null;
  resetError: () => void;
} {
  const mutation = useSecondPillarPaymentRateChange();
  const signing = useMandateSigning();

  async function changePaymentRate(paymentRate: PaymentRate) {
    const mandate = await mutation.mutateAsync(paymentRate);
    signing.sign({ id: mandate.mandateId, pillar: 2 });
  }

  function cancelSigning() {
    signing.cancel();
  }

  function resetError() {
    signing.resetError();
  }

  return {
    changePaymentRate,
    cancelSigning,
    paymentRateChangeMandateId: mutation.data?.mandateId || null,
    signedMandateId: signing.signedMandateId,
    loading: mutation.isLoading || signing.loading,
    challengeCode: signing.challengeCode,
    error: signing.error,
    resetError,
  };
}

export function useSecondPillarPaymentRateChange(): UseMutationResult<
  SecondPillarPaymentRateChangeMandate,
  unknown,
  PaymentRate
> {
  return useMutation((paymentRate: PaymentRate) =>
    createSecondPillarPaymentRateChange(paymentRate),
  );
}

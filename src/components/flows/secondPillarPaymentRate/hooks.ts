import { useMutation, UseMutationResult } from 'react-query';
import { useTokenOrFail } from '../../common/apiHooks';
import { useMandateSigning } from '../../exchange/hooks';
import { createSecondPillarPaymentRateChange } from './api';
import { PaymentRate, SecondPillarPaymentRateChangeMandate } from './types';

export function useSecondPillarPaymentRate(): {
  changePaymentRate: (paymentRate: PaymentRate) => void;
  cancelSigning: () => void;
  paymentRateChangeMandateId: number | null;
  signedMandateId: number | null;
  loading: boolean;
  challengeCode: string | null;
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

  return {
    changePaymentRate,
    cancelSigning,
    paymentRateChangeMandateId: mutation.data?.mandateId || null,
    signedMandateId: signing.signedMandateId,
    loading: mutation.isLoading || signing.loading,
    challengeCode: signing.challengeCode,
  };
}

export function useSecondPillarPaymentRateChange(): UseMutationResult<
  SecondPillarPaymentRateChangeMandate,
  unknown,
  PaymentRate
> {
  const token = useTokenOrFail();
  return useMutation((paymentRate: PaymentRate) =>
    createSecondPillarPaymentRateChange(paymentRate, token),
  );
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  PersonalDetailsStepState,
  WithdrawalsAmountStepState,
  WithdrawalsContextState,
  WithdrawalStep,
} from './types';
import { useFunds, useSourceFunds, useWithdrawalsEligibility } from '../../common/apiHooks';
import {
  canOnlyWithdrawThirdPillarTaxFree,
  decorateSimulatedEligibilityForUnderRetirementAge,
  getAllFundNavsPresent,
  getFundPensionMonthlyPaymentEstimation,
  getMandatesToCreate,
  getWithdrawalsPath,
} from './utils';

export const WithdrawalsContext = createContext<WithdrawalsContextState>({
  currentStep: null,
  amountStep: {
    singleWithdrawalAmount: null,
    pillarsToWithdrawFrom: 'BOTH',
    fundPensionEnabled: false,
  },
  personalDetails: {
    bankAccountIban: null,
    taxResidencyCode: 'EST',
  },
  pensionHoldings: null,
  mandatesToCreate: null,

  allFundNavsPresent: true,

  mandatesSubmitted: true,
  onMandatesSubmitted: () => {},

  setAmountStep: () => {},
  setPersonalDetails: () => {},

  navigateToNextStep: () => {},
  navigateToPreviousStep: () => {},
});

export const useWithdrawalsContext = () => useContext(WithdrawalsContext);

export const WithdrawalsProvider = ({
  children,
  steps,
}: PropsWithChildren<{ steps: WithdrawalStep[] }>) => {
  const { data: rawSourceFunds } = useSourceFunds();
  const { data: funds } = useFunds();

  // without empty value
  const sourceFunds = rawSourceFunds?.filter((sourceFund) => sourceFund.price > 0);

  const { pathname } = useLocation();
  const history = useHistory();

  const currentStepType =
    steps.find((step) => pathname.includes(step.subPath))?.type ?? 'WITHDRAWAL_SIZE';
  const currentStep = steps.find((step) => step.type === currentStepType)!;

  const [amountStep, setEntireAmountStep] = useState<WithdrawalsAmountStepState>({
    singleWithdrawalAmount: null,
    fundPensionEnabled: false,
    pillarsToWithdrawFrom: 'BOTH',
  });

  const setAmountStep = useCallback(
    (newState: Partial<WithdrawalsAmountStepState>) => {
      setEntireAmountStep((prevState) => ({
        ...prevState,
        ...newState,
      }));
    },
    [amountStep, setEntireAmountStep],
  );

  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsStepState>({
    taxResidencyCode: 'EST',
    bankAccountIban: null,
  });

  const [mandatesSubmitted, setMandatesSubmitted] = useState(false);

  const onMandatesSubmitted = () => {
    setMandatesSubmitted(true);
    history.replace('/');
  };

  const { data: eligibility } = useWithdrawalsEligibility();

  const secondPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 2);
  const thirdPillarSourceFunds = sourceFunds?.filter((fund) => fund.pillar === 3);

  const totalSecondPillar = (secondPillarSourceFunds ?? []).reduce(
    (acc, fund) => acc + fund.price,
    0,
  );
  const totalThirdPillar = (thirdPillarSourceFunds ?? []).reduce(
    (acc, fund) => acc + fund.price,
    0,
  );
  const totalBothPillars = totalSecondPillar + totalThirdPillar;

  const pensionHoldings = {
    totalSecondPillar,
    totalThirdPillar,
    totalBothPillars,
  };

  const allFundNavsPresent = useMemo(
    () =>
      getAllFundNavsPresent(
        funds ?? [],
        secondPillarSourceFunds ?? [],
        thirdPillarSourceFunds ?? [],
      ),
    [funds, secondPillarSourceFunds, thirdPillarSourceFunds],
  );

  useEffect(() => {
    if (eligibility && canOnlyWithdrawThirdPillarTaxFree(eligibility)) {
      setAmountStep({ pillarsToWithdrawFrom: 'THIRD' });
      return;
    }

    if (totalSecondPillar === 0 && totalThirdPillar > 0) {
      setAmountStep({ pillarsToWithdrawFrom: 'THIRD' });
    } else if (totalSecondPillar > 0 && totalThirdPillar === 0) {
      setAmountStep({ pillarsToWithdrawFrom: 'SECOND' });
    } else {
      setAmountStep({ pillarsToWithdrawFrom: 'BOTH' });
    }
  }, [eligibility, totalSecondPillar, totalThirdPillar, totalBothPillars]);

  const navigateToNextStep = () => {
    const nextStepIndex = steps.findIndex((step) => step.type === currentStepType) + 1;

    if (!steps[nextStepIndex]) {
      return;
    }

    history.push(getWithdrawalsPath(steps[nextStepIndex].subPath));
  };

  const navigateToPreviousStep = () => {
    const previousStepIndex = steps.findIndex((step) => step.type === currentStepType) - 1;

    if (!steps[previousStepIndex]) {
      return;
    }

    history.goBack();
  };

  const mandatesToCreate = useMemo(
    () =>
      getMandatesToCreate({
        personalDetails,
        pensionHoldings,
        amountStep,
        eligibility: eligibility ?? null,
        secondPillarSourceFunds: secondPillarSourceFunds ?? null,
        thirdPillarSourceFunds: thirdPillarSourceFunds ?? null,
        funds: funds ?? null,
      }),
    [
      personalDetails,
      pensionHoldings,
      amountStep,
      eligibility,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
      funds,
    ],
  );

  return (
    <WithdrawalsContext.Provider
      value={{
        currentStep,
        amountStep,
        personalDetails,
        pensionHoldings,
        mandatesToCreate,

        allFundNavsPresent,
        mandatesSubmitted,
        onMandatesSubmitted,

        setAmountStep,
        setPersonalDetails,

        navigateToNextStep,
        navigateToPreviousStep,
      }}
    >
      {children}
    </WithdrawalsContext.Provider>
  );
};

export const useFundPensionCalculation = () => {
  const { data } = useWithdrawalsEligibility();
  const { amountStep, pensionHoldings } = useWithdrawalsContext();
  const decoratedEligibility = decorateSimulatedEligibilityForUnderRetirementAge(data);

  if (!decoratedEligibility || !pensionHoldings) {
    return null;
  }

  return getFundPensionMonthlyPaymentEstimation(amountStep, decoratedEligibility, pensionHoldings);
};

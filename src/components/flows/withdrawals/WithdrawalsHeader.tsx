import React, { ReactChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { getYearsToGoUntilEarlyRetirementAge } from './utils';
import { useWithdrawalsContext } from './hooks';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';
import { TranslationKey } from '../../translations';

export const WithdrawalsHeader = () => {
  const { data: eligibility } = useWithdrawalsEligibility();
  const { currentStep } = useWithdrawalsContext();

  if (!eligibility) {
    return null;
  }

  return (
    <div className="my-5">
      <h1 className="mb-4 text-center">
        <FormattedMessage id="withdrawals.heading" />
      </h1>
      {currentStep?.type === 'WITHDRAWAL_SIZE' && (
        <p className="m-0 lead text-center">
          <FormattedMessage
            id={getSubheadingTranslationId(eligibility)}
            values={{
              b: (children: ReactChildren) => <span className="fw-bold">{children}</span>,
              age: eligibility.age,
              yearsToGo: getYearsToGoUntilEarlyRetirementAge(eligibility),
            }}
          />
        </p>
      )}
    </div>
  );
};

const getSubheadingTranslationId = (eligibility: WithdrawalsEligibility): TranslationKey => {
  if (eligibility.hasReachedEarlyRetirementAge) {
    return 'withdrawals.subHeading';
  }

  if (eligibility.canWithdrawThirdPillarWithReducedTax) {
    return 'withdrawals.subHeadingThirdPilllarReducedTax';
  }

  return 'withdrawals.subHeadingUnderEarlyRetirementAge';
};

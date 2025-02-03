import React, { ReactChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { canOnlyWithdrawThirdPillarTaxFree, getYearsToGoUntilEarlyRetirementAge } from './utils';
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
      <h1 className="mb-4 text-center font-weight-semibold">
        <FormattedMessage id="withdrawals.heading" />
      </h1>
      {currentStep?.type === 'WITHDRAWAL_SIZE' && (
        <>
          <p className="m-0 lead text-center">
            <FormattedMessage
              id={getSubheadingTranslationId(eligibility)}
              values={{
                b: (children: ReactChildren) => <span className="text-bold">{children}</span>,
                age: eligibility.age,
                yearsToGo: getYearsToGoUntilEarlyRetirementAge(eligibility),
              }}
            />
          </p>
          {!eligibility.hasReachedEarlyRetirementAge &&
            !eligibility.canWithdrawThirdPillarWithReducedTax && (
              <p className="m-0 mt-3 lead text-center">
                <FormattedMessage id="withdrawals.additionalInfoUnderEarlyRetirementAge" />
              </p>
            )}
        </>
      )}
    </div>
  );
};

const getSubheadingTranslationId = (eligibility: WithdrawalsEligibility): TranslationKey => {
  if (eligibility.hasReachedEarlyRetirementAge) {
    return 'withdrawals.subHeading';
  }

  if (canOnlyWithdrawThirdPillarTaxFree(eligibility)) {
    return 'withdrawals.subHeadingThirdPilllarReducedTax';
  }

  return 'withdrawals.subHeadingUnderEarlyRetirementAge';
};

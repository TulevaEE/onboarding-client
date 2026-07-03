import React, { ReactChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import {
  canOnlyPartiallyWithdrawThirdPillar,
  getYearsToGoUntilEarlyRetirementAge,
  getYearsToGoUntilThirdPillarReducedTax,
  hasEarlierThirdPillarReducedTaxAccess,
} from './utils';
import { useWithdrawalsContext } from './hooks';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';
import { TranslationKey } from '../../translations';

export const WithdrawalsHeader = () => {
  const { data: eligibility } = useWithdrawalsEligibility();
  const { currentStep, pensionHoldings } = useWithdrawalsContext();

  if (!eligibility) {
    return null;
  }

  const hasThirdPillarHoldings = (pensionHoldings?.totalThirdPillar ?? 0) > 0;
  const hasThirdPillarEarlierAccess =
    hasEarlierThirdPillarReducedTaxAccess(eligibility) && hasThirdPillarHoldings;
  const thirdPillarAccessYearsToGo = hasThirdPillarEarlierAccess
    ? getYearsToGoUntilThirdPillarReducedTax(eligibility) ?? 0
    : getYearsToGoUntilEarlyRetirementAge(eligibility);

  return (
    <div className="my-5">
      <h1 className="mb-4 text-center">
        <FormattedMessage id="withdrawals.heading" />
      </h1>
      {currentStep?.type === 'WITHDRAWAL_SIZE' && (
        <>
          <p className="m-0 lead text-center">
            <FormattedMessage
              id={getSubheadingTranslationId(eligibility, hasThirdPillarEarlierAccess)}
              values={{
                b: (children: ReactChildren) => <span className="fw-bold">{children}</span>,
                age: eligibility.age,
                yearsToGo: thirdPillarAccessYearsToGo,
              }}
            />
            {canOnlyPartiallyWithdrawThirdPillar(eligibility) && hasThirdPillarHoldings && (
              <span className="d-block pt-3">
                <FormattedMessage
                  id="withdrawals.additionalInfoOnlyThirdPillar"
                  values={{
                    b: (children: ReactChildren) => <span className="fw-bold">{children}</span>,
                    age: hasThirdPillarEarlierAccess ? 55 : 60,
                  }}
                />{' '}
                {hasThirdPillarEarlierAccess && (
                  <FormattedMessage
                    id="withdrawals.withdrawalAmount.secondPillarAvailableIn"
                    values={{ years: getYearsToGoUntilEarlyRetirementAge(eligibility) }}
                  />
                )}
              </span>
            )}
            {eligibility.hasReachedEarlyRetirementAge &&
              !eligibility.canWithdrawThirdPillarWithReducedTax &&
              !!eligibility.canWithdrawThirdPillarWithReducedTaxFrom &&
              hasThirdPillarHoldings && (
                <span className="d-block pt-3">
                  <FormattedMessage
                    id="withdrawals.additionalInfoThirdPillarFullTax"
                    values={{
                      b: (children: ReactChildren) => <span className="fw-bold">{children}</span>,
                    }}
                  />
                </span>
              )}
          </p>
        </>
      )}
    </div>
  );
};

const getSubheadingTranslationId = (
  eligibility: WithdrawalsEligibility,
  hasThirdPillarEarlierAccess: boolean,
): TranslationKey => {
  if (eligibility.hasReachedEarlyRetirementAge) {
    return 'withdrawals.subHeading';
  }

  if (eligibility.canWithdrawThirdPillarWithReducedTax) {
    return 'withdrawals.subHeadingThirdPilllarReducedTax';
  }

  if (hasThirdPillarEarlierAccess) {
    return 'withdrawals.subHeadingThirdPillarReducedTaxInYears';
  }

  return 'withdrawals.subHeadingUnderEarlyRetirementAge';
};

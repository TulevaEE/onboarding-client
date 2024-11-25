import React, { ReactChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsEligibility } from '../../common/apiHooks';
import { getYearsToGoUntilEarlyRetirementAge } from './utils';

export const WithdrawalsHeader = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  if (!eligibility) {
    return null;
  }

  const { hasReachedEarlyRetirementAge } = eligibility;

  return (
    <div className="pt-3 pb-5">
      <h1 className="mb-4 text-center font-weight-semibold">
        <FormattedMessage id="withdrawals.heading" />
      </h1>
      <div className="lead text-center">
        <FormattedMessage
          id={
            hasReachedEarlyRetirementAge
              ? 'withdrawals.subHeading'
              : 'withdrawals.subHeadingUnderEarlyRetirementAge'
          }
          values={{
            b: (children: ReactChildren) => <span className="text-bold">{children}</span>,
            age: eligibility.age,
            yearsToGo: getYearsToGoUntilEarlyRetirementAge(eligibility),
          }}
        />
      </div>
    </div>
  );
};

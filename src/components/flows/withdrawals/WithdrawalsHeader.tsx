import React, { ReactChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { useWithdrawalsEligibility } from '../../common/apiHooks';

export const WithdrawalsHeader = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  if (!eligibility) {
    return null;
  }

  return (
    <div className="pt-3 pb-5">
      <h1 className="mb-4 text-center font-weight-semibold">
        <FormattedMessage id="withdrawals.heading" />
      </h1>
      <div className="lead text-center">
        <FormattedMessage
          id="withdrawals.subHeading"
          values={{
            b: (children: ReactChildren) => <span className="text-bold">{children}</span>,
            age: eligibility.age,
          }}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useThirdPillarTaxHeadroom } from '../../../common/apiHooks';
import { Amount } from '../../../flows/thirdPillarTaxHeadroom/Amount';
import {
  awaitsExpectedIncome,
  headroomFiguresOf,
} from '../../../flows/thirdPillarTaxHeadroom/headroomFigures';
import ThirdPillarPaymentsAmount from './ThirdPillarContributionAmount';

export const ThirdPillarYearLine = () => {
  const { data: headroom } = useThirdPillarTaxHeadroom();

  if (!headroom || awaitsExpectedIncome(headroom)) {
    return <ThirdPillarPaymentsAmount />;
  }

  const { remaining, limitIsEstimate, hasNoTaxWin } = headroomFiguresOf(headroom);

  return (
    <span className="text-body-secondary">
      {remaining > 0 ? (
        <FormattedMessage
          id={
            limitIsEstimate
              ? 'account.status.thirdPillarTaxHeadroom.remainingEstimate'
              : 'account.status.thirdPillarTaxHeadroom.remaining'
          }
          values={{
            remaining: <Amount amount={remaining} className="fw-bold" />,
          }}
        />
      ) : (
        <FormattedMessage
          id={
            hasNoTaxWin
              ? 'account.status.thirdPillarTaxHeadroom.noTaxWin'
              : 'account.status.thirdPillarTaxHeadroom.usedUp'
          }
        />
      )}
    </span>
  );
};

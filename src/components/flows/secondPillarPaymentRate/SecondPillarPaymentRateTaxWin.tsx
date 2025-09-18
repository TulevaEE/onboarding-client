import { FormattedMessage } from 'react-intl';
import React from 'react';
import { useContributions } from '../../common/apiHooks';
import { Euro } from '../../common/Euro';
import { Contribution, SecondPillarContribution } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';

type SecondPillarPaymentRateTaxWinProps = {
  variant?: 'default' | 'inline';
};

export const SecondPillarPaymentRateTaxWin = ({
  variant = 'default',
}: SecondPillarPaymentRateTaxWinProps = {}) => {
  const { data: contributions } = useContributions();
  if (!contributions) {
    return variant === 'inline' ? null : <Shimmer height={24} />;
  }
  const taxWin = yearToDateTaxWin(contributions);
  return (
    <FormattedMessage
      id={
        variant === 'inline'
          ? 'account.status.choice.pillar.second.tax.benefit.inline'
          : 'account.status.choice.pillar.second.tax.benefit'
      }
      values={{
        estimatedWin: <Euro amount={taxWin} fractionDigits={0} />,
        b: (chunks: string) => <b>{chunks}</b>,
      }}
    />
  );
};

const yearToDateTaxWin = (contributions: Contribution[]) => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const nextYearStart = new Date(currentYear + 1, 0, 1);

  const sumOfSecondPillarPayments = contributions
    .filter((contribution): contribution is SecondPillarContribution => contribution.pillar === 2)
    .filter(({ time }) => {
      const contributionDate = new Date(time);
      return contributionDate >= yearStart && contributionDate < nextYearStart;
    })
    .reduce((total, contribution) => total + contribution.employeeWithheldPortion, 0);

  const incomeTaxRate = 0.22;
  return sumOfSecondPillarPayments * incomeTaxRate;
};

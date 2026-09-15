import { FormattedMessage } from 'react-intl';
import React from 'react';
import { Link } from 'react-router-dom';
import { useContributions } from '../../common/apiHooks';
import { Contribution, SecondPillarContribution } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';

type SecondPillarPaymentRateTaxWinProps = {
  variant?: 'default' | 'inline';
};

export const useSecondPillarTaxWin = (): { taxWin: number | null; loading: boolean } => {
  const { data: contributions } = useContributions();
  if (!contributions || !Array.isArray(contributions)) {
    return { taxWin: null, loading: true };
  }
  const taxWin = yearToDateTaxWin(contributions);
  return { taxWin: taxWin > 0 ? taxWin : null, loading: false };
};

export const SecondPillarPaymentRateTaxWin = ({
  variant = 'default',
}: SecondPillarPaymentRateTaxWinProps = {}) => {
  const { taxWin, loading } = useSecondPillarTaxWin();
  if (loading) {
    return variant === 'inline' ? null : <Shimmer height={24} />;
  }
  if (taxWin === null) {
    return null;
  }
  return (
    <FormattedMessage
      id={
        variant === 'inline'
          ? 'account.status.choice.pillar.second.tax.benefit.inline'
          : 'account.status.choice.pillar.second.tax.benefit'
      }
      values={{
        estimatedWin: `${taxWin.toFixed(0)} €`,
        b: (chunks: string) => <b>{chunks}</b>,
        link: (chunks: string) => <Link to="/2nd-pillar-tax-win">{chunks}</Link>,
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

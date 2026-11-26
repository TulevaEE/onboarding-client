import { FormattedMessage } from 'react-intl';
import React from 'react';
import { Link } from 'react-router-dom';
import { useContributions } from '../../common/apiHooks';
import { Contribution, SecondPillarContribution } from '../../common/apiModels';
import { Shimmer } from '../../common/shimmer/Shimmer';

export const useSecondPillarTaxWin = (): { taxWin: number | null; loading: boolean } => {
  const { data: contributions } = useContributions();
  if (!contributions || !Array.isArray(contributions)) {
    return { taxWin: null, loading: true };
  }
  const taxWin = yearToDateTaxWin(contributions);
  const roundsToWholeEuros = Math.round(taxWin) > 0;
  return { taxWin: roundsToWholeEuros ? taxWin : null, loading: false };
};

type TaxWinPlacement = 'OPENS_THE_SENTENCE' | 'CONTINUES_THE_SENTENCE';

export const TaxWinSentence = ({
  taxWin,
  placement,
}: {
  taxWin: number;
  placement: TaxWinPlacement;
}) => (
  <FormattedMessage
    id={
      placement === 'CONTINUES_THE_SENTENCE'
        ? 'account.status.choice.pillar.second.tax.benefit.inline'
        : 'account.status.choice.pillar.second.tax.benefit'
    }
    values={{
      taxWin: <b className="text-nowrap">{taxWin.toFixed(0)} €</b>,
      link: (chunks: string) => <Link to="/2nd-pillar-tax-win">{chunks}</Link>,
    }}
  />
);

export const SecondPillarPaymentRateTaxWin = () => {
  const { taxWin, loading } = useSecondPillarTaxWin();
  if (loading) {
    return <Shimmer height={24} />;
  }
  if (taxWin === null) {
    return null;
  }
  return <TaxWinSentence taxWin={taxWin} placement="OPENS_THE_SENTENCE" />;
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

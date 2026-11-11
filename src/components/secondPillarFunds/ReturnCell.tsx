import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { formatAmountForCount } from '../common/utils';
import { TranslationKey } from '../translations';
import { FundRow, isNearMarket, ReturnBasis } from './fundRows';
import { strategyChangeBefore } from './fundDetails';
import { minusYears } from './fundReturns';
import { WithTip } from './WithTip';
import styles from './SecondPillarFunds.module.scss';

const TIPS: Record<
  ReturnBasis,
  { nearMarket: TranslationKey; behindMarket: TranslationKey; missing: TranslationKey }
> = {
  fund: {
    nearMarket: 'secondPillarFunds.table.nearMarket.tip',
    behindMarket: 'secondPillarFunds.table.behindMarket.tip',
    missing: 'secondPillarFunds.table.missingReturn.tip',
  },
  personal: {
    nearMarket: 'secondPillarFunds.table.nearMarket.tip.personal',
    behindMarket: 'secondPillarFunds.table.behindMarket.tip.personal',
    missing: 'secondPillarFunds.table.missingReturn.tip.personal',
  },
};

export const formatReturn = (value: number) => formatAmountForCount(value * 100, 1);

export const ReturnCell = ({
  row,
  years,
  benchmark,
  valuationDate,
  unit,
  basis,
}: {
  row: FundRow;
  years: number;
  benchmark: number | undefined;
  valuationDate: string;
  unit: ReactNode;
  basis: ReturnBasis;
}) => {
  const tips = TIPS[basis];
  const value = row.returns[years] ?? null;
  if (value === null) {
    return (
      <WithTip
        className={styles.dash}
        tip={<FormattedMessage id={tips.missing} values={{ years }} />}
      >
        —
      </WithTip>
    );
  }
  const strategyChange = strategyChangeBefore(row.details, minusYears(valuationDate, years));
  const strategyNote = strategyChange && (
    <FormattedMessage id={`secondPillarFunds.strategyChange.${strategyChange.note}`} />
  );
  const nearMarket = benchmark !== undefined && isNearMarket(value, benchmark);
  const text = (
    <>
      {formatReturn(value)}
      {unit}
    </>
  );
  if (benchmark === undefined && !strategyNote) {
    return <span className={styles.value}>{text}</span>;
  }
  return (
    <WithTip
      className={`${styles.value} ${nearMarket ? styles.nearMarket : ''}`}
      tip={
        <>
          {benchmark !== undefined && (
            <FormattedMessage
              id={nearMarket ? tips.nearMarket : tips.behindMarket}
              values={{ years }}
            />
          )}
          {benchmark !== undefined && strategyNote && '.\n\n'}
          {strategyNote}
        </>
      }
    >
      {text}
    </WithTip>
  );
};

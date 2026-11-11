import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { formatAmountForCount } from '../common/utils';
import { FundRow, isNearMarket } from './fundRows';
import { strategyChangeBefore } from './fundDetails';
import { minusYears } from './fundReturns';
import { WithTip } from './WithTip';
import styles from './SecondPillarFunds.module.scss';

const MarketTip = ({ years, nearMarket }: { years: number; nearMarket: boolean }) => (
  <FormattedMessage
    id={
      nearMarket
        ? 'secondPillarFunds.table.nearMarket.tip'
        : 'secondPillarFunds.table.behindMarket.tip'
    }
    values={{ years }}
  />
);

export const formatReturn = (value: number) => formatAmountForCount(value * 100, 1);

export const ReturnCell = ({
  row,
  years,
  benchmark,
  valuationDate,
  unit,
}: {
  row: FundRow;
  years: number;
  benchmark: number | undefined;
  valuationDate: string;
  unit: ReactNode;
}) => {
  const value = row.returns[years] ?? null;
  if (value === null) {
    return (
      <WithTip
        className={styles.dash}
        tip={<FormattedMessage id="secondPillarFunds.table.missingReturn.tip" values={{ years }} />}
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
          {benchmark !== undefined && <MarketTip years={years} nearMarket={nearMarket} />}
          {benchmark !== undefined && strategyNote && '.\n\n'}
          {strategyNote}
        </>
      }
    >
      {text}
    </WithTip>
  );
};

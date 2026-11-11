import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { FundDetails, FundTerm, isLifecycleFund, typeTermOf } from './fundDetails';
import { WithTip } from './WithTip';
import styles from './SecondPillarFunds.module.scss';

const TermTip = ({ isin, term }: { isin: string; term: FundTerm }) =>
  term === 'lifecycleFund' && isLifecycleFund(isin) ? (
    <FormattedMessage id={`secondPillarFunds.lifecycleTip.${isin}`} />
  ) : (
    <FormattedMessage id={`secondPillarFunds.term.${term}.tip`} />
  );

const Term = ({ isin, term }: { isin: string; term: FundTerm }) => (
  <WithTip tip={<TermTip isin={isin} term={term} />} className={styles.term}>
    <FormattedMessage id={`secondPillarFunds.term.${term}`} />
  </WithTip>
);

const TermList = ({ isin, terms }: { isin: string; terms: FundTerm[] }) => (
  <>
    {terms.map((term, index) => (
      <Fragment key={term}>
        {index > 0 && ', '}
        <Term isin={isin} term={term} />
      </Fragment>
    ))}
  </>
);

export const FundSubtitle = ({ isin, details }: { isin: string; details: FundDetails }) => {
  const groups = [
    [typeTermOf(details)],
    details.features,
    details.benchmark ? [details.benchmark] : [],
  ];
  return (
    <div className={styles.fundSubtitle}>
      {groups
        .filter((terms) => terms.length > 0)
        .map((terms, index) => (
          <Fragment key={terms[0]}>
            {index > 0 && ' · '}
            <TermList isin={isin} terms={terms} />
          </Fragment>
        ))}
    </div>
  );
};

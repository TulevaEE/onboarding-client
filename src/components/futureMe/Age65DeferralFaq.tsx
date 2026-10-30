import React from 'react';
import { FormattedMessage } from 'react-intl';
import { deferralLock, deferredMonthly } from './age65Answers';
import { euro } from './amountFormat';
import { HELP_LINKS } from './helpLinks';
import { strong } from './richText';
import { amountOf, YouAnswers } from './youAnswers';

const MONTHS_IN_YEAR = 12;

const richText = {
  p: (chunks: React.ReactNode) => <p>{chunks}</p>,
  ul: (chunks: React.ReactNode) => <ul>{chunks}</ul>,
  li: (chunks: React.ReactNode) => <li>{chunks}</li>,
  strong,
  small: (chunks: React.ReactNode) => <small className="text-secondary">{chunks}</small>,
  link: (chunks: React.ReactNode) => <a href={HELP_LINKS.skaFlexiblePension}>{chunks}</a>,
};

export const Age65DeferralFaq = ({ you }: { you: YouAnswers }) => {
  const pension = amountOf(you.firstPillarMonthly);
  if (deferralLock(you) || pension <= 0) {
    return null;
  }
  const deferred = deferredMonthly(pension, 'defer', 1);
  const extra = deferred - pension;
  const missed = pension * MONTHS_IN_YEAR;

  return (
    <details className="faq-item">
      <summary>
        <FormattedMessage id="futureMe.age65.faq.deferral.q" />
      </summary>
      <div className="faq-body">
        <FormattedMessage
          id="futureMe.age65.faq.deferral.a"
          values={{
            ...richText,
            base: euro(pension),
            deferred: euro(deferred),
            extra: euro(extra),
            half: euro(pension / 2),
            afterHalf: euro(deferredMonthly(pension, 'half', 1)),
            missed: euro(missed),
            paybackYears: Math.round(missed / (extra * MONTHS_IN_YEAR)),
          }}
        />
      </div>
    </details>
  );
};

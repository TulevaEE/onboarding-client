import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { PayoutWarning, payoutWarningOf, SurplusTip, surplusTipOf } from './payoutAdvice';
import { Result, ResultContext } from './resultAnswers';

interface Props {
  context: ResultContext;
  result: Result;
}

const SCENARIO_NAMES: Record<string, TranslationKey> = {
  A: 'futureMe.result.warn.scenario.A',
  B: 'futureMe.result.warn.scenario.B',
  C: 'futureMe.result.warn.scenario.C',
  D: 'futureMe.result.warn.scenario.D',
  E: 'futureMe.result.warn.scenario.E',
};

const emphasis = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

const WarningAdvice = ({ warning }: { warning: PayoutWarning }) => {
  if (warning.kind === 'shorterDeferral') {
    return (
      <FormattedMessage
        id="futureMe.result.warn.shorterDeferral"
        values={{ ...warning, isNow: warning.shorter === 0 ? 'yes' : 'no' }}
      />
    );
  }
  if (warning.kind === 'noPayoutCovers') {
    return (
      <FormattedMessage id="futureMe.result.warn.none" values={{ most: euro(warning.most) }} />
    );
  }
  const { how } = warning;
  return (
    <>
      <FormattedMessage
        id="futureMe.result.warn.better"
        values={{
          name: <FormattedMessage id={SCENARIO_NAMES[warning.scenarioId]} />,
          best: euro(warning.best),
          mine: euro(warning.mine),
          strong: emphasis,
        }}
      />{' '}
      <FormattedMessage
        id="futureMe.result.warn.how"
        values={{ ...how, atPayoutAge: how.atPayoutAge ? 'yes' : 'no' }}
      />
    </>
  );
};

const Warning = ({ warning }: { warning: PayoutWarning }) => (
  <div className="result-advice result-advice-warn" role="status" aria-labelledby="future-me-warn">
    <p>
      <strong id="future-me-warn">
        <FormattedMessage id="futureMe.result.warn.title" />
      </strong>{' '}
      <FormattedMessage id="futureMe.result.warn.until" values={{ until: warning.until }} />
    </p>
    <p>
      <WarningAdvice warning={warning} />
    </p>
  </div>
);

const Surplus = ({ tip }: { tip: SurplusTip }) => (
  <p className="result-advice">
    <FormattedMessage
      id="futureMe.result.surplus"
      values={{
        from: tip.from,
        to: tip.to,
        average: euro(tip.average),
        hasGrow: tip.grow === null ? 'no' : 'yes',
        grow: euro(tip.grow ?? 0),
        mine: euro(tip.mine),
        strong: emphasis,
      }}
    />
  </p>
);

export const ResultAdvice = ({ context, result }: Props) => {
  const warning = payoutWarningOf(context, result);
  const tip = surplusTipOf(context, result);
  return (
    <>
      {warning && <Warning warning={warning} />}
      {tip && <Surplus tip={tip} />}
    </>
  );
};

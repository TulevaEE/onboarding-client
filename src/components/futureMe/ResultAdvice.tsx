import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { useDecisionActions } from './decisionActions';
import { DecisionId } from './decisions';
import { LinkButton } from './LinkButton';
import {
  deferralChanges,
  PayoutWarning,
  payoutWarningOf,
  stepToChoose,
  SurplusTip,
  surplusTipOf,
} from './payoutAdvice';
import { Prices } from './nominal';
import { Result, ResultContext } from './resultAnswers';
import { FutureMeStep } from './steps';

interface Props {
  context: ResultContext;
  result: Result;
  prices: Prices;
  onOpenDecision: (id: DecisionId) => void;
}

interface WarningProps {
  context: ResultContext;
  warning: PayoutWarning;
  prices: Prices;
  onOpenDecision: (id: DecisionId) => void;
}

const SCENARIO_NAMES: Record<string, TranslationKey> = {
  A: 'futureMe.result.warn.scenario.A',
  B: 'futureMe.result.warn.scenario.B',
  C: 'futureMe.result.warn.scenario.C',
  D: 'futureMe.result.warn.scenario.D',
  E: 'futureMe.result.warn.scenario.E',
};

const emphasis = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

const WarningAdvice = ({ context, warning, prices, onOpenDecision }: WarningProps) => {
  const { change, goTo } = useDecisionActions();
  const atStart = (amount: number) => euro(amount * prices.at(prices.ageShown));
  if (warning.kind === 'shorterDeferral') {
    const isNow = warning.shorter === 0 ? 'yes' : 'no';
    const setShorterDeferral = () => {
      change(deferralChanges(context, warning.shorter));
      onOpenDecision('statePension');
    };
    return (
      <>
        <FormattedMessage
          id="futureMe.result.warn.shorterDeferral"
          values={{ ...warning, isNow }}
        />{' '}
        <button type="button" className="btn btn-sm btn-primary" onClick={setShorterDeferral}>
          <FormattedMessage
            id="futureMe.result.warn.setDeferral"
            values={{ isNow, years: warning.shorter }}
          />
        </button>
      </>
    );
  }
  if (warning.kind === 'noPayoutCovers') {
    return (
      <>
        <FormattedMessage id="futureMe.result.warn.none" values={{ most: atStart(warning.most) }} />{' '}
        <LinkButton onClick={() => goTo(FutureMeStep.COSTS)}>
          <FormattedMessage id="futureMe.result.warn.changeCosts" />
        </LinkButton>
      </>
    );
  }
  const { how } = warning;
  const step = stepToChoose(how, context);
  const name = <FormattedMessage id={SCENARIO_NAMES[warning.scenarioId]} />;
  return (
    <>
      <FormattedMessage
        id="futureMe.result.warn.better"
        values={{
          name,
          best: atStart(warning.best),
          mine: atStart(warning.mine),
          strong: emphasis,
        }}
      />{' '}
      <FormattedMessage
        id="futureMe.result.warn.how"
        values={{ ...how, atPayoutAge: how.atPayoutAge ? 'yes' : 'no' }}
      />{' '}
      <button type="button" className="btn btn-sm btn-primary" onClick={() => goTo(step)}>
        <FormattedMessage
          id="futureMe.result.warn.goTo"
          values={{
            kind: how.kind,
            atPayoutAge: step === FutureMeStep.AGE_60 ? 'yes' : 'no',
            payoutAge: how.payoutAge,
          }}
        />
        <span className="visually-hidden">
          <FormattedMessage id="futureMe.result.warn.goTo.choice" values={{ name }} />
        </span>
      </button>
    </>
  );
};

const Warning = ({ context, warning, prices, onOpenDecision }: WarningProps) => (
  <div className="result-advice result-advice-warn" role="status" aria-labelledby="future-me-warn">
    <p>
      <strong id="future-me-warn">
        <FormattedMessage id="futureMe.result.warn.title" />
      </strong>{' '}
      <FormattedMessage id="futureMe.result.warn.until" values={{ until: warning.until }} />
    </p>
    <p>
      <WarningAdvice
        context={context}
        warning={warning}
        prices={prices}
        onOpenDecision={onOpenDecision}
      />
    </p>
  </div>
);

const middleOf = ({ from, to }: SurplusTip) => Math.round((from + to) / 2);

const Surplus = ({
  tip,
  prices,
  onOpenDecision,
}: {
  tip: SurplusTip;
  prices: Prices;
  onOpenDecision: Props['onOpenDecision'];
}) => (
  <p className="result-advice">
    <FormattedMessage
      id="futureMe.result.surplus"
      values={{
        from: tip.from,
        to: tip.to,
        average: euro(tip.average * prices.at(middleOf(tip))),
        hasGrow: tip.grow === null ? 'no' : 'yes',
        grow: euro((tip.grow ?? 0) * prices.at(prices.ageShown)),
        mine: euro(tip.mine * prices.at(prices.ageShown)),
        strong: emphasis,
      }}
    />{' '}
    <LinkButton onClick={() => onOpenDecision(tip.decision)}>
      <FormattedMessage id="futureMe.result.surplus.change" />
      <span className="visually-hidden">
        {' '}
        <FormattedMessage id="futureMe.result.surplus.change.what" />
      </span>
    </LinkButton>
  </p>
);

export const ResultAdvice = ({ context, result, prices, onOpenDecision }: Props) => {
  const warning = payoutWarningOf(context, result);
  const tip = surplusTipOf(context, result);
  return (
    <>
      {warning && (
        <Warning
          context={context}
          warning={warning}
          prices={prices}
          onOpenDecision={onOpenDecision}
        />
      )}
      {tip && <Surplus tip={tip} prices={prices} onOpenDecision={onOpenDecision} />}
    </>
  );
};

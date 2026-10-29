import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';
import { deferralLock } from './age65Answers';
import { euro, exactPercent } from './amountFormat';
import { ChoiceCard } from './ChoiceCard';
import { withOwnCostsRaisedBy } from './expensesAnswers';
import { LineIcon } from './FutureMeIcon';
import { HelpButton } from './HelpButton';
import { keepSecondPillarGrowing, Legacy, legacyOf } from './legacy';
import { Result, ResultContext } from './resultAnswers';
import { useDecisionChanges } from './ResultDecisions';
import { strong } from './richText';
import { FutureMeStep, StepId } from './steps';

interface Props {
  context: ResultContext;
  result: Result;
  onGoTo: (step: StepId) => void;
}

type Surplus = Extract<Legacy, { kind: 'surplus' }>;
type Shortfall = Extract<Legacy, { kind: 'shortfall' }>;

const SURPLUS_CHOICES = [
  { id: 'heirs', emoji: '👨‍👩‍👧' },
  { id: 'donate', emoji: '💝' },
  { id: 'spend', emoji: '🎒' },
  { id: 'care', emoji: '🏡' },
] as const;

type SurplusChoice = (typeof SURPLUS_CHOICES)[number]['id'];

const noteOf = (choice: SurplusChoice | null, legacy: Surplus): TranslationKey => {
  if (choice === null) {
    return 'futureMe.result.legacy.note.none';
  }
  if (choice === 'spend' && legacy.extra === 0) {
    return 'futureMe.result.legacy.note.spendAtLimit';
  }
  return `futureMe.result.legacy.note.${choice}` as TranslationKey;
};

const SurplusNote = ({
  choice,
  legacy,
  onTrySpending,
}: {
  choice: SurplusChoice | null;
  legacy: Surplus;
  onTrySpending: () => void;
}) => (
  <div className="legacy-note" aria-live="polite">
    <FormattedMessage
      id={noteOf(choice, legacy)}
      values={{
        left: euro(legacy.left),
        sustainable: euro(legacy.sustainable),
        costs: euro(legacy.costs),
        extra: euro(legacy.extra),
      }}
    />
    {choice === 'spend' && legacy.extra > 0 && (
      <>
        {' '}
        <button type="button" className="btn btn-link p-0 align-baseline" onClick={onTrySpending}>
          <FormattedMessage
            id="futureMe.result.legacy.trySpend"
            values={{ amount: euro(legacy.sustainable) }}
          />
        </button>
      </>
    )}
  </div>
);

const SurplusCard = ({
  context,
  legacy,
  choice,
  onChoose,
}: {
  context: ResultContext;
  legacy: Surplus;
  choice: SurplusChoice | null;
  onChoose: (choice: SurplusChoice) => void;
}) => {
  const onChange = useDecisionChanges();
  const isSpendingOffered = legacy.extra > 0 || choice === 'spend';
  return (
    <>
      <h3 className="h5">
        <FormattedMessage id="futureMe.result.legacy.surplus.title" />
      </h3>
      <p className="text-pretty">
        <FormattedMessage
          id="futureMe.result.legacy.surplus.intro"
          values={{ age: legacy.medianAge, left: euro(legacy.left), strong }}
        />
        <HelpButton topic="legacyLeft" />
      </p>
      <fieldset>
        <legend className="visually-hidden">
          <FormattedMessage id="futureMe.result.legacy.surplus.legend" />
        </legend>
        <div className="payout-choices legacy-choices">
          {SURPLUS_CHOICES.filter(({ id }) => id !== 'spend' || isSpendingOffered).map(
            ({ id, emoji }) => (
              <ChoiceCard
                key={id}
                idPrefix="future-me-legacy"
                name="future-me-legacy"
                value={id}
                checked={choice === id}
                emoji={emoji}
                title={
                  <FormattedMessage id={`futureMe.result.legacy.choice.${id}` as TranslationKey} />
                }
                onChange={() => onChoose(id)}
              />
            ),
          )}
        </div>
      </fieldset>
      <SurplusNote
        choice={choice}
        legacy={legacy}
        onTrySpending={() =>
          onChange({ expenses: withOwnCostsRaisedBy(context.expenses, legacy.extra) })
        }
      />
    </>
  );
};

const ShortfallCard = ({
  context,
  legacy,
  onGoTo,
}: {
  context: ResultContext;
  legacy: Shortfall;
  onGoTo: (step: StepId) => void;
}) => {
  const onChange = useDecisionChanges();
  const canDeferStatePension = deferralLock(context.you) === null;
  return (
    <>
      <h3 className="h5">
        <FormattedMessage id="futureMe.result.legacy.shortfall.title" />
      </h3>
      {legacy.isSecondPillarLumpSum && (
        <ul className="legacy-tips">
          <li>
            <strong className="legacy-tip-title">
              <FormattedMessage id="futureMe.result.legacy.tip.secondPillar.title" />
            </strong>
            <p className="text-pretty">
              <FormattedMessage
                id="futureMe.result.legacy.tip.secondPillar.body"
                values={{ rate: exactPercent(legacy.secondPillarReturn) }}
              />
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onChange(keepSecondPillarGrowing(context))}
            >
              <LineIcon name="sprout" />{' '}
              <FormattedMessage id="futureMe.result.legacy.tip.secondPillar.action" />
            </button>
          </li>
        </ul>
      )}
      <p className="legacy-hint">
        <FormattedMessage
          id="futureMe.result.legacy.hint"
          values={{ hasTips: legacy.isSecondPillarLumpSum ? 'yes' : 'no' }}
        />
      </p>
      <div className="legacy-actions">
        {canDeferStatePension && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => onGoTo(FutureMeStep.AGE_65)}
          >
            <LineIcon name="landmark" />{' '}
            <FormattedMessage id="futureMe.result.legacy.action.deferral" />
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => onGoTo(FutureMeStep.COSTS)}
        >
          <LineIcon name="cart" /> <FormattedMessage id="futureMe.result.legacy.action.costs" />
        </button>
      </div>
    </>
  );
};

export const ResultLegacy = ({ context, result, onGoTo }: Props) => {
  const [choice, setChoice] = useState<SurplusChoice | null>(null);
  const legacy = legacyOf(context, result);
  return (
    <div className="legacy-card">
      {legacy.kind === 'surplus' ? (
        <SurplusCard context={context} legacy={legacy} choice={choice} onChoose={setChoice} />
      ) : (
        <ShortfallCard context={context} legacy={legacy} onGoTo={onGoTo} />
      )}
    </div>
  );
};

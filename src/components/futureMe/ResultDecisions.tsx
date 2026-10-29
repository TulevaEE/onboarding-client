import React, { useLayoutEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { DEFERRAL_YEARS } from './age65Answers';
import { decimalText, euro } from './amountFormat';
import { PayoutChoice } from './age60Answers';
import { ChoiceCard } from './ChoiceCard';
import { PayoutChoiceText } from './PayoutChoiceText';
import { ChangeDecisions, useDecisionActions } from './decisionActions';
import {
  coversAgeOf,
  Decision,
  DecisionId,
  decisionsOf,
  isStepDecision,
  withDecision,
} from './decisions';
import { CURRENT_YEAR, DEFERRAL_INCREASE, PENSIONER_ALLOWANCE } from './engine/pension';
import { QuickEditStepDecision } from './QuickEditSteps';
import { ResultComparison } from './ResultComparison';
import { MAX_AGE_SHOWN, Result, ResultContext, resultOf } from './resultAnswers';

const MONTHS_IN_YEAR = 12;
const NO_BREAK_SPACE = ' ';

const deferralIncreases = (): string =>
  DEFERRAL_YEARS.map(
    (years) =>
      `+${decimalText(
        DEFERRAL_INCREASE[years] * 100,
      )}%${NO_BREAK_SPACE}(${years}${NO_BREAK_SPACE}a)`,
  ).join(', ');

const choiceTitle = (id: DecisionId, choice: string): TranslationKey => {
  switch (id) {
    case 'statePension':
      return `futureMe.age65.mode.${choice}.title` as TranslationKey;
    case 'secondPillarAtPayoutAge':
    case 'thirdPillarAtPayoutAge':
      return `futureMe.age60.choice.${choice}` as TranslationKey;
    default:
      return `futureMe.age65.payout.${choice}.title` as TranslationKey;
  }
};

const endsSecondPillarContributions = (id: DecisionId, context: ResultContext): boolean =>
  id === 'secondPillarAtPayoutAge' ||
  (id === 'secondPillarAtPensionAge' && context.age65.work === 'yes');

const ChoiceText = ({
  id,
  choice,
  context,
}: {
  id: DecisionId;
  choice: string;
  context: ResultContext;
}) =>
  id === 'statePension' ? null : (
    <>
      <PayoutChoiceText
        choice={choice as PayoutChoice}
        endsSecondPillarContributions={endsSecondPillarContributions(id, context)}
      />
      <br />
    </>
  );

const coversKindOf = (result: Result, coversAge: number) => {
  if (result.gapTemporary) {
    return 'gap';
  }
  return coversAge >= MAX_AGE_SHOWN ? 'life' : 'until';
};

const Outcome = ({
  result,
  currentAge,
  isCurrent,
}: {
  result: Result;
  currentAge: number;
  isCurrent: boolean;
}) => {
  const coversAge = coversAgeOf(result);
  const change = coversAge - currentAge;
  const { coversNeedUntil, gapEnd } = result;
  return (
    <span className="decision-outcome">
      <FormattedMessage
        id="futureMe.result.decisions.covers"
        values={{
          kind: coversKindOf(result, coversAge),
          age: coversAge,
          from: coversNeedUntil,
          to: gapEnd,
          isRange:
            gapEnd !== null && coversNeedUntil !== null && gapEnd > coversNeedUntil ? 'yes' : 'no',
        }}
      />
      {isCurrent && <FormattedMessage id="futureMe.result.decisions.covers.now" />}
      {!isCurrent && change !== 0 && (
        <>
          {' '}
          <span className={change > 0 ? 'decision-delta-up' : 'decision-delta-down'}>
            <FormattedMessage
              id="futureMe.result.decisions.delta"
              values={{ direction: change > 0 ? 'up' : 'down', years: Math.abs(change) }}
            />
            <span className="visually-hidden">
              <FormattedMessage id="futureMe.result.decisions.delta.hint" />
            </span>
          </span>
        </>
      )}
    </span>
  );
};

interface PanelProps {
  context: ResultContext;
  decision: Decision;
  panelId: string;
  titleId: string;
  onChange: ChangeDecisions;
}

const DecisionChoices = ({ context, decision, panelId, titleId, onChange }: PanelProps) => {
  const currentAge = coversAgeOf(resultOf(context));
  return (
    <div
      role="group"
      id={panelId}
      aria-labelledby={titleId}
      className="decision-panel d-print-none"
    >
      <div className="payout-choices">
        {decision.choices.map((choice) => {
          const changes = withDecision(context, decision.id, choice);
          return (
            <ChoiceCard
              key={choice}
              idPrefix={`future-me-decision-${decision.id}`}
              name={`future-me-decision-${decision.id}`}
              value={choice}
              checked={decision.current === choice}
              title={<FormattedMessage id={choiceTitle(decision.id, choice)} />}
              text={
                <>
                  <ChoiceText id={decision.id} choice={choice} context={context} />
                  <Outcome
                    result={resultOf({ ...context, ...changes })}
                    currentAge={currentAge}
                    isCurrent={decision.current === choice}
                  />
                </>
              }
              onChange={() => onChange(changes)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface RowProps extends Omit<PanelProps, 'panelId' | 'titleId'> {
  isOpen: boolean;
  focusRequests: number;
  onToggle: () => void;
}

const DecisionRow = ({
  context,
  decision,
  isOpen,
  focusRequests,
  onToggle,
  onChange,
}: RowProps) => {
  const intl = useIntl();
  const titleId = `future-me-decision-${decision.id}-title`;
  const panelId = `future-me-decision-${decision.id}-panel`;
  const { current, id } = decision;
  const currentText = isStepDecision(id)
    ? intl.formatMessage({ id: `futureMe.result.decisions.current.${id}` }, decision.summary)
    : intl.formatMessage({ id: choiceTitle(id, current) });
  const increases = deferralIncreases();
  const toggleRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (isOpen) {
      toggleRef.current?.focus();
    }
  }, [isOpen, focusRequests]);
  return (
    <li>
      <div className="decision-row">
        <div className="decision-age">
          <FormattedMessage id="futureMe.result.decisions.age" values={{ age: decision.age }} />
          <small>
            <FormattedMessage
              id="futureMe.result.decisions.year"
              values={{ year: decision.year, isOpened: decision.year < CURRENT_YEAR }}
            />
          </small>
        </div>
        <div className="decision-main">
          <h4 id={titleId} className="h6">
            <FormattedMessage
              id={`futureMe.result.decisions.name.${id}` as TranslationKey}
              values={{ age: decision.age }}
            />
          </h4>
          <small className="decision-current">
            <FormattedMessage
              id="futureMe.result.decisions.current"
              values={{ choice: currentText }}
            />
          </small>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="btn btn-link btn-sm"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <FormattedMessage
            id={isOpen ? 'futureMe.result.decisions.close' : 'futureMe.result.decisions.change'}
          />
          <span className="visually-hidden">
            {' '}
            <FormattedMessage
              id={`futureMe.result.decisions.name.${id}` as TranslationKey}
              values={{ age: decision.age }}
            />
          </span>
        </button>
        {!isStepDecision(id) && (
          <p className="decision-rule text-pretty">
            <FormattedMessage
              id={`futureMe.result.decisions.rule.${id}` as TranslationKey}
              values={{ increases, allowance: euro(PENSIONER_ALLOWANCE / MONTHS_IN_YEAR) }}
            />
          </p>
        )}
      </div>
      {isOpen && !isStepDecision(id) && (
        <DecisionChoices
          context={context}
          decision={decision}
          panelId={panelId}
          titleId={titleId}
          onChange={onChange}
        />
      )}
      {isOpen && isStepDecision(id) && (
        <div
          role="group"
          id={panelId}
          aria-labelledby={titleId}
          className="decision-panel d-print-none"
        >
          <QuickEditStepDecision id={id} context={context} />
        </div>
      )}
    </li>
  );
};

interface Props {
  context: ResultContext;
  openId: DecisionId | null;
  onOpen: (id: DecisionId | null) => void;
  focusRequests: number;
}

const DecisionList = ({ context, openId, onOpen, focusRequests }: Props) => {
  const intl = useIntl();
  const { change: onChange } = useDecisionActions();
  return (
    <>
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.result.decisions.title" />
      </h3>
      <p className="text-pretty">
        <FormattedMessage id="futureMe.result.decisions.intro" />
      </p>
      <ul
        className="decision-list"
        aria-label={intl.formatMessage({ id: 'futureMe.result.decisions.title' })}
      >
        {decisionsOf(context).map((decision) => (
          <DecisionRow
            key={decision.id}
            context={context}
            decision={decision}
            isOpen={openId === decision.id}
            focusRequests={focusRequests}
            onToggle={() => onOpen(openId === decision.id ? null : decision.id)}
            onChange={onChange}
          />
        ))}
      </ul>
    </>
  );
};

export const ResultDecisions = ({ context, openId, onOpen, focusRequests }: Props) => (
  <>
    <DecisionList context={context} openId={openId} onOpen={onOpen} focusRequests={focusRequests} />
    <ResultComparison context={context} />
  </>
);

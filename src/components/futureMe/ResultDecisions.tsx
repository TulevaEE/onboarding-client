import React, { useLayoutEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { Age65Answers, DEFERRAL_YEARS, PensionMode } from './age65Answers';
import { decimalText } from './amountFormat';
import { PayoutChoice } from './age60Answers';
import { ChoiceCard } from './ChoiceCard';
import { PayoutChoiceText } from './PayoutChoiceText';
import { ChangeDecisions, useDecisionActions } from './decisionActions';
import { Decision, DecisionId, decisionsOf, isStepDecision, withDecision } from './decisions';
import { CURRENT_YEAR, DEFERRAL_INCREASE } from './engine/pension';
import { QuickEditStepDecision } from './QuickEditSteps';
import { ResultComparison } from './ResultComparison';
import { ResultContext } from './resultAnswers';

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

const isChosenDeferral = (decision: Decision, choice: string): boolean =>
  decision.id === 'statePension' && decision.current === choice && choice !== 'full';

const statePensionText = (mode: string, pensionAge: number, years: number) => {
  if (mode === 'half') {
    return <FormattedMessage id="futureMe.result.decisions.mode.half.text" />;
  }
  if (mode === 'defer') {
    return (
      <FormattedMessage
        id="futureMe.result.decisions.mode.defer.text"
        values={{
          age: pensionAge + years,
          percent: decimalText(DEFERRAL_INCREASE[years] * 100),
        }}
      />
    );
  }
  return null;
};

const choiceText = (decision: Decision, choice: string, context: ResultContext) =>
  decision.id === 'statePension' ? (
    statePensionText(choice, decision.age, context.age65.years)
  ) : (
    <PayoutChoiceText
      choice={choice as PayoutChoice}
      endsSecondPillarContributions={decision.id === 'secondPillarAtPayoutAge'}
    />
  );

const DeferralYearsField = ({
  mode,
  pensionAge,
  answers,
  onChange,
}: {
  mode: PensionMode;
  pensionAge: number;
  answers: Age65Answers;
  onChange: ChangeDecisions;
}) => {
  const intl = useIntl();
  const id = 'future-me-decision-deferral-years';
  return (
    <>
      <label className="form-label small fw-medium mb-0" htmlFor={id}>
        <FormattedMessage id="futureMe.age65.years.legend" values={{ mode }} />
      </label>
      <select
        id={id}
        className="form-select form-select-sm"
        value={answers.years}
        onChange={(event) => onChange({ age65: { ...answers, years: Number(event.target.value) } })}
      >
        {DEFERRAL_YEARS.map((years) => (
          <option key={years} value={years}>
            {intl.formatMessage(
              { id: 'futureMe.age65.years.title' },
              { mode, years, age: pensionAge + years },
            )}
          </option>
        ))}
      </select>
    </>
  );
};

interface PanelProps {
  context: ResultContext;
  decision: Decision;
  panelId: string;
  titleId: string;
  onChange: ChangeDecisions;
}

const DecisionChoices = ({ context, decision, panelId, titleId, onChange }: PanelProps) => (
  <div role="group" id={panelId} aria-labelledby={titleId} className="decision-panel d-print-none">
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
            text={choiceText(decision, choice, context)}
            extra={
              isChosenDeferral(decision, choice) && (
                <DeferralYearsField
                  mode={choice as PensionMode}
                  pensionAge={decision.age}
                  answers={context.age65}
                  onChange={onChange}
                />
              )
            }
            onChange={() => onChange(changes)}
          />
        );
      })}
    </div>
  </div>
);

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

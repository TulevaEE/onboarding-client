import React, { createContext, useContext, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { DEFERRAL_YEARS } from './age65Answers';
import { decimalText, euro } from './amountFormat';
import { ChoiceCard } from './ChoiceCard';
import {
  coversAgeOf,
  Decision,
  DecisionChanges,
  DecisionId,
  decisionsOf,
  withDecision,
} from './decisions';
import { CURRENT_YEAR, DEFERRAL_INCREASE, PENSIONER_ALLOWANCE } from './engine/pension';
import { ResultComparison } from './ResultComparison';
import { MAX_AGE_SHOWN, ResultContext, resultOf } from './resultAnswers';

type ChangeDecisions = (changes: DecisionChanges) => void;

const DecisionChangesContext = createContext<ChangeDecisions | null>(null);

export const DecisionChangesProvider = DecisionChangesContext.Provider;

const MONTHS_IN_YEAR = 12;
const NO_BREAK_SPACE = ' ';

const deferralIncreases = (): string =>
  DEFERRAL_YEARS.map(
    (years) =>
      `+${decimalText(
        DEFERRAL_INCREASE[years] * 100,
      )}%${NO_BREAK_SPACE}(${years}${NO_BREAK_SPACE}a)`,
  ).join(', ');

const choiceKeys = (
  id: DecisionId,
  choice: string,
): { title: TranslationKey; text?: TranslationKey } => {
  switch (id) {
    case 'statePension':
      return { title: `futureMe.age65.mode.${choice}.title` as TranslationKey };
    case 'secondPillarAtPayoutAge':
    case 'thirdPillarAtPayoutAge': {
      const pillar = id === 'secondPillarAtPayoutAge' ? 'secondPillar' : 'thirdPillar';
      return {
        title: `futureMe.age60.choice.${choice}` as TranslationKey,
        text: `futureMe.age60.${pillar}.${choice}` as TranslationKey,
      };
    }
    default:
      return {
        title: `futureMe.age65.payout.${choice}.title` as TranslationKey,
        text: `futureMe.age65.payout.${choice}.text` as TranslationKey,
      };
  }
};

const Outcome = ({
  coversAge,
  currentAge,
  isCurrent,
}: {
  coversAge: number;
  currentAge: number;
  isCurrent: boolean;
}) => {
  const change = coversAge - currentAge;
  return (
    <span className="decision-outcome">
      <FormattedMessage
        id="futureMe.result.decisions.covers"
        values={{ isForLife: coversAge >= MAX_AGE_SHOWN, age: coversAge }}
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
    <div role="group" id={panelId} aria-labelledby={titleId} className="decision-panel">
      <div className="payout-choices">
        {decision.choices.map((choice) => {
          const keys = choiceKeys(decision.id, choice);
          const changes = withDecision(context, decision.id, choice);
          return (
            <ChoiceCard
              key={choice}
              idPrefix={`future-me-decision-${decision.id}`}
              name={`future-me-decision-${decision.id}`}
              value={choice}
              checked={decision.current === choice}
              title={<FormattedMessage id={keys.title} />}
              text={
                <>
                  {keys.text && (
                    <>
                      <FormattedMessage id={keys.text} />
                      <br />
                    </>
                  )}
                  <Outcome
                    coversAge={coversAgeOf(resultOf({ ...context, ...changes }))}
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
  onToggle: () => void;
}

const DecisionRow = ({ context, decision, isOpen, onToggle, onChange }: RowProps) => {
  const intl = useIntl();
  const titleId = `future-me-decision-${decision.id}-title`;
  const panelId = `future-me-decision-${decision.id}-panel`;
  const { current, id } = decision;
  const currentTitle = choiceKeys(id, current).title;
  const increases = deferralIncreases();
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
              values={{ choice: intl.formatMessage({ id: currentTitle }) }}
            />
          </small>
        </div>
        <button
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
        <p className="decision-rule text-pretty">
          <FormattedMessage
            id={`futureMe.result.decisions.rule.${id}` as TranslationKey}
            values={{ increases, allowance: euro(PENSIONER_ALLOWANCE / MONTHS_IN_YEAR) }}
          />
        </p>
      </div>
      {isOpen && (
        <DecisionChoices
          context={context}
          decision={decision}
          panelId={panelId}
          titleId={titleId}
          onChange={onChange}
        />
      )}
    </li>
  );
};

const DecisionList = ({ context }: { context: ResultContext }) => {
  const intl = useIntl();
  const onChange = useContext(DecisionChangesContext);
  const [openId, setOpenId] = useState<DecisionId | null>(null);
  if (!onChange) {
    throw new Error('ResultDecisions needs DecisionChangesProvider');
  }
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
            onToggle={() => setOpenId(openId === decision.id ? null : decision.id)}
            onChange={onChange}
          />
        ))}
      </ul>
    </>
  );
};

export const ResultDecisions = ({ context }: { context: ResultContext }) => (
  <>
    <DecisionList context={context} />
    <ResultComparison context={context} />
  </>
);

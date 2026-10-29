import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { Assumption, assumptionsOf, FundAssumptionId } from './assumptions';
import { euro } from './amountFormat';
import { useDecisionActions } from './decisionActions';
import { EmojiIcon, StepIcon } from './FutureMeIcon';
import { QuickEditExpenses } from './QuickEditSteps';
import { ResultContext } from './resultAnswers';
import { FutureMeStep } from './steps';
import { FUND_RETURNS, FundKey } from './youAnswers';

const PERCENT = 100;
const FUND_KEYS = Object.keys(FUND_RETURNS) as FundKey[];
const FUND_FIELDS = {
  secondPillarFund: 'secondPillarFund',
  thirdPillarFund: 'thirdPillarFund',
} as const;

const AssumptionIcon = ({ assumption }: { assumption: Assumption }) => {
  if (assumption.id === 'you') {
    return <StepIcon step={FutureMeStep.YOU} />;
  }
  return assumption.id === 'expenses' ? (
    <StepIcon step={FutureMeStep.COSTS} />
  ) : (
    <EmojiIcon emoji="🌱" />
  );
};

const AssumptionText = ({ assumption }: { assumption: Assumption }) => {
  const intl = useIntl();
  if (assumption.id === 'you') {
    return (
      <FormattedMessage
        id="futureMe.result.assumptions.you.text"
        values={{
          birthYear: assumption.birthYear,
          hasSecondPillar: assumption.secondPillar === null ? 'no' : 'yes',
          secondPillar: euro(assumption.secondPillar ?? 0),
          hasThirdPillar: assumption.thirdPillar === null ? 'no' : 'yes',
          thirdPillar: euro(assumption.thirdPillar ?? 0),
          hasSpecialPension: assumption.specialPension === null ? 'no' : 'yes',
          specialPension: euro(assumption.specialPension ?? 0),
        }}
      />
    );
  }
  if (assumption.id === 'expenses') {
    return (
      <FormattedMessage
        id="futureMe.result.assumptions.expenses.text"
        values={{
          level: intl.formatMessage({
            id: `futureMe.expenses.level.${assumption.level}.name` as TranslationKey,
          }),
          isEdited: assumption.isEdited ? 'yes' : 'no',
          amount: euro(assumption.amount),
        }}
      />
    );
  }
  return (
    <FormattedMessage
      id={`futureMe.result.assumptions.fund.${assumption.fund}` as TranslationKey}
      values={{ percent: Math.round(assumption.realReturn * PERCENT) }}
    />
  );
};

type EditableId = FundAssumptionId | 'expenses';

const FundChoices = ({
  id,
  titleId,
  context,
}: {
  id: FundAssumptionId;
  titleId: string;
  context: ResultContext;
}) => {
  const { change } = useDecisionActions();
  const field = FUND_FIELDS[id];
  return (
    <div role="group" aria-labelledby={titleId} className="decision-panel">
      {FUND_KEYS.map((fund) => (
        <div className="form-check" key={fund}>
          <input
            id={`future-me-assumption-${id}-${fund}`}
            className="form-check-input"
            type="radio"
            name={`future-me-assumption-${id}`}
            checked={context.you[field] === fund}
            onChange={() => change({ you: { ...context.you, [field]: fund } })}
          />
          <label className="form-check-label" htmlFor={`future-me-assumption-${id}-${fund}`}>
            <FormattedMessage
              id={`futureMe.you.fund.${fund}` as TranslationKey}
              values={{ percent: Math.round(FUND_RETURNS[fund] * PERCENT) }}
            />
          </label>
        </div>
      ))}
    </div>
  );
};

const EditButton = ({ assumption, isOpen, onToggle }: EditButtonProps) => {
  const { goTo } = useDecisionActions();
  if (assumption.id === 'you') {
    return (
      <button type="button" className="btn btn-link btn-sm" onClick={() => goTo(FutureMeStep.YOU)}>
        <FormattedMessage id="futureMe.result.assumptions.you.change" />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-link btn-sm"
      aria-expanded={isOpen}
      aria-controls={`future-me-assumption-${assumption.id}-panel`}
      onClick={onToggle}
    >
      <FormattedMessage
        id={isOpen ? 'futureMe.result.decisions.close' : 'futureMe.result.decisions.change'}
      />
      <span className="visually-hidden">
        {' '}
        <FormattedMessage
          id={`futureMe.result.assumptions.what.${assumption.id}` as TranslationKey}
        />
      </span>
    </button>
  );
};

interface EditButtonProps {
  assumption: Assumption;
  isOpen: boolean;
  onToggle: () => void;
}

const EditPanel = ({ id, context }: { id: EditableId; context: ResultContext }) => (
  <div id={`future-me-assumption-${id}-panel`} className="d-print-none">
    {id === 'expenses' ? (
      <QuickEditExpenses context={context} />
    ) : (
      <FundChoices id={id} titleId={`future-me-assumption-${id}-title`} context={context} />
    )}
  </div>
);

export const ResultAssumptions = ({ context }: { context: ResultContext }) => {
  const intl = useIntl();
  const [openId, setOpenId] = useState<EditableId | null>(null);
  return (
    <>
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.result.assumptions.title" />
      </h3>
      <p className="text-pretty">
        <FormattedMessage id="futureMe.result.assumptions.intro" />
      </p>
      <ul
        className="assumption-list"
        aria-label={intl.formatMessage({ id: 'futureMe.result.assumptions.title' })}
      >
        {assumptionsOf(context).map((assumption) => {
          const { id } = assumption;
          const editableId = id === 'you' ? null : id;
          const isOpen = editableId !== null && openId === editableId;
          return (
            <li key={id}>
              <div className="assumption-row">
                <span className="assumption-icon">
                  <AssumptionIcon assumption={assumption} />
                </span>
                <div>
                  <h4 className="h6" id={`future-me-assumption-${id}-title`}>
                    <FormattedMessage
                      id={`futureMe.result.assumptions.${id}.title` as TranslationKey}
                    />
                  </h4>
                  <p className="text-pretty">
                    <AssumptionText assumption={assumption} />
                  </p>
                </div>
                <EditButton
                  assumption={assumption}
                  isOpen={isOpen}
                  onToggle={() => setOpenId(isOpen ? null : editableId)}
                />
              </div>
              {isOpen && editableId && <EditPanel id={editableId} context={context} />}
            </li>
          );
        })}
      </ul>
    </>
  );
};

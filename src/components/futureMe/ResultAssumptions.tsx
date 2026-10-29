import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { Assumption, assumptionsOf, FundAssumptionId } from './assumptions';
import { euro, signedNumber } from './amountFormat';
import { useDecisionActions } from './decisionActions';
import { EmojiIcon, StepIcon } from './FutureMeIcon';
import { QuickEditExpenses } from './QuickEditSteps';
import { ResultContext } from './resultAnswers';
import { FutureMeStep } from './steps';
import { returnOptions } from './YouFields';

const RETURN_FIELDS = {
  secondPillarFund: 'secondPillarReturnPercent',
  thirdPillarFund: 'thirdPillarReturnPercent',
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
      id="futureMe.you.returnRate.value"
      values={{ percent: signedNumber(assumption.returnPercent) }}
    />
  );
};

type EditableId = FundAssumptionId | 'expenses';

const ReturnChoice = ({
  id,
  titleId,
  context,
}: {
  id: FundAssumptionId;
  titleId: string;
  context: ResultContext;
}) => {
  const intl = useIntl();
  const { change } = useDecisionActions();
  const field = RETURN_FIELDS[id];
  return (
    <div className="decision-panel">
      <select
        className="form-select"
        aria-labelledby={titleId}
        value={String(context.you[field])}
        onChange={(event) =>
          change({ you: { ...context.you, [field]: Number(event.target.value) } })
        }
      >
        {returnOptions(intl).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
      <ReturnChoice id={id} titleId={`future-me-assumption-${id}-title`} context={context} />
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

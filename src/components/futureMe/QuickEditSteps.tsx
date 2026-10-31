import React from 'react';
import { Age66Step } from './Age66Step';
import { useDecisionActions } from './decisionActions';
import { StepDecisionId } from './decisions';
import { ExpensesStep } from './ExpensesStep';
import { ResultContext } from './resultAnswers';
import { SpecialPensionStep } from './SpecialPensionStep';
import { FutureMeStep } from './steps';

interface Props {
  context: ResultContext;
}

export const QuickEditExpenses = ({ context }: Props) => {
  const { change } = useDecisionActions();
  return (
    <ExpensesStep
      isEmbedded
      answers={context.expenses}
      onChange={(expenses) => change({ expenses })}
    />
  );
};

const QuickEditSpecialPension = ({ context }: Props) => {
  const { change, goTo } = useDecisionActions();
  const { you, plan, age65, age66, specialPension } = context;
  return (
    <SpecialPensionStep
      isEmbedded
      answers={specialPension}
      you={you}
      plan={plan}
      age65={age65}
      age66={age66}
      onChange={(changed) => change({ specialPension: changed })}
      onAge65Change={(changed) => change({ age65: changed })}
      onEditYou={() => goTo(FutureMeStep.YOU)}
    />
  );
};

const QuickEditFundPension = ({ context }: Props) => {
  const { change, goTo } = useDecisionActions();
  const { you, plan, age60, age65, age66, specialPension } = context;
  return (
    <Age66Step
      isEmbedded
      answers={age66}
      you={you}
      plan={plan}
      age60={age60}
      age65={age65}
      specialPension={specialPension}
      onChange={(changed) => change({ age66: changed })}
      onEditYou={() => goTo(FutureMeStep.YOU)}
      onEditAge60={() => goTo(FutureMeStep.AGE_60)}
      onEditAge65={() => goTo(FutureMeStep.AGE_65)}
      onEditStep={goTo}
    />
  );
};

export const QuickEditStepDecision = ({ id, context }: Props & { id: StepDecisionId }) =>
  id === 'specialPension' ? (
    <QuickEditSpecialPension context={context} />
  ) : (
    <QuickEditFundPension context={context} />
  );

import { createContext, useContext } from 'react';
import { DecisionChanges } from './decisions';
import { StepId } from './steps';

export type ChangeDecisions = (changes: DecisionChanges) => void;

interface DecisionActions {
  change: ChangeDecisions;
  goTo: (step: StepId) => void;
}

const DecisionActionsContext = createContext<DecisionActions | null>(null);

export const DecisionActionsProvider = DecisionActionsContext.Provider;

export const useDecisionActions = (): DecisionActions => {
  const actions = useContext(DecisionActionsContext);
  if (!actions) {
    throw new Error('Result step needs DecisionActionsProvider');
  }
  return actions;
};

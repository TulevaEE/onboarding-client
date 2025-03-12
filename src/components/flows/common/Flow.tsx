import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

import StepTitle from './StepTitle';

import './Flow.scss';
import { State } from '../../../types';

export interface FlowStep {
  path: string;
  Component: () => React.ReactNode;
  title?: React.ReactNode;
}

export interface Props {
  steps: FlowStep[];
  flowPath: string;
  lastPartOfPath: string;
}

export const Flow: React.FC<Props> = ({ steps, flowPath, lastPartOfPath }) => {
  const stepPaths = steps.map((step) => step.path);
  const isStepPath = stepPaths.indexOf(lastPartOfPath) !== -1;
  const stepIndex = isStepPath ? stepPaths.indexOf(lastPartOfPath) : 0;
  const beforeSteps = steps.slice(0, stepIndex);
  const currentStep = steps[stepIndex];
  const afterSteps = steps.slice(stepIndex + 1);
  const currentStepPath = currentStep.path;
  const currentStepTitle = currentStep.title;
  const StepComponent = currentStep.Component;
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="row">
      <div className="col">
        <div className="tv-steps mt-4">
          <>
            {beforeSteps.map(({ path, title }, index) => (
              <StepTitle key={path} number={index + 1} completed>
                {title}
              </StepTitle>
            ))}
            {currentStepTitle && (
              <StepTitle number={stepIndex + 1} active>
                {currentStepTitle}
              </StepTitle>
            )}
          </>

          <div className="pb-5">
            <Switch>
              <Route path={`${flowPath}/${currentStepPath}`} render={StepComponent} />
              <Redirect exact path={`${flowPath}`} to={`${flowPath}/${currentStepPath}`} />
            </Switch>
          </div>
          {!isLastStep && <hr className="mb-4" />}
          {afterSteps.map(
            ({ path, title }, index) =>
              title && (
                <StepTitle key={path} number={index + 1 + stepIndex + 1}>
                  {title}
                </StepTitle>
              ),
          )}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State) => ({
  lastPartOfPath: state.router.location.pathname.split('/').pop() || '',
});

export default connect(mapStateToProps)(Flow);

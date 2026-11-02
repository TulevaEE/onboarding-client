import React, { Fragment } from 'react';
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
  const currentStepPath = steps[stepIndex].path;
  const StepComponent = steps[stepIndex].Component;
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="row">
      <div className="col">
        <div className="tv-steps mt-4">
          {steps.map(({ path, title }, index) => (
            <Fragment key={path}>
              {(title || index < stepIndex) && (
                <StepTitle
                  number={index + 1}
                  active={index === stepIndex}
                  completed={index < stepIndex}
                >
                  {title}
                </StepTitle>
              )}
              {index === stepIndex && (
                <>
                  <div className="pb-5">
                    <Switch>
                      <Route path={`${flowPath}/${currentStepPath}`} render={StepComponent} />
                      <Redirect exact path={`${flowPath}`} to={`${flowPath}/${currentStepPath}`} />
                    </Switch>
                  </div>
                  {!isLastStep && <hr className="mb-4" />}
                </>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State) => ({
  lastPartOfPath: state.router.location.pathname.split('/').pop() || '',
});

export default connect(mapStateToProps)(Flow);

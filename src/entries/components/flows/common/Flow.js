import React, { Component } from 'react';
import Types from 'prop-types';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import mixpanel from 'mixpanel-browser';

import StepTitle from './StepTitle';

import './Flow.scss';

export class Flow extends Component {
  componentDidMount() {
    const { name } = this.props;

    window.useHackySecondPillarRoutePushesInActions = name === 'SECOND_PILLAR';
  }

  render() {
    const { name, steps, flowPath, lastPartOfPath, introMessage } = this.props;

    const stepPaths = steps.map(step => step.path);
    const isStepPath = stepPaths.indexOf(lastPartOfPath) !== -1;
    const stepIndex = isStepPath ? stepPaths.indexOf(lastPartOfPath) : 0;
    const beforeSteps = steps.slice(0, stepIndex);
    const currentStep = steps[stepIndex];
    const afterSteps = steps.slice(stepIndex + 1);
    const currentStepPath = currentStep.path;
    const currentStepTitle = currentStep.title;
    const StepComponent = currentStep.Component;
    const isLastStep = stepIndex === steps.length - 1;

    mixpanel.track(`${name}_${currentStepPath}`);

    return (
      <div className="row">
        <div className="col px-0">
          {stepIndex === 0 && introMessage && (
            <div className="px-col mt-5">
              <p className="lead">{introMessage}</p>
            </div>
          )}
          <div className="tv-steps mt-5">
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

            <div className="pb-5 px-col">
              <Switch>
                <Route path={`${flowPath}/${currentStepPath}`} component={StepComponent} />
                <Redirect path={`${flowPath}`} to={`${flowPath}/${currentStepPath}`} />
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
  }
}

Flow.propTypes = {
  name: Types.string,
  flowPath: Types.string,
  introMessage: Types.node,
  steps: Types.arrayOf(
    Types.shape({
      path: Types.string,
      Component: Types.func,
      title: Types.node,
    }),
  ),

  lastPartOfPath: Types.string,
};

Flow.defaultProps = {
  name: '',
  flowPath: '',
  introMessage: '',
  steps: [],

  lastPartOfPath: null,
};

const mapStateToProps = state => ({
  lastPartOfPath: state.router.location.pathname.split('/').pop(),
});

export default connect(mapStateToProps)(Flow);

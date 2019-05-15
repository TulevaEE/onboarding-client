import React, { Fragment } from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import mixpanel from 'mixpanel-browser';

import './Steps.scss';

import StepTitle from './stepTitle';

const orderedStepNames = ['select-sources', 'transfer-future-capital', 'confirm-mandate'];

// this component wraps all steps and renders the top and bottom areas.
export const Steps = ({ children, stepName, shortFlow }) => {
  const stepIndex = orderedStepNames.indexOf(stepName);
  const beforeSteps = orderedStepNames.slice(0, stepIndex);
  const currentStep = orderedStepNames[stepIndex];
  const afterSteps = orderedStepNames.slice(stepIndex + 1);

  mixpanel.track(`ONBOARDING_STEP_${currentStep}`);

  return (
    <div className="row">
      <div className="col px-0">
        {// show welcome when in first step
        stepIndex === 0 && (
          <div className="px-col mt-5">
            <p className="lead">
              <Message>steps.intro</Message>
            </p>
          </div>
        )}
        <div className="tv-steps mt-5">
          {shortFlow ? (
            <StepTitle active>
              <Message>{`steps.${currentStep}`}</Message>
            </StepTitle>
          ) : (
            <Fragment>
              {beforeSteps.map((beforeStep, index) => (
                <StepTitle key={beforeStep} number={index + 1} completed>
                  <Message>{`steps.${beforeStep}`}</Message>
                </StepTitle>
              ))}
              <StepTitle number={stepIndex + 1} active>
                <Message>{`steps.${currentStep}`}</Message>
              </StepTitle>
            </Fragment>
          )}
          <div className="pb-5 px-col">{children}</div>
          {stepIndex !== orderedStepNames.length - 1 && <hr className="mb-4" />}
          {afterSteps.map((afterStep, index) => (
            <StepTitle key={afterStep} number={index + 1 + stepIndex + 1}>
              <Message>{`steps.${afterStep}`}</Message>
            </StepTitle>
          ))}
        </div>
      </div>
    </div>
  );
};

Steps.defaultProps = {
  children: null,
  stepName: null,
  shortFlow: true,
};

Steps.propTypes = {
  stepName: Types.string,
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
  shortFlow: Types.bool,
};

const mapStateToProps = state => ({
  stepName: state.routing.locationBeforeTransitions.pathname.split('/').pop(),
  shortFlow: state.exchange.shortFlow,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Steps);

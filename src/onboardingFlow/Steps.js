import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import mixpanel from 'mixpanel-browser';
import { refreshToken } from '../login/actions';


import './Steps.scss';

import StepTitle from './stepTitle';

const orderedStepNames = [
  'select-sources',
  'transfer-future-capital',
  'confirm-mandate',
];

// this component wraps all steps and renders the top and bottom areas.
export const Steps = ({ children, stepName, userFirstName, isNewMember, onNewMember }) => {
  const stepIndex = orderedStepNames.indexOf(stepName);
  const beforeSteps = orderedStepNames.slice(0, stepIndex);
  const currentStep = orderedStepNames[stepIndex];
  const afterSteps = orderedStepNames.slice(stepIndex + 1);

  mixpanel.track(`ONBOARDING_STEP_${currentStep}`);

  if (isNewMember) {
    onNewMember();
  }

  return (
    <div className="row">
      <div className="col px-0">
        { // show welcome when in first step
          stepIndex === 0 ? (
            <div className="px-col mt-5">
              <p className="lead">
                <Message params={{ name: userFirstName }}>steps.welcome</Message>
              </p>
              { isNewMember ? (
                <p className="lead"><Message>steps.intro.new.member</Message></p>
              ) : <p className="lead"><Message>steps.intro</Message></p>
              }
            </div>
          ) : ''
        }
        <div className="tv-steps mt-5">
          {
            beforeSteps.map((beforeStep, index) =>
              <StepTitle key={beforeStep} number={index + 1} completed>
                <Message>{`steps.${beforeStep}`}</Message>
              </StepTitle>,
            )
          }
          <StepTitle number={stepIndex + 1} active>
            <Message>{`steps.${currentStep}`}</Message>
          </StepTitle>
          <div className="pb-5 px-col">{children}</div>
          {
            stepIndex !== orderedStepNames.length - 1 ? <hr className="mb-4" /> : ''
          }
          {
            afterSteps.map((afterStep, index) =>
              <StepTitle key={afterStep} number={index + 1 + stepIndex + 1}>
                <Message>{`steps.${afterStep}`}</Message>
              </StepTitle>,
            )
          }
        </div>
      </div>
    </div>
  );
};

const noop = () => null;

Steps.defaultProps = {
  children: null,
  stepName: null,
  userFirstName: '',
  isNewMember: false,
  onNewMember: noop,
};

Steps.propTypes = {
  stepName: Types.string,
  userFirstName: Types.string,
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
  isNewMember: Types.bool,
  onNewMember: Types.func,
};

const mapStateToProps = state => ({
  stepName: state.routing.locationBeforeTransitions.pathname.split('/').pop(),
  userFirstName: (state.login.user || {}).firstName,
  isNewMember: state.exchange.isNewMember,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onNewMember: refreshToken,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Steps);

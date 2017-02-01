import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';

const orderedStepNames = [
  'select-exchange',
  'select-fund',
  'transfer-future-capital',
  'confirm-application',
];

// this component wraps all steps and renders the top and bottom areas.
const Steps = ({ children, stepName }) => {
  const stepIndex = orderedStepNames.indexOf(stepName);
  const beforeSteps = orderedStepNames.slice(0, stepIndex);
  const currentStep = orderedStepNames[stepIndex];
  const afterSteps = orderedStepNames.slice(stepIndex + 1);
  return (
    <div>
      <ul>
        {beforeSteps.map(beforeStep => <li key={beforeStep}>{beforeStep}</li>)}
      </ul>
      {currentStep}
      {children}
      <ul>
        {afterSteps.map(afterStep => <li key={afterStep}>{afterStep}</li>)}
      </ul>
    </div>
  );
};

Steps.defaultProps = {
  children: null,
  stepName: null,
};

Steps.propTypes = {
  stepName: Types.string,
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
};

const mapStateToProps = state => ({
  stepName: state.routing.locationBeforeTransitions.pathname.split('/').pop(),
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Steps);

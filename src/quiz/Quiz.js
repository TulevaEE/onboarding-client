import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { nextStep } from './actions';

// import './Quiz.scss';

export const Quiz = ({
  onNextStep,
}) => (
  <div className="row">
    <div className="col-12 mt-5 px-0">
      <h2 className="mt-5">
        <Message>Take a quiz!</Message>
      </h2>
      <Link className="btn btn-primary mt-4 profile-link" to="/account">
        <Message>some link</Message>
      </Link>
      <button className="btn btn-secondary text-center" onClick={onNextStep}>
        <Message>Next step</Message>
      </button>
    </div>
  </div>
);

const noop = () => null;

Quiz.defaultProps = {
  onNextStep: noop,
};

Quiz.propTypes = {
  onNextStep: Types.func,
};

const mapStateToProps = state => ({
  temp: !state,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Quiz);

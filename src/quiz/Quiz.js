import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { nextStep } from './actions';
import Question1 from './question1/Question1';

export class Quiz extends Component {
  componentDidMount() {
  }
  onNextStep(step) {
    this.setState({ step: step + 1 });
    // console.log(this.state);
  }
  render() {
    const {
      question,
    } = this.props;

    if (question === 1) {
      return (
        <Question1 onNextStep={() => this.onNextStep(1)} />
      );
    }
    return (
      <Message>Hmm, something went wrong. Please refresh.</Message>
    );
  }
}

// const noop = () => null;

Quiz.defaultProps = {
  // onNextStep: noop,
  sourceFunds: null,
  question: 1,
};

Quiz.propTypes = {
  // onNextStep: Types.func,
  question: Types.number,
};

const mapStateToProps = state => ({
  aha: state,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Quiz);

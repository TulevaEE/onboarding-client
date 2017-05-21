// import React, { Component, PropTypes as Types } from 'react';
import React, { Component } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { nextStep } from './actions';
import Question1 from './question1/Question1';
import Question2 from './question2/Question2';
import Question3 from './question3/Question3';

export class Quiz extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: 1,
    };
  }
  componentDidMount() {
  }
  onNextStep(question) {
    this.setState({ question: question + 1 });
    // console.log(this.state);
  }
  render() {
    // const {
    //   question,
    // } = this.props;

    if (this.state.question === 1) {
      return (
        <Question1 onNextStep={() => this.onNextStep(1)} />
      );
    } else if (this.state.question === 2) {
      return (
        <Question2 onNextStep={() => this.onNextStep(2)} />
      );
    } else if (this.state.question === 3) {
      return (
        <Question3 onNextStep={() => this.onNextStep(3)} />
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
};

Quiz.propTypes = {
  // onNextStep: Types.func,
};

const mapStateToProps = state => ({
  aha: state,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Quiz);

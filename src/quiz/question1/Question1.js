import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

// import './Question1.scss';

export class Question1 extends Component {

  componentDidMount() {
  }
  onTotalPensionSelect(amount) {
    console.log(this.props.sourceFunds);
    this.setState(() => ({ totalPensionSelected: amount }));
  }

  render() {
    // const {
    //   sourceSelection,
    // } = this.props;

    return (
      <div>
        <div className="col-12 text-center">
          <h2 className="mt-5">
            <Message>How much money do you have on your 2nd pillar pension today?</Message>
          </h2>

          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onTotalPensionSelect(2500)}
            >
              <Message>2500 euros</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onTotalPensionSelect(5000)}
            >
              <Message>5000 euros</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onTotalPensionSelect(7500)}
            >
              <Message>7500 euros</Message>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// const noop = () => null;

Question1.defaultProps = {
  // onNextStep: noop,
  sourceFunds: null,
};

Question1.propTypes = {
  // onNextStep: Types.func,
  sourceFunds: Types.arrayOf(Types.shape({})),
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  totalPensionCapital:
    state.exchange.sourceFunds ? state.exchange.sourceFunds.map(item => item.price)
  .reduce((a, b) => a + b, 0) : 0,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  // onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Question1);

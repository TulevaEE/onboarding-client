import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

// import './Question1.scss';

export class Question1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalPensionCapitalSelected: null,
    };
  }
  componentDidMount() {
  }
  onTotalPensionSelect(amount) {
    this.setState(() => ({ totalPensionCapitalSelected: amount }));
  }
  render() {
    const {
      onNextStep,
      totalPensionCapital,
    } = this.props;

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
              <Message>{
              Math.round(totalPensionCapital * 0.5)
              }</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onTotalPensionSelect(5000)}
            >
              <Message>{
                Math.round(totalPensionCapital)
              }</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onTotalPensionSelect(7500)}
            >
              <Message>{
                Math.round(totalPensionCapital * 1.5)
              }</Message>
            </button>
          </div>
        </div>

        {
          this.state.totalPensionCapitalSelected ? (
            <div>
              <div className="incorrect">
                <h2>Not quite</h2>
                <p>
                  Every month, 2% of your salary
                  (+ 4% from the state).
                  You may not notice it since it is deducted before your salary is paid.</p>
              </div>
            </div>
          ) : ''
        }

        {
          this.state.totalPensionCapitalSelected ? (
            <div>
              <button
                className="btn btn-success text-center mt-2"
                onClick={onNextStep}
              >
                <Message>Next</Message>
              </button>
            </div>
          ) : ''
        }
      </div>
    );
  }
}

const noop = () => null;

Question1.defaultProps = {
  onNextStep: noop,
  // sourceFunds: null,
  totalPensionCapital: null,
};

Question1.propTypes = {
  onNextStep: Types.func,
  totalPensionCapital: Types.number,
  // sourceFunds: Types.arrayOf(Types.shape({})),
};

const mapStateToProps = state => ({
  // sourceFunds: state.exchange.sourceFunds,
  totalPensionCapital:
    state.exchange.sourceFunds ? state.exchange.sourceFunds.map(item => item.price)
  .reduce((a, b) => a + b, 0) : 0,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  // onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Question1);

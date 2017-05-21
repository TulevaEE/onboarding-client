import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  debouncedSalaryChange,
} from '../../comparison/actions';

export class Question3 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeFund: props.activeFund,
      activeFundStrategy: props.activeFundStrategy,
      totalPensionCapital: props.totalPensionCapital,
      // salary: 1500,
    };
  }
  componentDidMount() {
  }
  onFundFeeSelected() {
    this.setState(() => ({ fundFeeSelected: 123 }));
  }
  // onSalaryChange(salary) {
  //   console.log(salary);
  //   this.setState(() => ({ salary }));
  // }
  render() {
    const {
      onNextStep,
      onSalaryChange,
      comparison,
    } = this.props;

    return (
      <div>
        <div className="col-12 text-center">
          <h2 className="mt-5">
            For calculation purposes, what is your salary?
          </h2>

          <div>
            <input onChange={event => onSalaryChange(Number(event.target.value))} />
          </div>

          <h2 className="mt-5">
            How much do you pay every month to your fund manager?
          </h2>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onFundFeeSelected()}
            >
              <Message>1.20</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onFundFeeSelected()}
            >
              <Message>3.83</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onFundFeeSelected()}
            >
              <Message>4.50</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onFundFeeSelected()}
            >
              <Message>5.50</Message>
            </button>
          </div>
        </div>

        {
          this.state.fundFeeSelected ? (
            <div>
              <div className="incorrect">
                <h2>Say what?</h2>
                <p>
                  Your fund managemen fee is {this.state.activeFund.managementFeePercent}.
                  This means that every year {this.state.activeFund.managementFeePercent} of your II
                  pillar savings go to fund manager. The fee is charged monthly.
                </p>
                <p>
                  Last month you paid&nbsp;
                  {
                    Math.round(
                      (this.state.totalPensionCapital
                      * this.state.activeFund.managementFeePercent) * 0.083
                      * 100) / 100
                  }
                  This might not look much, but here is the catch:
                  over the years, the sums accumulate and reduce the
                  amount of money that return earn to you.
                </p>
                <p>
                  By the time you retire, you will have spent {comparison.currentFundFee} on
                  pension fund fees
                </p>
                <p>
                  If you invested in Tulevas index fund,
                  you would spend {comparison.newFundFee} on
                  fees.
                </p>
              </div>
            </div>
          ) : ''
        }

        {
          this.state.fundFeeSelected ? (
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

Question3.defaultProps = {
  comparison: null,
  onNextStep: noop,
  // sourceFunds: null,
  totalPensionCapital: null,
  activeFund: null,
  onSalaryChange: noop,
  activeFundStrategy: null,
};

Question3.propTypes = {
  comparison: Types.shape({}),
  onNextStep: Types.func,
  activeFund: Types.shape({}),
  activeFundStrategy: Types.string,
  onSalaryChange: Types.func,
  totalPensionCapital: Types.number,
  // sourceFunds: Types.arrayOf(Types.shape({})),
};

const mapStateToProps = state => ({
  // sourceFunds: state.exchange.sourceFunds,
  comparison: state.comparison ? state.comparison.comparison : null,
  activeFund: state.exchange.sourceFunds.find(fund => fund.activeFund),
  activeFundStrategy: 'aga',
  totalPensionCapital:
    state.exchange.sourceFunds ? state.exchange.sourceFunds.map(item => item.price)
      .reduce((a, b) => a + b, 0) : 0,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  // onNextStep: nextStep,
  onSalaryChange: debouncedSalaryChange,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Question3);

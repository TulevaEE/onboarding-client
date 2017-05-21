import React, { Component, PropTypes as Types } from 'react';
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

        {
          this.state.totalPensionCapitalSelected ? (
            <div>
              <div className="incorrect">
                <h2>Not quite</h2>
                <p>
                  {/* <img*/}
                  {/* src="img/euros-fund.png"*/}
                  {/* width="450px"*/}
                  {/* alt="asd"*/}
                  {/* />*/}
                  Every month, 2% of your salary
                  (+ 4% from the state) or 90 euros goes to your pension fund.
                  You may not notice it since it is deducted before your salary is paid.</p>
              </div>
            </div>
          ) : ''
        }

        {
          this.state.totalPensionCapitalSelected ? (
            <div>
              <button
                className="btn btn-primary text-center mt-2"
                onClick={onNextStep}
              >
                <Message>OK</Message>
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

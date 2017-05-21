import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
// import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export class Question4 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // activeFund: props.activeFund,
      // activeFundStrategy: props.activeFundStrategy,
      // totalPensionCapital: props.totalPensionCapital,
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
      comparison,
    } = this.props;

    return (
      <div>
        <div className="col-12 text-center">
          <h2 className="mt-5">
            Not bad! If you keep working on paying into your second pillar pension fund,
            you can expect to receive&nbsp;
            { Math.round((comparison.currentFundFutureValue / 300) * 100) / 100 }
            &nbsp;euros a month
            from you II pillar. 1st pillar will add additional 400 euros.
          </h2>
        </div>

        <a className="btn btn-success" href="https://tuleva.ee/final/">
          <Message>Find out whats next</Message>
        </a>
      </div>
    );
  }
}

const noop = () => null;

Question4.defaultProps = {
  comparison: null,
  onNextStep: noop,
  // sourceFunds: null,
  totalPensionCapital: null,
  activeFund: null,
  activeFundStrategy: null,
};

Question4.propTypes = {
  comparison: Types.shape({}),
  // sourceFunds: Types.arrayOf(Types.shape({})),
};

const mapStateToProps = state => ({
  comparison: state.comparison ? state.comparison.comparison : null,
});

// const mapDispatchToProps = dispatch => bindActionCreators({
//   onNextStep: nextStep,
// }, dispatch);

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Question4);

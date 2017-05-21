import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const CONSERVATIVE = 'Conservative';
const BALANCED = 'Balanced';
const PROGRESSIVE = 'Progressive';
const AGGRESSIVE = 'Aggressive';

const funds = [
  {
    id: 3,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600019766',
    name: 'LHV Pensionifond XL',
    managementFeeRate: 0.0133,
  },
  {
    id: 7,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600019816',
    name: 'LHV Pensionifond Intress',
    managementFeeRate: 0.0054285,
  },
  {
    id: 8,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600019824',
    name: 'LHV Pensionifond S',
    managementFeeRate: 0.00798,
  },
  {
    id: 9,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600019782',
    name: 'LHV Pensionifond XS',
    managementFeeRate: 0.0062802,
  },
  {
    id: 10,
    fundManager: {
      id: 4,
      name: 'Nordea',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600098455',
    name: 'Nordea Pensionifond C',
    managementFeeRate: 0.0075,
  },
  {
    id: 11,
    fundManager: {
      id: 3,
      name: 'SEB',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600019717',
    name: 'SEB Konservatiivne Pensionifond',
    managementFeeRate: 0.0049,
  },
  {
    id: 12,
    fundManager: {
      id: 2,
      name: 'Swedbank',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600019733',
    name: 'Swedbank Pensionifond K1 (Konservatiivne strateegia)',
    managementFeeRate: 0.0029,
  },
  {
    id: 13,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: BALANCED,
    isin: 'EE3600019790',
    name: 'LHV Pensionifond 25',
    managementFeeRate: 0.0096425,
  },
  {
    id: 14,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: BALANCED,
    isin: 'EE3600019774',
    name: 'LHV Pensionifond M',
    managementFeeRate: 0.01064,
  },
  {
    id: 15,
    fundManager: {
      id: 4,
      name: 'Nordea',
    },
    strategy: BALANCED,
    isin: 'EE3600098448',
    name: 'Nordea Pensionifond B',
    managementFeeRate: 0.0137,
  },
  {
    id: 16,
    fundManager: {
      id: 3,
      name: 'SEB',
    },
    strategy: BALANCED,
    isin: 'EE3600098612',
    name: 'SEB Optimaalne Pensionifond',
    managementFeeRate: 0.010115,
  },
  {
    id: 17,
    fundManager: {
      id: 2,
      name: 'Swedbank',
    },
    strategy: BALANCED,
    isin: 'EE3600019741',
    name: 'Swedbank Pensionifond K2 (Tasakaalustatud strateegia)',
    managementFeeRate: 0.0087,
  },
  {
    id: 18,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: PROGRESSIVE,
    isin: 'EE3600019808',
    name: 'LHV Pensionifond 50',
    managementFeeRate: 0.0123025,
  },
  {
    id: 19,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: PROGRESSIVE,
    isin: 'EE3600019832',
    name: 'LHV Pensionifond L',
    managementFeeRate: 0.0133,
  },
  {
    id: 20,
    fundManager: {
      id: 4,
      name: 'Nordea',
    },
    strategy: PROGRESSIVE,
    isin: 'EE3600098430',
    name: 'Nordea Pensionifond A',
    managementFeeRate: 0.0147,
  },
  {
    id: 21,
    fundManager: {
      id: 3,
      name: 'SEB',
    },
    strategy: PROGRESSIVE,
    isin: 'EE3600019725',
    name: 'SEB Progressiivne Pensionifond',
    managementFeeRate: 0.011671,
  },
  {
    id: 22,
    fundManager: {
      id: 2,
      name: 'Swedbank',
    },
    strategy: PROGRESSIVE,
    isin: 'EE3600019758',
    name: 'Swedbank Pensionifond K3 (Kasvustrateegia)',
    managementFeeRate: 0.0092,
  },
  {
    id: 23,
    fundManager: {
      id: 1,
      name: 'LHV',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600109401',
    name: 'LHV Pensionifond Indeks',
    managementFeeRate: 0.0039,
  },
  {
    id: 24,
    fundManager: {
      id: 4,
      name: 'Nordea',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600103503',
    name: 'Nordea Pensionifond A Pluss',
    managementFeeRate: 0.0156,
  },
  {
    id: 25,
    fundManager: {
      id: 3,
      name: 'SEB',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600103297',
    name: 'SEB Energiline Pensionifond',
    managementFeeRate: 0.013227,
  },
  {
    id: 27,
    fundManager: {
      id: 2,
      name: 'Swedbank',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600103248',
    name: 'Swedbank Pensionifond K4 (Aktsiastrateegia)',
    managementFeeRate: 0.0092,
  },
  {
    id: 28,
    fundManager: {
      id: 2,
      name: 'Swedbank',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600109393',
    name: 'Swedbank Pensionifond K90-99 (Elutsükli strateegia)',
    managementFeeRate: 0.0049,
  },
  {
    id: 26,
    fundManager: {
      id: 3,
      name: 'SEB',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600109427',
    name: 'SEB Energiline Pensionifond Indeks',
    managementFeeRate: 0.0049,
  },
  {
    id: 4,
    fundManager: {
      id: 5,
      name: 'Tuleva',
    },
    strategy: AGGRESSIVE,
    isin: 'EE3600109435',
    name: 'Tuleva Maailma Aktsiate Pensionifond',
    managementFeeRate: 0.0034,
  },
  {
    id: 6,
    fundManager: {
      id: 5,
      name: 'Tuleva',
    },
    strategy: CONSERVATIVE,
    isin: 'EE3600109443',
    name: 'Tuleva Maailma Võlakirjade Pensionifond',
    managementFeeRate: 0.0034,
  },
];

function getStrategy(isin) {
  return funds.find(fund => fund.isin === isin).strategy;
}

export class Question2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeFund: props.activeFund,
      activeFundStrategy: props.activeFundStrategy,
    };
  }
  componentDidMount() {
  }
  onStrategySelect(amount) {
    this.setState(() => ({ fundStrategySelected: amount }));
  }
  render() {
    const {
      onNextStep,
    } = this.props;

    return (
      <div>
        <div className="col-12 text-center">
          <h2 className="mt-5">
            Your contributions go today to {this.state.activeFund.name} pension fund.
              What is the funds investment strategy?
          </h2>

          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onStrategySelect(CONSERVATIVE)}
            >
              <Message>Conservative</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onStrategySelect(BALANCED)}
            >
              <Message>Balanced</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onStrategySelect(PROGRESSIVE)}
            >
              <Message>Progressive</Message>
            </button>
          </div>
          <div>
            <button
              className="btn btn-primary text-center mt-2"
              onClick={() => this.onStrategySelect(AGGRESSIVE)}
            >
              <Message>Aggressive</Message>
            </button>
          </div>
        </div>

        {
          this.state.fundStrategySelected ? (
            <div>
              <div className="incorrect">
                <h2>Not quite</h2>
                <p>
                  Your pension payments go to {this.state.activeFundStrategy}
                  fund. What does that mean?
                </p>
                <ul>
                  <li>Conservative funds invests only in bonds</li>
                  <li>Balanced funds invest up to 25% into stocks, rest goes to bonds</li>
                  <li>Progressive funds invest up to 55% into stocks, rest goes to bonds</li>
                  <li>Aggressive funds invest up to 75% into stocks, rest goes to bonds</li>
                </ul>

                <h3>Most international analysts recomment that you choose aggressive pension fund
                  if you have more than 10 year left until retirement.</h3>
              </div>
            </div>
          ) : ''
        }

        {
          this.state.fundStrategySelected ? (
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

Question2.defaultProps = {
  onNextStep: noop,
  // sourceFunds: null,
  totalPensionCapital: null,
  activeFund: null,
  activeFundStrategy: null,
};

Question2.propTypes = {
  onNextStep: Types.func,
  activeFund: Types.shape({}),
  activeFundStrategy: Types.string,
  // sourceFunds: Types.arrayOf(Types.shape({})),
};

const mapStateToProps = state => ({
  // sourceFunds: state.exchange.sourceFunds,
  activeFund: state.exchange.sourceFunds.find(fund => fund.activeFund),
  activeFundStrategy: getStrategy(state.exchange.sourceFunds.find(fund => fund.activeFund).isin),
});

const mapDispatchToProps = dispatch => bindActionCreators({
  // onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Question2);

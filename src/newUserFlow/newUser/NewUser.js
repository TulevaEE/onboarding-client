/* eslint-disable no-unused-vars */
import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { ErrorAlert, AuthenticationLoader } from '../../common';
import MiniComparison from '../../common/comparison/mini';

import './NewUser.scss';
import { formatLargeAmountForCurrency, getTotalFundValue } from '../../common/utils';
import { LOAD_PENSION_DATA_SUCCESS } from '../../exchange/constants';

export class NewUser extends Component {

  componentDidMount() {
    const self = this;
    setTimeout(() => {
      // console.log('timeout ended');
      // self.props.onLoadComplete();
    }, 3000);
  }

  render() {
    const {
      loading,
      loadingSourceFunds,
      sourceFunds,
      errorDescription,
      userFirstName,
      userConverted,
      comparison,
    } = this.props;

    if (errorDescription) {
      return <ErrorAlert description={errorDescription} />;
    }
    if (loadingSourceFunds) {
      return (<AuthenticationLoader
        message="Laeme pensionikeskusest sinu andmeid"
        overlayed
      />);
    }
    const totalFundValue = formatLargeAmountForCurrency(getTotalFundValue(sourceFunds));
    return (
      <div>
        <div className="px-col mb-4">
          <p className="mb-4 mt-5 lead">
            <Message params={{ name: userFirstName }}>steps.welcome</Message>
          </p>
          <div className="lead">
            <p className="mb-4">
              <span>
                <Message>Sinu II samba pensionikontole on tänaseks kogunenud </Message>
              </span>
              <strong>{totalFundValue}</strong>.
            </p>
            <MiniComparison />
          </div>
        </div>

        <div className="row text-boxes mb-5">
          {
            !userConverted ? (
              <div className="col-md-6">
                <div className="text-box text-box--rounder">
                  <h3 className="text-box__title text-box__title--border-lightblue">
                    <Message>Miks koguda pensionit Tulevas?</Message>
                  </h3>
                  <div className="text-box__content">
                    <div className="mb-4">
                      <span><Message>Kogudes pensionit Tulevas,
                        hoiad tasudelt kokku </Message></span>
                      <span className="lead highlight">
                        {formatLargeAmountForCurrency(
                        comparison.currentFundFee - comparison.newFundFee)}
                      </span>
                    </div>
                    <ul className="list-style-checkmark text-lg">
                      <li>
                        <span><span className="lead highlight">3x soodsam</span>
                          <Message> — valitsemistasu vaid </Message></span>
                        <strong>0,34%</strong></li>
                      <li><Message>riiklikult reguleeritud</Message></li>
                      <li><Message>kogud raha endale, mitte pangale</Message></li>
                    </ul>
                    <div>Fondivahetus on tasuta</div>
                    <div className="mt-4">
                      <Link className="btn btn-secondary btn-block mb-2" to="/steps/non-member">
                        <Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : ''
          }
          <div className="col-md-6">
            <div className="text-box text-box--rounder">
              <h3 className="text-box__title text-box__title--border-blue">
                <Message>Miks astuda ka Tuleva liikmeks?</Message>
              </h3>
              <div className="text-box__content">
                <div className="mb-4">
                  <span><Message>Lisaks sellele, et liikmena
                    hoiad tasudelt kokku </Message></span>
                  <span className="lead highlight">
                    {formatLargeAmountForCurrency(comparison.currentFundFee
                      - comparison.newFundFee)}
                  </span>
                </div>
                <ul className="list-style-plussign text-lg">
                  <li><Message>kogud </Message>
                    <span className="lead highlight">2 000 €</span>
                    <span><Message> liikmeboonust </Message></span>
                    <span>(<strong>0,05%</strong><Message>&nbsp;aastas</Message>)</span>
                  </li>
                  <li><Message>oled oma pensionifondi kaasomanik</Message></li>
                  <li><Message>panustad Tuleva arengusse</Message></li>
                </ul>
                <div>Ühekordne liitumistasu 100 €</div>
                <div className="mt-4">
                  <Link className={'btn btn-primary btn-block mb-2'} to="/steps/signup">
                    <Message>newUserFlow.newUser.i.wish.to.join</Message>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const noop = () => null;

NewUser.defaultProps = {
  sourceFunds: [],
  targetFunds: [],
  loading: true,
  loadingSourceFunds: false,
  errorDescription: '',
  userFirstName: '',
  userConverted: false,
  comparison: {},
  onLoadComplete: noop,
};

NewUser.propTypes = {
  sourceFunds: Types.arrayOf(Types.shape({})),
  loading: Types.bool,
  loadingSourceFunds: Types.bool,
  errorDescription: Types.string,
  userFirstName: Types.string,
  userConverted: Types.bool,
  comparison: Types.shape({}),
  // eslint-disable-next-line react/no-unused-prop-types
  onLoadComplete: Types.func,
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  loading: state.exchange.loadingPensionData,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  errorDescription: state.exchange.error,
  userFirstName: (state.login.user || {}).firstName,
  userConverted: (state.login.userConversion || {}).transfersComplete &&
    (state.login.userConversion || {}).selectionComplete,
  comparison: (state.comparison || {}).comparison || {},
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onLoadComplete: () => {
    // dispatch({ type: LOAD_PENSION_DATA_SUCCESS });
  },
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

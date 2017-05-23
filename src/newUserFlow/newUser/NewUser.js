/* eslint-disable no-unused-vars */
import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { ErrorAlert, AuthenticationLoader, utils } from '../../common';
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
      activeSourceFund,
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
          <div className="col-md-4">
            <div className="text-box text-box--rounder">
              <h3 className="text-box__title text-box__title--border-blue">
                <Message>{activeSourceFund.name}</Message>
              </h3>
              <div className="text-box__content">
                <div className="mb-4">
                  <span>
                    <Message>Oma praeguses fondis maksad tööelu jooksul tasudena </Message>
                  </span>
                  <strong className="red lead">
                    <span>{formatLargeAmountForCurrency(comparison.currentFundFee)}</span>
                  </strong>
                </div>
                <ul className="list-style-plussign text-lg">
                  <li>
                    <Message>fondi valitsemistasu </Message>
                    <span className="red">{activeSourceFund.managementFeePercent.split('.').join(',')}%</span>
                    <span> aastas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {
            !userConverted ? (
              <div className="col-md-4">
                <div className="text-box text-box--rounder">
                  <h3 className="text-box__title text-box__title--border-lightblue">
                    <Message>Kogu pensioni koos meiega</Message>
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
                        <span><span className="lead highlight">Eesti soodsaim</span> pensionifond
                          <Message> — valitsemistasu vaid </Message></span>
                        <strong>0,34%</strong></li>
                      <li><Message>sama turvaline kui pank</Message></li>
                      <li><Message>kogud raha endale, mitte pangale</Message></li>
                    </ul>
                    <div><i>Pensioni ületoomine on tasuta</i></div>
                    <div className="mt-4">
                      <Link className="btn btn-secondary btn-link mb-2" to="/steps/non-member">
                        <Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : ''
          }
          <div className="col-md-4">
            <div className="text-box text-box--rounder">
              <h3 className="text-box__title text-box__title--border-blue">
                <Message>Astu ka Tuleva liikmeks</Message>
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
                  <li><Message>omanikuna sul on otsustamises hääl</Message></li>
                  <li><Message>kogud ligikaudu </Message>
                    <span className="lead highlight">2&nbsp;000&nbsp;€</span>
                    <span><Message> liikmeboonust </Message></span>
                    <span>(<Message>tööelu jooksul</Message>) </span>
                  </li>
                  <li>saad osa kasumijaotusest</li>
                  <li><Message>
                    teeme koos Eesti pensionisüsteemi paremaks
                  </Message></li>
                </ul>
                <div><i>Ühekordne liitumistasu 100 €</i></div>
                <div className="my-4">
                  <Link className={'btn btn-primary btn-block mb-2'} to="/steps/signup">
                    <Message>newUserFlow.newUser.i.wish.to.join</Message>
                  </Link>
                  <div className="mt-4 small">
                    Hiljem saad läbi Tuleva rakenduse kohe ka pensioni üle tuua
                  </div>
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
  activeSourceFund: null,
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
  activeSourceFund: Types.shape({}),
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
  activeSourceFund: utils.findWhere(state.exchange.sourceFunds || [],
    element => element.activeFund),
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onLoadComplete: () => {
    // dispatch({ type: LOAD_PENSION_DATA_SUCCESS });
  },
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

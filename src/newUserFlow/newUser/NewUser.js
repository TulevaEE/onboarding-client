import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Loader, ErrorAlert } from '../../common';
import MiniComparison from '../../common/comparison/mini';

import './NewUser.scss';
import { formatLargeAmountForCurrency, getTotalFundValue } from '../../common/utils';


export const NewUser = ({
                          loadingSourceFunds,
                          sourceFunds,
                          errorDescription,
                          userFirstName,
                          userConverted,
                          comparison,
                        }) => {
  if (errorDescription) {
    return <ErrorAlert description={errorDescription} />;
  }
  if (loadingSourceFunds) {
    return <Loader className="align-middle" />;
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
            <Message>Sinu II samba pensionikontole on tänaseks kogunenud</Message>
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
                    <Message>Valides Tuleva pensionifondi, hoiaksid tasudelt kokku</Message>
                    <span className="lead highlight">
                      {formatLargeAmountForCurrency(
                        comparison.currentFundFee - comparison.newFundFee)}
                    </span>
                  </div>
                  <ul className="list-style-checkmark text-lg">
                    <li><Message>madalad kulud — valitsemistasu vaid</Message>
                      <strong>0.34%</strong></li>
                    <li><a href="http://tuleva.ee/tuleva20/fondid/"><Message>selged investeerimisreeglid</Message></a></li>
                    <li><Message>kogud raha endale, mitte pangale</Message></li>
                  </ul>
                  <div className="text-center">
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
                <Message>Astudes Tuleva liikmeks, hoiaksid tasudelt kokku</Message>
                <span className="lead highlight">
                  {formatLargeAmountForCurrency(comparison.currentFundFee - comparison.newFundFee)}
                </span>
                <Message>ja lisaks teeniksid</Message>
                <span className="lead highlight">2 000 €</span> <Message>liikmeboonust</Message>
              </div>
              <ul className="list-style-plussign text-lg">
                <li><Message>kogud igal aastal</Message>
                  <strong>0,05%</strong><Message>liikmeboonust</Message></li>
                <li><Message>oled oma pensionifondi kaasomanik</Message></li>
                <li><Message>saad otsustada Tuleva tuleviku üle</Message></li>
              </ul>
              <div className="text-center">
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
};

NewUser.defaultProps = {
  sourceFunds: [],
  targetFunds: [],
  loadingSourceFunds: false,
  errorDescription: '',
  userFirstName: '',
  userConverted: false,
  comparison: {},
};

NewUser.propTypes = {
  sourceFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  errorDescription: Types.string,
  userFirstName: Types.string,
  userConverted: Types.bool,
  comparison: Types.shape({}),
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  errorDescription: state.exchange.error,
  userFirstName: (state.login.user || {}).firstName,
  userConverted: (state.login.userConversion || {}).transfersComplete &&
    (state.login.userConversion || {}).selectionComplete,
  comparison: (state.comparison || {}).comparison || {},
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

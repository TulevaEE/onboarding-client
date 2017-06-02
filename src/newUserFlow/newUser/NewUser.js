/* eslint-disable no-unused-vars */
import React, { Component, PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { ErrorAlert, AuthenticationLoader, utils } from '../../common';
import MiniComparison from '../../common/comparison/mini';

import './NewUser.scss';
import JoinTulevaList from './joinTulevaList';
import BringPensionToTulevaList from './bringPensionToTulevaList';
import OldPensionFundList from './oldPensionFundList';

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
      showAlternative,
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
            <p>
              <span>
                <Message>new.user.flow.new.user.total.fund.value</Message>
              </span>
              <strong>{totalFundValue}</strong>.
            </p>
            <p>
              <Message>new.user.flow.new.user.active.fund.name</Message>
              <strong>{activeSourceFund.name}</strong>.
            </p>
            <MiniComparison />
          </div>
        </div>

        <div className="row text-boxes mb-5">
          { !userConverted ? (
            <div className="col-md-4">
              <div className="text-box text-box--rounder">
                <h3 className="text-box__title text-box__title--border-blue">
                  <Message>{activeSourceFund.name}</Message>
                </h3>
                <div className="text-box__content">
                  <div className="mb-4">
                    <span>
                      <Message>new.user.flow.new.user.old.fund.fees</Message>
                    </span>
                    <strong className="red lead">
                      <span>{formatLargeAmountForCurrency(comparison.currentFundFee)}</span>
                    </strong>
                  </div>
                  <OldPensionFundList
                    className="list-style-plussign text-lg"
                    showAlternative={showAlternative}
                  />
                </div>
              </div>
            </div>
          ) : '' }
          { !userConverted ? (
            <div className="col-md-4">
              <div className="text-box text-box--rounder">
                <h3 className="text-box__title text-box__title--border-lightblue">
                  <Message>new.user.flow.new.user.why.tuleva.pension</Message>
                </h3>
                <div className="text-box__content">
                  { !showAlternative ?
                    <div className="mb-4">
                      <span><Message>new.user.flow.new.user.save.fees.tuleva</Message></span>
                      <span className="lead highlight">
                        {formatLargeAmountForCurrency(
                        comparison.currentFundFee - comparison.newFundFee)}
                      </span>
                    </div> : '' }
                  <BringPensionToTulevaList
                    className="list-style-checkmark text-lg"
                    showAlternative={showAlternative}
                  />
                  <div>
                    <i><Message>new.user.flow.new.user.pension.transfer.free</Message></i>
                  </div>
                  <div className="mt-4">
                    <Link
                      className="btn btn-secondary btn-link btn-block px-0 mb-2"
                      to="/steps/non-member"
                    >
                      <Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : ''}
          <div className={!userConverted ? 'col-md-4' : ''}>
            <div className="text-box text-box--rounder">
              <h3 className="text-box__title text-box__title--border-blue">
                <Message>new.user.flow.new.user.why.join.tuleva</Message>
              </h3>
              <div className="text-box__content">
                { !showAlternative && !userConverted ?
                  <div className="mb-4">
                    <span><Message>new.user.flow.new.user.tuleva.member.extras</Message></span>
                    <span className="lead highlight">
                      {formatLargeAmountForCurrency(comparison.currentFundFee
                      - comparison.newFundFee)}
                    </span>
                  </div> : '' }
                <JoinTulevaList
                  className="list-style-plussign text-lg"
                  showAlternative={showAlternative}
                />
                <div><i><Message>new.user.flow.new.user.membership.fee</Message></i></div>
                <div className="my-4">
                  <Link className={'btn btn-primary btn-block mb-2'} to="/steps/signup">
                    <Message>newUserFlow.newUser.i.wish.to.join</Message>
                  </Link>
                  <div className="mt-4 small">
                    <Message>new.user.flow.new.user.can.transfer.pension</Message>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="small">
            <Message>new.user.flow.footnote.calculator.part1</Message>
            <a href="http://www.pensionikeskus.ee/ii-sammas/investorkaitse/varade-kaitse/">
              <Message>new.user.flow.footnote.calculator.part2link</Message>
            </a>
            <Message>new.user.flow.footnote.calculator.part3</Message>
            <a href="http://www.pensionikeskus.ee/files/dokumendid/kogumispensioni_statistika_012017.pdf">
              <Message>new.user.flow.footnote.calculator.part4link</Message>
            </a>
            <Message>new.user.flow.footnote.calculator.part5</Message>
          </p>
          <p className="small">
            <Message>new.user.flow.footnote.cheapest</Message>
          </p>
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
  showAlternative: false,
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
  showAlternative: Types.bool,
};

const mapStateToProps = (state) => {
  const activeSourceFund = utils.findWhere(state.exchange.sourceFunds || [],
    element => element.activeFund);

  return {
    sourceFunds: state.exchange.sourceFunds,
    loading: state.exchange.loadingPensionData,
    loadingSourceFunds: state.exchange.loadingSourceFunds,
    errorDescription: state.exchange.error,
    userFirstName: (state.login.user || {}).firstName,
    userConverted: (state.login.userConversion || {}).transfersComplete &&
    (state.login.userConversion || {}).selectionComplete,
    comparison: (state.comparison || {}).comparison || {},
    activeSourceFund,
    showAlternative: (activeSourceFund || {}).isin === 'EE3600019758', // show alternative text for this fund
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  onLoadComplete: () => {
    // dispatch({ type: LOAD_PENSION_DATA_SUCCESS });
  },
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

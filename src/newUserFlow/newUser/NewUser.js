import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Loader, ErrorAlert } from '../../common/index';
import PensionFundTable from '../../onboardingFlow/selectSources/pensionFundTable/index';
import ComparisonWidget from '../../common/comparison/widget';
import './NewUser.scss';

export const NewUser = ({
                          loadingSourceFunds,
                          sourceFunds,
                          errorDescription,
                          userFirstName,
                          userConverted,
                        }) => {
  if (errorDescription) {
    return <ErrorAlert description={errorDescription} />;
  }
  if (loadingSourceFunds) {
    return <Loader className="align-middle" />;
  }

  return (
    <div>
      <div className="px-col mb-4">
        <p className="mb-4 mt-5 lead">
          <Message params={{ name: userFirstName }}>steps.welcome</Message>
        </p>
        <p><Message>new.user.flow.intro</Message></p>
        <div className="row">
          <div className="col-8 mt-3">
            <p className="mb-4 lead"><Message>select.sources.current.status</Message></p>
            <PensionFundTable funds={sourceFunds} />
          </div>
          <div className="col-4 mb-4 mt-3">
            <ComparisonWidget />
          </div>
        </div>
      </div>

      <div className="row text-boxes">
        <div className="col-md-6">
          <div className="text-box text-box--rounder">
            <h2 className="text-box__title text-box__title--border-blue">
              Miks astuda Tuleva ühistu liikmeks?
            </h2>
            <div className="text-box__content">
              <ul className="list-style-plussign text-lg">
                <li>oled oma pensionifondi kaasomanik</li>
                <li>saad otsustada Tuleva tuleviku üle</li>
                <li>kogud igal aastal <span className="highlight">0,05% liikmeboonust</span>
                </li>
              </ul>
              <p><em>Pensioni kogumine on tänu liikmeboonusele veel soodsam.</em></p>
              <div className="text-center">
                <Link className={'btn btn-primary mb-2 mr-2'} to="/steps/signup">
                  <Message>newUserFlow.newUser.i.wish.to.join</Message>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {
          !userConverted ? (
            <div className="col-md-6">
              <div className="text-box text-box--rounder">
                <h2 className="text-box__title text-box__title--border-lightblue">
                  Miks koguda pensionit Tuleva fondidesse?
                </h2>
                <div className="text-box__content">
                  <ul className="list-style-checkmark text-lg">
                    <li>madalad kulud — rohkem jääb sulle</li>
                    <li>selged investeerimisreeglid</li>
                    <li>kogud raha endale, mitte pangale</li>
                  </ul>
                  <p className="lead"><em>
                    Tulevas pensioni kogumiseks <span className="highlight">
                    ei pea olema ühistu liige.</span>
                  </em></p>
                  <div className="text-center">
                    <Link className="btn btn-secondary mb-2" to="/steps/non-member">
                      <Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : ''
        }
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
};

NewUser.propTypes = {
  sourceFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  errorDescription: Types.string,
  userFirstName: Types.string,
  userConverted: Types.bool,
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  errorDescription: state.exchange.error,
  userFirstName: (state.login.user || {}).firstName,
  userConverted: (state.login.userConversion || {}).transfersComplete &&
    (state.login.userConversion || {}).selectionComplete,
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

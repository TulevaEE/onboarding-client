import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Loader, ErrorAlert } from '../../common/index';
import PensionFundTable from '../../onboardingFlow/selectSources/pensionFundTable/index';

export const NewUser = ({
  loadingSourceFunds,
  sourceFunds,
  errorDescription,
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
        <p className="mb-4 mt-5 lead">Tere Jaana!</p>
        <p>Veendu ise Tuleva kasulikkuses ja astu liikmeks.
          Või siis too pension üle oma netipangast ilma liikmeks astumata.</p>
        <p className="mb-4 mt-5 lead"><Message>select.sources.current.status</Message></p>
        <PensionFundTable funds={sourceFunds} />
        <p>
          Kui palju on osakute väärtus ja kui palju kulub teenustasudeks.
        </p>
      </div>
      <div className="mb-4">
        <p>Tuleva fondid on väga madalate kuludega.
          Liikmena säästad veel lisaks pensioniboonuse võrra.</p>
        <p>Võrdle, kui palju sa säästaksid Tuleva fondiga.<br />
          Kui astud liikmeks ja tood kogutud pensioni üle - arvutus<br />
          Kui tood pensioni üple ilma liikmseks astumata - arvutus
        </p>
      </div>

      <Link className={'btn btn-primary mb-2 mr-2'} to="/signup">
        <Message>newUserFlow.newUser.i.wish.to.join</Message>
      </Link>
      <Link className="btn btn-secondary mb-2" to="/non-member">
        <Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>
      </Link>
    </div>
  );
};

NewUser.defaultProps = {
  sourceFunds: [],
  targetFunds: [],
  loadingSourceFunds: false,
  errorDescription: '',
};

NewUser.propTypes = {
  sourceFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  errorDescription: Types.string,
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  errorDescription: ((state.exchange.error || {}).body || {}).error_description,
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

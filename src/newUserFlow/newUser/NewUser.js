import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import PensionFundTable from '../../onboardingFlow/selectSources/pensionFundTable';
import { Loader } from '../../common';

export const NewUser = ({
  sourceFunds,
  loadingSourceFunds,
}) => {
  if (loadingSourceFunds) {
    return <Loader className="align-middle" />;
  }
  return (
    <div>
      <div className="mb-4">
        <p className="mb-4 mt-5 lead">Tere Jaana!</p>
        <p>Veendu ise Tuleva kasulikkuses ja astu liikmeks.
          Või siis too pension üle oma netipangast ilma liikmeks astumata.</p>
        <p>Pensioni II samba tänane seis <br />
          Kui palju on osakute väärtus ja kui palju kulub teenustasudeks.
        </p>
        <div className="px-col mb-4">
          <p className="mb-4 mt-5 lead"><Message>select.sources.current.status</Message></p>
          <PensionFundTable funds={sourceFunds} />
        </div>
        <p>Tuleva fondid on väga madalate kuludega.
          Liikmena säästad veel lisaks pensioniboonuse võrra.</p>
        <p>Võrdle, kui palju sa säästaksid Tuleva fondiga.<br />
          Kui astud liikmeks ja tood kogutud pensioni üle - arvutus<br />
          Kui tood pensioni üple ilma liikmseks astumata - arvutus
        </p>
      </div>

      <Link className={'btn btn-primary mb-2 mr-2'} to="/signup">
        <Message>Soovin liituda</Message>
      </Link>
      <Link className="btn btn-secondary mb-2" to="/non-member">
        <Message>Toon lihtsalt pensioni Tulevasse</Message>
      </Link>
    </div>
  );
};

NewUser.defaultProps = {
  sourceFunds: [],
  loadingSourceFunds: false,
};

NewUser.propTypes = {
  sourceFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

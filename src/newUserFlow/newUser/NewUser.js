import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Loader, ErrorAlert } from '../../common/index';
import PensionFundTable from '../../onboardingFlow/selectSources/pensionFundTable/index';
import Comparison from '../../common/comparison';

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
        <p className="mb-4 mt-5 lead"><Message>select.sources.current.status</Message></p>
        <PensionFundTable funds={sourceFunds} />
      </div>
      <div className="px-col mb-4">
        <p className="lead">Kuidas mõjutab valitsemistasu sinu pensioni suurust?</p>

        <p>Täna maksad iga 1000 euro pealt valitsemistasuks pangale €13.40 aastas.
          Tulevas maksaksid €3.40. Esmapilgul pisikesed summad, eks?
          Aastate jooksul hammustab isegi näiliselt vaid natuke kõrgem
          valitsemistasu väga suure tüki sinu tulevasest pensionist.</p>

        <p>Arvuta, kui palju sa tänu Tulevale säästaksid.</p>

        <Comparison />

        <p>Tuleva pensionifondi kliendina võidaksid 20 000 eurot.<br />
          Kui astud ka Tuleva liikmeks, võidaksid lisaks veel 2000 eurot,
          sest liikmed saavad igal aastal liikmeboonust 0,05% oma pensionivara mahust.</p>

        <p>Tuleva pensionifondi kliendiks saavad tulla kõik Eesti inimesed, kes II sambasse koguvad.
          Et Tulevast kõige rohkem kasu saada ja toetada Eesti pensionisüsteemi arengut,
          kutsume sind astuma ka Tuleva liikmeks.</p>

      </div>

      <Link className={'btn btn-primary mb-2 mr-2'} to="/steps/signup">
        <Message>newUserFlow.newUser.i.wish.to.join</Message>
      </Link>
      {
        !userConverted ? (
          <Link className="btn btn-secondary mb-2" to="/steps/non-member">
            <Message>newUserFlow.newUser.i.want.just.to.transfer.my.pension</Message>
          </Link>
        ) : ''
      }
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

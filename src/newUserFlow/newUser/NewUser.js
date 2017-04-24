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
  userFirstName,
}) => {
  if (errorDescription) {
    return <ErrorAlert description={errorDescription} />;
  }
  if (loadingSourceFunds) {
    return <Loader className="align-middle" />;
  }

  return (
    <div>
      <div className="px-col mt-5">
        <p className="lead">
          <Message params={{ name: userFirstName }}>steps.welcome</Message>
        </p>
        <p className="lead">
          <Message>new.user.intro.salary</Message>
          &nbsp;
          <span className="col-xs-2">
            <input type="number" placeholder="1200" />
          </span>
          <Message params={{ fees: 123 }} >new.user.intro.old.funds.management.fee</Message>
          <Message params={{ fees: 12 }} >new.user.intro.new.funds.management.fee</Message>
        </p>
        <p className="lead">
          <Message params={{ fees: 9 }} >new.user.intro.member.bonus</Message>
        </p>
        <p className="lead">
          <Message
            params={{ nonMemberSavings: 30000, memberSavings: 40000 }}
          >new.user.intro.summary</Message>
        </p>
        <Link className={'btn btn-primary mb-2 mr-2'} to="#">
          <Message>new.user.intro.calc.link</Message>
        </Link>
      </div>

      <div className="px-col mb-4">
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
  userFirstName: '',
};

NewUser.propTypes = {
  sourceFunds: Types.arrayOf(Types.shape({})),
  loadingSourceFunds: Types.bool,
  errorDescription: Types.string,
  userFirstName: Types.string,
};

const mapStateToProps = state => ({
  sourceFunds: state.exchange.sourceFunds,
  loadingSourceFunds: state.exchange.loadingSourceFunds,
  errorDescription: ((state.exchange.error || {}).body || {}).error_description,
  userFirstName: (state.login.user || {}).firstName,
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

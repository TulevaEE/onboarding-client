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
      <div className="px-col mb-4">
        <p className="mb-4 mt-5 lead">
          <Message params={{ name: userFirstName }}>steps.welcome</Message>
        </p>
        <p><Message>new.user.flow.intro</Message></p>
        <p className="mb-4 mt-5 lead"><Message>select.sources.current.status</Message></p>
        <PensionFundTable funds={sourceFunds} />
      </div>
      <div className="mb-4">
        <p>
          <Message>new.user.flow.why</Message>
        </p>
        <p>
          <Message>new.user.flow.comparison</Message>
        </p>
      </div>

      <Link className={'btn btn-primary mb-2 mr-2'} to="/steps/signup">
        <Message>newUserFlow.newUser.i.wish.to.join</Message>
      </Link>
      <Link className="btn btn-secondary mb-2" to="/steps/non-member">
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
  errorDescription: state.exchange.error,
  userFirstName: (state.login.user || {}).firstName,
});

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(NewUser);

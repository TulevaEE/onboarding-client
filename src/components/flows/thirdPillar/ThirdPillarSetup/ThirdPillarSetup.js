import React from 'react';
import Types from 'prop-types';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { getAuthentication } from '../../../common/authenticationManager';
import { isTestMode } from '../../../common/test-mode';

export const ThirdPillarSetup = ({ nextPath, isThirdPillarActive, loading }) => {
  const isTestModeEnabled = isTestMode();
  if (loading) {
    return <Shimmer height={26} />;
  }
  return (
    <div>
      {!isTestModeEnabled && isThirdPillarActive && <Redirect to={nextPath} />}

      <p>
        <FormattedMessage id="thirdPillarFlowSetup.text" />
      </p>
      <p>
        <FormattedMessage id="thirdPillarFlowSetup.subtext" />
      </p>
      <div>
        <Link to={nextPath}>
          <button type="button" className="btn btn-primary mt-2">
            <FormattedMessage id="thirdPillarFlowSetup.buttonText" />
          </button>
        </Link>
      </div>
    </div>
  );
};

ThirdPillarSetup.propTypes = {
  nextPath: Types.string,
  isThirdPillarActive: Types.bool,
};

ThirdPillarSetup.defaultProps = {
  nextPath: '',
  isThirdPillarActive: false,
};

const mapStateToProps = (state) => ({
  isThirdPillarActive: !!(
    getAuthentication().isAuthenticated() &&
    state.login.user &&
    state.login.user.thirdPillarActive
  ),
  loading: state.login.loadingUser || state.login.loadingUserConversion,
});

export default connect(mapStateToProps)(ThirdPillarSetup);

import React from 'react';
import Types from 'prop-types';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

export const ThirdPillarSetup = ({ nextPath, isThirdPillarActive }) => (
  <div>
    {isThirdPillarActive && <Redirect to={nextPath} />}
    <p>
      <Message>thirdPillarFlowSetup.text</Message>
    </p>
    <p>
      <Message>thirdPillarFlowSetup.subtext</Message>
    </p>
    <div>
      <Link to={nextPath}>
        <button type="button" className="btn btn-primary mt-2">
          <Message>thirdPillarFlowSetup.buttonText</Message>
        </button>
      </Link>
    </div>
  </div>
);

ThirdPillarSetup.propTypes = {
  nextPath: Types.string,
  isThirdPillarActive: Types.bool,
};

ThirdPillarSetup.defaultProps = {
  nextPath: '',
  isThirdPillarActive: false,
};

const mapStateToProps = state => ({
  isThirdPillarActive: !!(
    state.login.token &&
    state.login.user &&
    state.login.user.thirdPillarActive
  ),
});

export default connect(mapStateToProps)(ThirdPillarSetup);

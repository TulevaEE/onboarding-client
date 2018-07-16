import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import mixpanel from 'mixpanel-browser';
import MixpanelProvider from 'react-mixpanel';
import config from 'react-global-configuration';

import { createUser } from '../../common/user/actions';
import { initializeConfiguration } from '../../config/config';

import InlineSignUpForm from './inlineSignUpForm';

initializeConfiguration();
mixpanel.init(config.get('mixpanelKey'));

export const InlineSignUp = ({ saveUser }) => (
  <MixpanelProvider mixpanel={mixpanel}>
    <InlineSignUpForm onSubmit={saveUser} />
  </MixpanelProvider>
);

const noop = () => null;

InlineSignUp.defaultProps = {
  saveUser: noop,
};

InlineSignUp.propTypes = {
  saveUser: Types.func,
};

const onCreateUser = user => dispatch => {
  mixpanel.track('INLINE_SIGNUP_CREATE_USER', user);
  return dispatch(createUser(user));
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      saveUser: onCreateUser,
    },
    dispatch,
  );

const connectToRedux = connect(
  null,
  mapDispatchToProps,
);

export default connectToRedux(InlineSignUp);

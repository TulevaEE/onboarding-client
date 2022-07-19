import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { createNewMember } from '../../common/user/actions';
import { initializeConfiguration } from '../../config/config';

import InlineSignUpForm from './inlineSignUpForm';

initializeConfiguration();

export const InlineSignUp = ({ saveUser }) => <InlineSignUpForm onSubmit={saveUser} />;

const noop = () => null;

InlineSignUp.defaultProps = {
  saveUser: noop,
};

InlineSignUp.propTypes = {
  saveUser: Types.func,
};

const onCreateUser = (user) => (dispatch) => {
  return dispatch(createNewMember(user));
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      saveUser: onCreateUser,
    },
    dispatch,
  );

const connectToRedux = connect(null, mapDispatchToProps);

export default connectToRedux(InlineSignUp);

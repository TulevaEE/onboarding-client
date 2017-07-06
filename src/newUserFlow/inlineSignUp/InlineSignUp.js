import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createUser } from '../../common/user/actions';

import InlineSignUpForm from './inlineSignUpForm';

export const InlineSignUp = ({ saveUser }) => (
  <InlineSignUpForm onSubmit={saveUser} />
);

const noop = () => null;

InlineSignUp.defaultProps = {
  saveUser: noop,
};

InlineSignUp.propTypes = {
  saveUser: Types.func,
};

const mapDispatchToProps = dispatch => bindActionCreators({
  saveUser: createUser,
}, dispatch);

const connectToRedux = connect(null, mapDispatchToProps);

export default connectToRedux(InlineSignUp);

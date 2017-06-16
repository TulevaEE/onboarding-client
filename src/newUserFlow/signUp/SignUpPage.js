import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { createNewUser } from '../actions';

import SignUpForm from './signUpForm';

export const SignUpPage = ({ createUser }) => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.signup.title</Message></p>
      <p><Message>new.user.flow.signup.intro</Message></p>

      <div className="row">
        <div className="col-6">
          <SignUpForm onSubmit={createUser} />
        </div>
      </div>

    </div>
  </div>
);

const noop = () => null;

SignUpPage.defaultProps = {
  createUser: noop,
};

SignUpPage.propTypes = {
  createUser: Types.func,
};

const mapDispatchToProps = dispatch => bindActionCreators({
  createUser: createNewUser,
}, dispatch);

const connectToRedux = connect(null, mapDispatchToProps);

export default connectToRedux(SignUpPage);

import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { registerUser } from '../../common/user/actions';

import InlineSignUpForm from './inlineSignUpForm';

export const InlineSignUpPage = ({ saveUser }) => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.signup.title</Message></p>
      <p><Message>new.user.flow.signup.intro</Message></p>

      <div className="row">
        <div className="col-6">
          <InlineSignUpForm onSubmit={saveUser} />
        </div>
      </div>

    </div>
  </div>
);

const noop = () => null;

InlineSignUpPage.defaultProps = {
  saveUser: noop,
};

InlineSignUpPage.propTypes = {
  saveUser: Types.func,
};

const mapDispatchToProps = dispatch => bindActionCreators({
  saveUser: registerUser,
}, dispatch);

const connectToRedux = connect(null, mapDispatchToProps);

export default connectToRedux(InlineSignUpPage);

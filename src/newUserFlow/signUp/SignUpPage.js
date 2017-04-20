import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createNewUser } from '../actions';

import SignUpForm from './signUpForm';

export const SignUpPage = ({ createUser }) => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead">Väga hea otsus</p>
      <p>Tuleva olulisemad tingimused</p>
      <p>Soovi korral saad lugeda kogu põhikirja</p>
      <p>Eeltäidetud väljad isikuandmetega</p>

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

import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { FormSubmitHandler } from 'redux-form';
import { Redirect } from 'react-router-dom';
import InlineSignUpForm from './inlineSignUp/inlineSignUpForm';
import { createNewMember } from '../common/user/actions';

export const SignUpPage: React.FunctionComponent<{
  saveUser: FormSubmitHandler;
  isMember: boolean;
}> = ({ saveUser, isMember }) => (
  <div className="row">
    {isMember && <Redirect to="/account" />}
    <div className="col-md-4">
      <InlineSignUpForm onSubmit={saveUser} />
    </div>
  </div>
);

const mapStateToProps = (state: {
  login: {
    user: { memberNumber: number };
  };
}) => ({
  isMember: (state.login.user || {}).memberNumber != null,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      saveUser: createNewMember,
    },
    dispatch,
  );

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(SignUpPage);

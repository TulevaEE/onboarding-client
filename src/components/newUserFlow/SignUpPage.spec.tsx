import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Redirect } from 'react-router-dom';
import { SignUpPage } from './SignUpPage';
import { ACCOUNT_PATH } from '../LoggedInApp';
import InlineSignUpForm from './inlineSignUp/inlineSignUpForm';

describe('Sign up page', () => {
  let component: ShallowWrapper;

  beforeEach(() => {
    component = shallow(<SignUpPage isMember saveUser={() => {}} />);
  });

  it('redirects to account page when already a member', () => {
    const redirects = () => component.contains(<Redirect to={ACCOUNT_PATH} />);

    component.setProps({ isMember: true });
    expect(redirects()).toBe(true);

    component.setProps({ isMember: false });
    expect(redirects()).toBe(false);
  });

  it('renders sign up form', () => {
    expect(component.find(InlineSignUpForm).length).toBe(1);
  });
});

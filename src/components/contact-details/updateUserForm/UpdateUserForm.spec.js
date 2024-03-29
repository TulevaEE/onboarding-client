import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from 'react-intl';
import { UpdateUserForm } from './UpdateUserForm';

describe('UpdateUserForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<UpdateUserForm {...props} />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders success message', () => {
    expect(component.contains(<FormattedMessage id="update.user.success.message" />)).toBe(false);

    const updateUserSuccess = true;
    component.setProps({ updateUserSuccess });
    expect(component.contains(<FormattedMessage id="update.user.success.message" />)).toBe(true);
  });

  it('renders children given to it', () => {
    const children = <div>child</div>;
    component.setProps({ children });
    expect(component.contains(children)).toBe(true);
  });

  it('disables submit button when submitting already in progress', () => {
    component.setProps({ submitting: true });
    expect(component.find('button').prop('disabled')).toBe(true);
  });
});

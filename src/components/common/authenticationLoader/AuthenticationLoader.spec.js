import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import AuthenticationLoader from './AuthenticationLoader';
import { Loader } from '..';

describe('Authenticaion loader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    component = shallow(<AuthenticationLoader {...props} />);
  });

  it('shows a loader', () => {
    expect(component.contains(<Loader className="align-middle" />)).toBe(true);
  });

  it('does not show the control code message if no control code given', () => {
    expect(component.contains(<FormattedMessage id="login.control.code" />)).toBe(false);
  });

  it('tells an ID-card signer to confirm with their PIN2', () => {
    const hint = <FormattedMessage id="id.card.signing.instruction" />;
    expect(component.contains(hint)).toBe(false);
    component.setProps({ signingWithIdCard: true });
    expect(component.contains(hint)).toBe(true);
  });

  it('renders as a modal when it is overlayed', () => {
    const isComponentModal = () => component.at(0).hasClass('tv-modal');
    expect(isComponentModal()).toBe(false);
    component.setProps({ overlayed: true });
    expect(isComponentModal()).toBe(true);
  });
});

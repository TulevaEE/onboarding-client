import React from 'react';
import { shallow } from 'enzyme';
import { screen } from '@testing-library/react';
import { GreetingBar } from './GreetingBar';
import { renderWrapped } from '../../../test/utils';
import { isInsidePii } from '../../tracking/piiMarkup';

describe('Greeting bar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: {
        firstName: 'first',
        lastName: 'last',
        email: 'email',
        phoneNumber: 'phoneNumber',
      },
    };
    component = shallow(<GreetingBar {...props} />);
  });
  it('renders greeting message', () => {
    const content = component.text();
    expect(content).toContain(props.user.firstName);
    expect(content).toContain(props.user.lastName);
    expect(content).toContain(props.user.email);
    expect(content).toContain(props.user.phoneNumber);
    expect(component.exists('Link')).toBe(true);
  });

  it('marks the name, email and phone number as personal data for analytics, but not the link', () => {
    renderWrapped(<GreetingBar {...props} />);

    expect(isInsidePii(screen.getByText(/first last/))).toBe(true);
    expect(isInsidePii(screen.getByText('email'))).toBe(true);
    expect(isInsidePii(screen.getByText('phoneNumber'))).toBe(true);
    expect(isInsidePii(screen.getByRole('link'))).toBe(false);
  });
});

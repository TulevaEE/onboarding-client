import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router-dom';

import MandateNotFilledAlert from './MandateNotFilledAlert';

describe('Confirm mandate step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<MandateNotFilledAlert />);
  });

  it('renders text about joining tuleva', () => {
    expect(
      component.contains([
        <p>
          <Message>confirm.mandate.not.filled.understand</Message>
        </p>,
        <p>
          <Message>confirm.mandate.not.filled.cheapest</Message>
        </p>,
        <p>
          <Message>confirm.mandate.not.filled.help</Message>
        </p>,
      ]),
    ).toBe(true);
  });

  it('renders a link to the first step to start again', () => {
    expect(
      component.contains(
        <Link to="/2nd-pillar-flow/select-sources">
          <Message>confirm.mandate.not.filled.look.again</Message>
        </Link>,
      ),
    ).toBe(true);
  });

  it('renders a link to the account page to think it over', () => {
    expect(
      component.contains(
        <Link to="/account">
          <Message>confirm.mandate.not.filled.thinking</Message>
        </Link>,
      ),
    ).toBe(true);
  });
});

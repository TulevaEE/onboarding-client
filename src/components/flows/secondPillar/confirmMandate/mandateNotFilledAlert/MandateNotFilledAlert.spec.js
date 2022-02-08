import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

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
          <FormattedMessage id="confirm.mandate.not.filled.understand" />
        </p>,
        <p>
          <FormattedMessage id="confirm.mandate.not.filled.cheapest" />
        </p>,
        <p>
          <FormattedMessage id="confirm.mandate.not.filled.help" />
        </p>,
      ]),
    ).toBe(true);
  });

  it('renders a link to the first step to start again', () => {
    expect(
      component.contains(
        <Link to="/2nd-pillar-flow/select-sources">
          <FormattedMessage id="confirm.mandate.not.filled.look.again" />
        </Link>,
      ),
    ).toBe(true);
  });

  it('renders a link to the account page to think it over', () => {
    expect(
      component.contains(
        <Link to="/account">
          <FormattedMessage id="confirm.mandate.not.filled.thinking" />
        </Link>,
      ),
    ).toBe(true);
  });
});

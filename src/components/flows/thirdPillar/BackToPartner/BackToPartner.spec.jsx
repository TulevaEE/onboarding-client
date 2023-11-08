import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { BackToPartner } from './BackToPartner';

describe('Third pillar success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<BackToPartner />);
  });

  it('shows the user default success message and profile button', () => {
    expect(component.contains(<FormattedMessage id="thirdPillarBackToPartner.opened" />)).toBe(
      true,
    );

    expect(
      component.contains(
        <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.button" />,
      ),
    ).toBe(true);
  });
});

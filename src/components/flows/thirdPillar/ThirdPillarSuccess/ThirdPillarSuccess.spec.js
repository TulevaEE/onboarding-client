import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { ThirdPillarSuccess } from './ThirdPillarSuccess';

describe('Third pillar success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ThirdPillarSuccess />);
  });

  it('shows the user default success message and profile button', () => {
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.done" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="thirdPillarSuccess.message" />)).toBe(true);
    expect(
      component.contains(
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="thirdPillarSuccess.button" />
        </a>,
      ),
    ).toBe(true);
  });
});

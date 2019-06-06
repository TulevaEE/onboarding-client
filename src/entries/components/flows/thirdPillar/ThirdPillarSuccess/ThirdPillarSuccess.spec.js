import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router-dom';

import { ThirdPillarSuccess } from './ThirdPillarSuccess';

describe('Third pillar success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ThirdPillarSuccess />);
  });

  it('shows the user default success message and profile button', () => {
    expect(component.contains(<Message>thirdPillarSuccess.done</Message>)).toBe(true);
    expect(component.contains(<Message>thirdPillarSuccess.message</Message>)).toBe(true);
    expect(
      component.contains(
        <Link className="btn btn-primary mt-4 profile-link" to="/account">
          <Message>thirdPillarSuccess.button</Message>
        </Link>,
      ),
    ).toBe(true);
  });
});

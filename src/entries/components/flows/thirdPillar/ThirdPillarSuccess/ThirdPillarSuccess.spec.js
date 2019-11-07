import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

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
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <Message>thirdPillarSuccess.button</Message>
        </a>,
      ),
    ).toBe(true);
  });
});

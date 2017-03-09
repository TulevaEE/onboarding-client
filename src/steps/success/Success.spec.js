import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { Success } from './Success';

describe('Success step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Success />);
  });

  it('shows the user info about their mandate', () => {
    expect(component.contains(<Message>success.done</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments</Message>)).toBe(true);
    expect(component.contains(<Message>success.your.payments.next.payment</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched</Message>)).toBe(true);
    expect(component.contains(<Message>success.shares.switched.when</Message>)).toBe(true);
  });
});

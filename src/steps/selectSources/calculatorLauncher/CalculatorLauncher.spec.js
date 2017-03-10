import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { CalculatorLauncher } from './CalculatorLauncher';

describe('Calculator launcher', () => {
  let component;
  beforeEach(() => {
    component = shallow(<CalculatorLauncher />);
  });

  it('renders main title and button', () => {
    expect(component.contains(<Message>select.sources.calc.launcher.title</Message>)).toBe(true);
    expect(component.contains(<Message>select.sources.calc.launcher.button</Message>)).toBe(true);
  });
});
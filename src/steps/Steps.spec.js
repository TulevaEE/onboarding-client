import React from 'react';
import { Message } from 'retranslate';
import { shallow } from 'enzyme';

import { Steps } from './Steps';
import StepTitle from './stepTitle';

describe('Steps', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Steps />);
  });

  it('renders the step given to it as step content', () => {
    const children = <div id="test-step">I am a test step</div>;
    component.setProps({ children });
    expect(component.contains(children)).toBe(true);
    expect(component.find('div#test-step').parent().prop('className')).toContain('tv-step__content');
  });

  it('renders the title of the step given to it as active', () => {
    component.setProps({ stepName: 'select-fund' });
    expect(component.contains(
      <StepTitle active number={2}>
        <Message>steps.select-fund</Message>
      </StepTitle>,
    )).toBe(true);
  });

  it('renders the titles of the steps before the given step as completed steps', () => {
    component.setProps({ stepName: 'transfer-future-capital' });
    expect(component.contains(
      <StepTitle completed number={1}>
        <Message>steps.select-exchange</Message>
      </StepTitle>,
    )).toBe(true);
    expect(component.contains(
      <StepTitle completed number={2}>
        <Message>steps.select-fund</Message>
      </StepTitle>,
    )).toBe(true);
  });

  it('renders the titles of the steps after the given step', () => {
    component.setProps({ stepName: 'select-fund' });
    expect(component.contains(
      <StepTitle number={3}>
        <Message>steps.transfer-future-capital</Message>
      </StepTitle>,
    )).toBe(true);
    expect(component.contains(
      <StepTitle number={4}>
        <Message>steps.confirm-application</Message>
      </StepTitle>,
    )).toBe(true);
  });
});

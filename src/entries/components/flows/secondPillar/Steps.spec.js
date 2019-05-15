import React from 'react';
import mixpanel from 'mixpanel-browser';
import { Message } from 'retranslate';
import { shallow } from 'enzyme';

import { Steps } from './Steps';
import StepTitle from './stepTitle';

describe('Steps', () => {
  let component;

  beforeEach(() => {
    mixpanel.track = jest.fn();
    component = shallow(<Steps />);
  });

  it('renders the step given to it as step content', () => {
    const children = <div id="test-step">I am a test step</div>;
    component.setProps({ children });
    expect(component.contains(children)).toBe(true);
  });

  it('renders the title of the step given to it as active', () => {
    component.setProps({
      stepName: 'select-sources',
      shortFlow: false,
    });
    expect(
      component.contains(
        <StepTitle active number={1}>
          <Message>steps.select-sources</Message>
        </StepTitle>,
      ),
    ).toBe(true);
  });

  it('when in short flow tender the step title without a number', () => {
    component.setProps({
      stepName: 'select-sources',
      shortFlow: true,
    });
    expect(
      component.contains(
        <StepTitle active>
          <Message>steps.select-sources</Message>
        </StepTitle>,
      ),
    ).toBe(true);
  });

  it('renders the titles of the steps before the given step as completed steps', () => {
    component.setProps({
      stepName: 'confirm-mandate',
      shortFlow: false,
    });
    expect(
      component.contains(
        <StepTitle completed number={1}>
          <Message>steps.select-sources</Message>
        </StepTitle>,
      ),
    ).toBe(true);
    expect(
      component.contains(
        <StepTitle completed number={2}>
          <Message>steps.transfer-future-capital</Message>
        </StepTitle>,
      ),
    ).toBe(true);
  });

  it('skips rendering previous steps when short flow is false', () => {
    component.setProps({
      stepName: 'confirm-mandate',
      shortFlow: true,
    });
    expect(
      component.contains(
        <StepTitle completed number={1}>
          <Message>steps.select-sources</Message>
        </StepTitle>,
      ),
    ).toBe(false);
    expect(
      component.contains(
        <StepTitle completed number={2}>
          <Message>steps.transfer-future-capital</Message>
        </StepTitle>,
      ),
    ).toBe(false);
  });

  it('renders the titles of the steps after the given step', () => {
    component.setProps({ stepName: 'select-sources' });
    expect(
      component.contains(
        <StepTitle number={2}>
          <Message>steps.transfer-future-capital</Message>
        </StepTitle>,
      ),
    ).toBe(true);
    expect(
      component.contains(
        <StepTitle number={3}>
          <Message>steps.confirm-mandate</Message>
        </StepTitle>,
      ),
    ).toBe(true);
  });

  it('renders a vertical line in the bottom for all but the last step', () => {
    ['select-sources', 'select-target-fund', 'transfer-future-capital'].forEach(stepName => {
      component.setProps({ stepName });
      expect(component.contains(<hr className="mb-4" />)).toBe(true);
    });

    component.setProps({ stepName: 'confirm-mandate' });
    expect(component.contains(<hr className="mb-4" />)).toBe(false);
  });

  it('tracks step changes', () => {
    const stepName = 'select-sources';
    component.setProps({ stepName });
    expect(mixpanel.track).toHaveBeenCalledWith(`ONBOARDING_STEP_${stepName}`);
  });
});

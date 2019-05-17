import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import mixpanel from 'mixpanel-browser';

import { Flow } from './Flow';
import StepTitle from './StepTitle';

jest.mock('mixpanel-browser', () => ({
  track: jest.fn(),
}));

const FirstComponent = () => <div>First</div>;
const SecondComponent = () => <div>Second</div>;
const ThirdComponent = () => <div>Third</div>;
const FourthComponent = () => <div>Fourth</div>;

describe('Flow', () => {
  let component;
  let steps;
  beforeEach(() => {
    steps = [
      {
        path: 'first-step',
        Component: FirstComponent,
        title: <Message>first.title</Message>,
      },
      {
        path: 'second-step',
        Component: SecondComponent,
        title: <Message>second.title</Message>,
      },
      {
        path: 'third-step',
        Component: ThirdComponent,
        title: <Message>third.title</Message>,
      },
      {
        path: 'fourth-step',
        Component: FourthComponent,
      },
    ];
    component = shallow(<Flow name="SOME_FLOW" flowPath="/a-flow" steps={steps} />);
  });

  it('sets window.useHackySecondPillarRoutePushesInActions to whether flow name is SECOND_PILLAR on mount', () => {
    expect(window.useHackySecondPillarRoutePushesInActions).toBe(false);
    component = shallow(<Flow name="SECOND_PILLAR" flowPath="/a-flow" steps={steps} />);
    expect(window.useHackySecondPillarRoutePushesInActions).toBe(true);
  });

  it('sends a mixpanel event on every render with flow name and step path', () => {
    jest.resetAllMocks();

    expect(mixpanel.track).not.toBeCalled();

    component.setProps({ lastPartOfPath: 'not-a-step-path' });
    expect(mixpanel.track).toBeCalledWith('SOME_FLOW_first-step');

    component.setProps({ lastPartOfPath: 'first-step' });
    expect(mixpanel.track).toBeCalledWith('SOME_FLOW_first-step');

    component.setProps({ lastPartOfPath: 'second-step' });
    expect(mixpanel.track).toBeCalledWith('SOME_FLOW_second-step');
  });

  it('has intro message when passed and on first step', () => {
    const introMessage = <Message>steps.intro</Message>;

    const hasIntro = () => component.contains(introMessage);

    component.setProps({ introMessage: null });
    component.setProps({ lastPartOfPath: 'second-step' });
    expect(hasIntro()).toBe(false);
    component.setProps({ lastPartOfPath: 'first-step' });
    expect(hasIntro()).toBe(false);

    component.setProps({ introMessage });
    component.setProps({ lastPartOfPath: 'second-step' });
    expect(hasIntro()).toBe(false);
    component.setProps({ lastPartOfPath: 'first-step' });
    expect(hasIntro()).toBe(true);
  });

  it('has completed step titles with numbers and titles', () => {
    const completedTitles = () =>
      component.find(StepTitle).filterWhere(title => title.prop('completed'));

    component.setProps({ lastPartOfPath: 'first-step' });
    expect(completedTitles()).toHaveLength(0);

    component.setProps({ lastPartOfPath: 'third-step' });
    expect(completedTitles().map(title => title.prop('number'))).toEqual([1, 2]);
    expect(completedTitles().map(title => title.prop('children'))).toEqual([
      <Message>first.title</Message>,
      <Message>second.title</Message>,
    ]);
  });

  it('has current step title with number and title', () => {
    component.setProps({ lastPartOfPath: 'third-step' });

    const activeTitle = component.find(StepTitle).filterWhere(title => title.prop('active'));

    expect(activeTitle).toHaveLength(1);
    expect(activeTitle.prop('number')).toBe(3);
    expect(activeTitle.prop('children')).toEqual(<Message>third.title</Message>);
  });

  it('has component for current path', () => {
    component.setProps({ lastPartOfPath: 'third-step' });

    const route = component.find(Route);

    expect(route.prop('path')).toBe('/a-flow/third-step');
    expect(route.prop('component')).toBe(ThirdComponent);
  });

  it('redirects from path root to step path', () => {
    component.setProps({ lastPartOfPath: 'third-step' });

    const redirect = component.find(Redirect);

    expect(redirect.prop('path')).toBe('/a-flow');
    expect(redirect.prop('to')).toBe('/a-flow/third-step');
  });

  it('has divider for every step but last', () => {
    const hasDivider = () => component.find('hr').exists();

    component.setProps({ lastPartOfPath: 'third-step' });
    expect(hasDivider()).toBe(true);
    component.setProps({ lastPartOfPath: 'fourth-step' });
    expect(hasDivider()).toBe(false);
  });

  it('has after step titles with numbers and titles for steps with title', () => {
    const afterTitles = () =>
      component
        .find(StepTitle)
        .filterWhere(title => !title.prop('completed') && !title.prop('active'));

    component.setProps({ lastPartOfPath: 'second-step' });
    expect(afterTitles().map(title => title.prop('number'))).toEqual([3]);
    expect(afterTitles().map(title => title.prop('children'))).toEqual([
      <Message>third.title</Message>,
    ]);

    component.setProps({ lastPartOfPath: 'fourth-step' });
    expect(afterTitles()).toHaveLength(0);
  });
});

import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { Flow } from './Flow';
import StepTitle from './StepTitle';

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
        title: <FormattedMessage id="first.title" />,
      },
      {
        path: 'second-step',
        Component: SecondComponent,
        title: <FormattedMessage id="second.title" />,
      },
      {
        path: 'third-step',
        Component: ThirdComponent,
        title: <FormattedMessage id="third.title" />,
      },
      {
        path: 'fourth-step',
        Component: FourthComponent,
      },
    ];
    component = shallow(<Flow flowPath="/a-flow" steps={steps} />);
  });

  it('has completed step titles with numbers and titles', () => {
    const completedTitles = () =>
      component.find(StepTitle).filterWhere((title) => title.prop('completed'));

    component.setProps({ lastPartOfPath: 'first-step' });
    expect(completedTitles()).toHaveLength(0);

    component.setProps({ lastPartOfPath: 'third-step' });
    expect(completedTitles().map((title) => title.prop('number'))).toEqual([1, 2]);
    expect(completedTitles().map((title) => title.prop('children'))).toEqual([
      <FormattedMessage id="first.title" />,
      <FormattedMessage id="second.title" />,
    ]);
  });

  it('has current step title with number and title', () => {
    component.setProps({ lastPartOfPath: 'third-step' });

    const activeTitle = component.find(StepTitle).filterWhere((title) => title.prop('active'));

    expect(activeTitle).toHaveLength(1);
    expect(activeTitle.prop('number')).toBe(3);
    expect(activeTitle.prop('children')).toEqual(<FormattedMessage id="third.title" />);
  });

  it('has component for current path', () => {
    component.setProps({ lastPartOfPath: 'third-step' });

    const route = component.find(Route);

    expect(route.prop('path')).toBe('/a-flow/third-step');
    expect(route.prop('render')).toBe(ThirdComponent);
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
        .filterWhere((title) => !title.prop('completed') && !title.prop('active'));

    component.setProps({ lastPartOfPath: 'second-step' });
    expect(afterTitles().map((title) => title.prop('number'))).toEqual([3]);
    expect(afterTitles().map((title) => title.prop('children'))).toEqual([
      <FormattedMessage id="third.title" />,
    ]);

    component.setProps({ lastPartOfPath: 'fourth-step' });
    expect(afterTitles()).toHaveLength(0);
  });
});

import React from 'react';
import { shallow } from 'enzyme';

import StepTitle from './StepTitle';

describe('Step title', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StepTitle />);
  });

  it('renders children given to it as muted text', () => {
    const children = <div id="test-child">I am a child.</div>;
    component.setProps({ children });
    const childClass = () =>
      component
        .find('div#test-child')
        .parent()
        .prop('className');
    expect(childClass()).not.toContain('h2');
    expect(childClass()).toContain('text-muted');
    expect(component.contains(children)).toBe(true);
  });

  it('renders children given to it as a heading when active', () => {
    const children = <div id="test-child">I am a child.</div>;
    component.setProps({ children, active: true });
    const childClass = () =>
      component
        .find('div#test-child')
        .parent()
        .prop('className');
    expect(childClass()).toContain('h2');
    expect(childClass()).not.toContain('text-muted');
    expect(component.contains(children)).toBe(true);
  });

  it('sets the title as active when component active', () => {
    const titleClass = () => component.find('div.tv-step__title').prop('className');
    expect(titleClass()).not.toContain('tv-step__title--active');
    component.setProps({ active: true });
    expect(titleClass()).toContain('tv-step__title--active');
  });

  it('sets the title as completed when component completed', () => {
    const titleClass = () => component.find('div.tv-step__title').prop('className');
    expect(titleClass()).not.toContain('tv-step__title--completed');
    component.setProps({ completed: true });
    expect(titleClass()).toContain('tv-step__title--completed');
  });

  it('shows the step number unless it is completed', () => {
    component.setProps({ number: 1 });
    expect(component.text()).toContain('1');
    component.setProps({ completed: true });
    expect(component.text()).not.toContain('1');
  });
});

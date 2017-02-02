import React from 'react';
import { shallow } from 'enzyme';

import Radio from './Radio';

describe('Radio', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Radio name="test-radio" />);
  });

  it('renders a hidden input that keeps and changes state', () => {
    const hiddenInput = () => component.find('input');
    expect(hiddenInput().prop('className')).toContain('sr-only');
    expect(hiddenInput().prop('name')).toBe('test-radio');
    expect(hiddenInput().prop('checked')).toBe(false);
    const onSelect = jest.fn();
    component.setProps({ selected: true, onSelect });
    expect(hiddenInput().prop('checked')).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    hiddenInput().simulate('change');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(false);
  });

  it('has a button that can also be clicked to change state', () => {
    const onSelect = jest.fn();
    component.setProps({ onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(true);
  });

  it('sets it to selected when the component is selected', () => {
    const componentSelected = () => component.find('div.tv-radio').hasClass('tv-radio--selected');
    expect(componentSelected()).toBe(false);
    component.setProps({ selected: true });
    expect(componentSelected()).toBe(true);
  });

  it('passes className to the main div', () => {
    expect(component.find('div.tv-radio').hasClass('test-class')).toBe(false);
    component.setProps({ className: 'test-class' });
    expect(component.find('div.tv-radio').hasClass('test-class')).toBe(true);
  });
});

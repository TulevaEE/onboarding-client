import React from 'react';
import { shallow } from 'enzyme';

import Radio from './Radio';

describe('Radio', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Radio name="test-radio" id="an-id" />);
  });

  it('renders a hidden input that keeps and changes state', () => {
    const hiddenInput = () => component.find('input');
    expect(hiddenInput().prop('className')).toContain('sr-only');
    expect(hiddenInput().prop('name')).toBe('test-radio');
    const onSelect = jest.fn();
    component.setProps({ selected: false, onSelect });
    expect(hiddenInput().prop('checked')).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
    hiddenInput().simulate('change');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(true);
    component.setProps({ selected: true });
    expect(hiddenInput().prop('checked')).toBe(true);
  });

  it('can not be changed by clicking it again', () => {
    const onSelect = jest.fn();
    component.setProps({ selected: true, onSelect });
    component.find('button').simulate('click');
    expect(onSelect).not.toHaveBeenCalled();
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
    const componentSelected = () => component.find('.tv-radio').hasClass('tv-radio--selected');
    expect(componentSelected()).toBe(false);
    component.setProps({ selected: true });
    expect(componentSelected()).toBe(true);
  });

  it('passes className to the main div', () => {
    expect(component.find('.tv-radio').hasClass('test-class')).toBe(false);
    component.setProps({ className: 'test-class' });
    expect(component.find('.tv-radio').hasClass('test-class')).toBe(true);
  });

  it('renders children given to it', () => {
    const children = <div>I am a child yo</div>;
    component.setProps({ children });
    expect(component.contains(children)).toBe(true);
  });

  it('adds passed id to input and as label for to allow selecting radio on label click', () => {
    component.setProps({ id: 'an-id' });
    expect(component.find('input').prop('id')).toBe('an-id');
    expect(component.find('label').prop('htmlFor')).toBe('an-id');
  });
});

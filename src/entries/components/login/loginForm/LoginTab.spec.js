import React from 'react';
import { shallow } from 'enzyme';
import LoginTab from './LoginTab';

describe('Login Tab', () => {
  it('should contain active button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(<LoginTab label="Smart ID" activeTab="Smart ID" onClick={onClick} />);
    expect(wrapper.find('.tab-list-item').hasClass('tab-list-active')).toBe(true);
  });
  it('should contain inactive button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(<LoginTab label="Mobile ID" activeTab="Smart ID" onClick={onClick} />);
    expect(wrapper.find('.tab-list-item').hasClass('tab-list-active')).toBe(false);
  });
});

import React from 'react';
import { shallow } from 'enzyme';
import LoginTab from './LoginTab';

describe('Login Tab', () => {
  it('should contain active button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(<LoginTab label="Smart ID" activeTab="Smart ID" onClick={onClick} />);
    expect(wrapper.find('.nav-link').hasClass('active')).toBe(true);
  });
  it('should contain inactive button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(<LoginTab label="Mobile ID" activeTab="Smart ID" onClick={onClick} />);
    expect(wrapper.find('.nav-link').hasClass('active')).toBe(false);
  });
  it('should contain hidden button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(
      <LoginTab label="Smart ID" hideOnMobile activeTab="Smart ID" onClick={onClick} />,
    );
    expect(wrapper.find('.nav-link').hasClass('d-md-block')).toBe(true);
  });
});

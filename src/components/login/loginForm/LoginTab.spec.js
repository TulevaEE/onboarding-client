import React from 'react';
import { shallow } from 'enzyme';
import LoginTab from './LoginTab';

describe('Login Tab', () => {
  it('should contain active button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(
      <LoginTab label="Smart ID" hideOnMobile="false" activeTab="Smart ID" onClick={onClick} />,
    );
    expect(wrapper.find('.nav-link').hasClass('active')).toBe(true);
  });
  it('should contain inactive button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(
      <LoginTab label="Mobile ID" hideOnMobile="false" activeTab="Smart ID" onClick={onClick} />,
    );
    expect(wrapper.find('.nav-link').hasClass('active')).toBe(false);
  });
  it('should contain hidden button', () => {
    const onClick = jest.fn();
    const wrapper = shallow(
      <LoginTab label="Smart ID" hideOnMobile="true" activeTab="Smart ID" onClick={onClick} />,
    );
    expect(wrapper.find('.nav-link').hasClass('d-md-block')).toBe(true);
  });
});

import React from 'react';
import { shallow } from 'enzyme';
import LoginTabs from './LoginTabs';

describe('Login Tabs', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <LoginTabs>
        <div label="Smart ID" />
        <div label="Mobile ID" />
        <div label="Id Card" />
      </LoginTabs>,
    );
  });

  it('should make first tab active', () => {
    const activeItem = component.find('ol').children().first().prop('activeTab');
    expect(activeItem).toBe('Smart ID');
  });
});

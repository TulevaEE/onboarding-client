import React from 'react';
import { shallow } from 'enzyme';
import LoginTabs from './LoginTabs';

describe('Login Tabs', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <LoginTabs>
        <div label="Smart ID"></div>
        <div label="Mobile ID"></div>
        <div label="Id Card"></div>
      </LoginTabs>,
    );
  });

  it('should make first tab active', () => {
    const activeItem = component
      .find('ol')
      .children()
      .first()
      .prop('activeTab');
    expect(activeItem).toBe('Smart ID');
  });
});

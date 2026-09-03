import React from 'react';
import { shallow } from 'enzyme';
import LoginTabs from './LoginTabs';

describe('Login Tabs', () => {
  const renderTabs = () =>
    shallow(
      <LoginTabs>
        <div label="Smart ID" />
        <div label="Mobile ID" />
        <div label="Id Card" />
      </LoginTabs>,
    );

  const activeTab = (component) => component.find('ul').children().first().prop('activeTab');

  beforeEach(() => {
    localStorage.clear();
  });

  it('should make first tab active', () => {
    expect(activeTab(renderTabs())).toBe('Smart ID');
  });

  it('remembers the tab the user picked for the next visit', () => {
    const component = renderTabs();

    component.find('ul').children().at(1).prop('onClick')('Mobile ID');

    expect(activeTab(component)).toBe('Mobile ID');
    expect(activeTab(renderTabs())).toBe('Mobile ID');
  });

  it('falls back to the first tab when the remembered one no longer exists', () => {
    localStorage.setItem('preferredLoginMethod', 'Carrier pigeon');

    expect(activeTab(renderTabs())).toBe('Smart ID');
  });
});

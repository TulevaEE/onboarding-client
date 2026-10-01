import React from 'react';
import { shallow } from 'enzyme';
import LoginTabs from './LoginTabs';

const TabHiddenOnMobile = () => null;

describe('Login Tabs', () => {
  const renderTabs = () =>
    shallow(
      <LoginTabs>
        <div label="Smart ID" />
        <div label="Mobile ID" />
        <TabHiddenOnMobile label="Id Card" hideOnMobile />
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

  const atViewportWidth = (width) => {
    window.matchMedia = (query) => ({
      matches: Number(/min-width:\s*(\d+)px/.exec(query)[1]) <= width,
      addListener: () => undefined,
      removeListener: () => undefined,
    });
  };

  it('opens the remembered tab when it is visible at this width', () => {
    atViewportWidth(1280);
    localStorage.setItem('preferredLoginMethod', 'Id Card');

    expect(activeTab(renderTabs())).toBe('Id Card');
  });

  it('falls back to the first tab when the remembered one is hidden at this width', () => {
    atViewportWidth(390);
    localStorage.setItem('preferredLoginMethod', 'Id Card');

    expect(activeTab(renderTabs())).toBe('Smart ID');
  });
});

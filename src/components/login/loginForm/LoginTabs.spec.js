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

  it('sets the tabs apart with 32 px under the heading on a phone and 48 px on wider screens, and 32 px down to the login', () => {
    const component = renderTabs();
    const tabList = component.find('ul');

    ['mt-4', 'pt-2', 'mt-sm-5', 'pt-sm-0', 'mb-4'].forEach((spacing) =>
      expect(tabList.hasClass(spacing)).toBe(true),
    );
    expect(component.find('.tab-content').hasClass('pt-2')).toBe(true);
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

  it('tells about a tab change only when another tab is picked', () => {
    const onTabChange = jest.fn();
    const component = shallow(
      <LoginTabs onTabChange={onTabChange}>
        <div label="Smart ID" />
        <div label="Mobile ID" />
      </LoginTabs>,
    );
    const clickTab = (index, label) =>
      component.find('ul').children().at(index).prop('onClick')(label);

    clickTab(0, 'Smart ID');
    expect(onTabChange).not.toHaveBeenCalled();

    clickTab(1, 'Mobile ID');
    expect(onTabChange).toHaveBeenCalledTimes(1);
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

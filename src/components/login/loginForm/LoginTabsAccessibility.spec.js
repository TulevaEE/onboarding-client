import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import LoginTabs from './LoginTabs';

const atViewportWidth = (width) => {
  window.matchMedia = (query) => ({
    matches: Number(/min-width:\s*(\d+)px/.exec(query)[1]) <= width,
    addListener: () => undefined,
    removeListener: () => undefined,
  });
};

describe('LoginTabs for keyboard and screen reader users', () => {
  const originalMatchMedia = window.matchMedia;
  const onTabChange = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    onTabChange.mockClear();
    atViewportWidth(1280);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const renderTabs = () =>
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <LoginTabs onTabChange={onTabChange}>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.smart.id">
            <button type="button">Smart-ID content</button>
          </div>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.mobile.id">
            <button type="button">Mobile-ID content</button>
          </div>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.id.card" hideOnMobile>
            <button type="button">ID-card content</button>
          </div>
        </LoginTabs>
      </IntlProvider>,
    );

  const tab = (name) => screen.getByRole('tab', { name });

  it('tells which tab is open', () => {
    renderTabs();

    expect(tab('Smart-ID')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Mobile-ID')).toHaveAttribute('aria-selected', 'false');
    expect(tab('ID-card')).toHaveAttribute('aria-selected', 'false');
  });

  it('names the panel after the open tab, and every tab points at that panel', () => {
    renderTabs();
    userEvent.click(tab('Mobile-ID'));

    const panel = screen.getByRole('tabpanel', { name: 'Mobile-ID' });
    expect(panel).toHaveAttribute('id');
    ['Smart-ID', 'Mobile-ID', 'ID-card'].forEach((name) =>
      expect(tab(name)).toHaveAttribute('aria-controls', panel.id),
    );
  });

  it('reaches only the open tab with Tab, and then the content of its panel', () => {
    renderTabs();
    userEvent.click(tab('Mobile-ID'));
    document.activeElement.blur();

    userEvent.tab();
    expect(tab('Mobile-ID')).toHaveFocus();

    userEvent.tab();
    expect(screen.getByRole('button', { name: 'Mobile-ID content' })).toHaveFocus();
  });

  it('moves between the tabs with the arrow keys, round from the last to the first', () => {
    renderTabs();
    tab('Smart-ID').focus();

    userEvent.keyboard('{arrowright}');
    expect(tab('Mobile-ID')).toHaveFocus();

    userEvent.keyboard('{arrowright}');
    expect(tab('ID-card')).toHaveFocus();

    userEvent.keyboard('{arrowright}');
    expect(tab('Smart-ID')).toHaveFocus();

    userEvent.keyboard('{arrowleft}');
    expect(tab('ID-card')).toHaveFocus();
  });

  it('moves to the first tab with Home and to the last with End', () => {
    renderTabs();
    tab('Mobile-ID').focus();

    userEvent.keyboard('{end}');
    expect(tab('ID-card')).toHaveFocus();

    userEvent.keyboard('{home}');
    expect(tab('Smart-ID')).toHaveFocus();
  });

  it('skips the tab that is not shown at this width', () => {
    atViewportWidth(390);
    renderTabs();
    tab('Smart-ID').focus();

    userEvent.keyboard('{end}');
    expect(tab('Mobile-ID')).toHaveFocus();

    userEvent.keyboard('{arrowright}');
    expect(tab('Smart-ID')).toHaveFocus();
  });

  it('opens the tab an arrow key moved to only when they press Enter, so a login in progress is not stopped by looking around', () => {
    renderTabs();
    tab('Smart-ID').focus();

    userEvent.keyboard('{arrowright}');
    expect(tab('Smart-ID')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Smart-ID content')).toBeInTheDocument();
    expect(onTabChange).not.toHaveBeenCalled();

    userEvent.keyboard('{enter}');
    expect(tab('Mobile-ID')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Mobile-ID content')).toBeInTheDocument();
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });
});

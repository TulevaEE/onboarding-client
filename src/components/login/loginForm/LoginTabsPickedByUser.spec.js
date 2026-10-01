import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import LoginTabs from './LoginTabs';
import { LoginTabPickedByUser } from './loginTabPickedByUser';

const PickedByUser = () => <output>{String(useContext(LoginTabPickedByUser))}</output>;

describe('LoginTabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderTabs = () =>
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <LoginTabs>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.smart.id">
            <PickedByUser />
          </div>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <div label="login.mobile.id">
            <PickedByUser />
          </div>
        </LoginTabs>
      </IntlProvider>,
    );

  it('tells the tab shown when the page opens that nobody picked it', () => {
    renderTabs();

    expect(screen.getByRole('status')).toHaveTextContent('false');
  });

  it('tells a tab the user opened that the user picked it', () => {
    renderTabs();

    userEvent.click(screen.getByText('Mobile-ID'));

    expect(screen.getByRole('status')).toHaveTextContent('true');
  });
});

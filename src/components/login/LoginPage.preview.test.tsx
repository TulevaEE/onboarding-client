import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { createDefaultStore, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { getAuthentication } from '../common/authenticationManager';
import { isChildOnboardingEnabled } from '../flows/savingsAccount/SavingsFundOnboarding/onboardingFlows';
// eslint-disable-next-line import/no-named-as-default
import LoginPage, { loginPath } from './LoginPage';

jest.unmock('react-intl');

describe('When landing on the login page via an onboarding preview link', () => {
  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().remove();
  });

  afterEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  function renderLoginPage() {
    const history = createMemoryHistory({ initialEntries: [loginPath] });
    renderWrapped(
      <Switch>
        <Route exact path="/" render={() => <h1>Mock account page</h1>} />
        <Route exact path={loginPath} component={LoginPage} />
      </Switch>,
      history as any,
      createDefaultStore(history as any),
    );
  }

  it('captures ?childOnboardingPreview=true so the child flow stays enabled after login', () => {
    expect(isChildOnboardingEnabled()).toBe(false);

    window.history.pushState({}, '', `${loginPath}?childOnboardingPreview=true`);
    renderLoginPage();

    // The post-login redirect keeps only the pathname, but the login page already
    // captured the flag, so the child flow is enabled for the rest of the session.
    window.history.pushState({}, '', '/savings-fund/onboarding/child');
    expect(isChildOnboardingEnabled()).toBe(true);
  });

  it('does not enable the child flow without the preview parameter', () => {
    window.history.pushState({}, '', loginPath);
    renderLoginPage();

    expect(isChildOnboardingEnabled()).toBe(false);
  });
});

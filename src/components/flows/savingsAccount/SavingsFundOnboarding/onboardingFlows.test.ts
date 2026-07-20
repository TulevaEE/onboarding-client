import {
  captureOnboardingPreviewFlags,
  getOnboardingFlowOptions,
  isChildOnboardingEnabled,
  isCompanyOnboardingEnabled,
} from './onboardingFlows';

describe('isCompanyOnboardingEnabled', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('is enabled now that company onboarding has launched', () => {
    expect(isCompanyOnboardingEnabled()).toBe(true);
  });

  it('stays enabled even when the preview parameter is turned off', () => {
    window.history.pushState({}, '', '/?companyOnboardingPreview=false');

    expect(isCompanyOnboardingEnabled()).toBe(true);
  });
});

describe('isChildOnboardingEnabled', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('is hidden by default (not launched)', () => {
    expect(isChildOnboardingEnabled()).toBe(false);
  });

  it('turns on for the session via ?childOnboardingPreview=true', () => {
    window.history.pushState({}, '', '/?childOnboardingPreview=true');

    expect(isChildOnboardingEnabled()).toBe(true);

    // Stays on after navigating away from the preview URL (session-scoped).
    window.history.pushState({}, '', '/savings-fund/onboarding');
    expect(isChildOnboardingEnabled()).toBe(true);
  });

  it('turns back off with ?childOnboardingPreview=false', () => {
    window.history.pushState({}, '', '/?childOnboardingPreview=true');
    expect(isChildOnboardingEnabled()).toBe(true);

    window.history.pushState({}, '', '/?childOnboardingPreview=false');
    expect(isChildOnboardingEnabled()).toBe(false);
  });
});

describe('captureOnboardingPreviewFlags', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('persists the child preview so it survives the login round-trip', () => {
    // A logged-out user enters on a preview link and is routed to /login with the
    // query string preserved; the login page captures it before authenticating.
    window.history.pushState({}, '', '/login?childOnboardingPreview=true');
    captureOnboardingPreviewFlags();

    // The post-login redirect keeps only the pathname, dropping the query string.
    // The flag must still be on because it was captured before the redirect.
    window.history.pushState({}, '', '/savings-fund/onboarding/child');
    expect(isChildOnboardingEnabled()).toBe(true);
  });

  it('leaves the child preview off when no preview parameter is present', () => {
    window.history.pushState({}, '', '/login');
    captureOnboardingPreviewFlags();

    expect(isChildOnboardingEnabled()).toBe(false);
  });
});

describe('getOnboardingFlowOptions', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('enables the person and company flows, keeping child hidden by default', () => {
    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
      { key: 'company', route: '/savings-fund/onboarding/company', enabled: true },
      { key: 'child', route: '/savings-fund/onboarding/child', enabled: false },
    ]);
  });

  it('enables the child flow when its preview is on', () => {
    window.history.pushState({}, '', '/?childOnboardingPreview=true');

    expect(getOnboardingFlowOptions()).toContainEqual({
      key: 'child',
      route: '/savings-fund/onboarding/child',
      enabled: true,
    });
  });
});

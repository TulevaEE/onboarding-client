import {
  captureOnboardingPreviewFlags,
  getOnboardingFlowOptions,
  isChildOnboardingEnabled,
  isCompanyOnboardingEnabled,
} from './onboardingFlows';

describe('isCompanyOnboardingEnabled', () => {
  it('is enabled now that company onboarding has launched', () => {
    expect(isCompanyOnboardingEnabled()).toBe(true);
  });
});

describe('isChildOnboardingEnabled', () => {
  it('is enabled now that child onboarding has launched', () => {
    expect(isChildOnboardingEnabled()).toBe(true);
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
  it('enables the person, company, and child flows now that all have launched', () => {
    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
      { key: 'company', route: '/savings-fund/onboarding/company', enabled: true },
      { key: 'child', route: '/savings-fund/onboarding/child', enabled: true },
    ]);
  });
});

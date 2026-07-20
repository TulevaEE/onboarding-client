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

  it('captures the child preview at boot so it survives the login round-trip', () => {
    // Enter on a preview link (?childOnboardingPreview=true) while logged out —
    // the app boots on that URL before redirecting to /login.
    window.history.pushState({}, '', '/savings-fund/onboarding/child?childOnboardingPreview=true');
    captureOnboardingPreviewFlags();

    // After login the app redirects to the pathname only, dropping the query
    // string. The flag must still be on because boot captured it.
    window.history.pushState({}, '', '/savings-fund/onboarding/child');
    expect(isChildOnboardingEnabled()).toBe(true);
  });

  it('leaves the child preview off when no preview parameter was present at boot', () => {
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

import {
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

  it('is enabled now that child onboarding has launched', () => {
    expect(isChildOnboardingEnabled()).toBe(true);
  });

  it('stays enabled even when the preview parameter is turned off', () => {
    window.history.pushState({}, '', '/?childOnboardingPreview=false');

    expect(isChildOnboardingEnabled()).toBe(true);
  });
});

describe('getOnboardingFlowOptions', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('enables the person, company, and child flows now that all have launched', () => {
    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
      { key: 'company', route: '/savings-fund/onboarding/company', enabled: true },
      { key: 'child', route: '/savings-fund/onboarding/child', enabled: true },
    ]);
  });
});

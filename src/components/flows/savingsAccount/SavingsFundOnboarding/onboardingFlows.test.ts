import { getOnboardingFlowOptions, isCompanyOnboardingEnabled } from './onboardingFlows';

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

describe('getOnboardingFlowOptions', () => {
  it('enables the person and company flows, keeping child reserved', () => {
    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
      { key: 'company', route: '/savings-fund/onboarding/company', enabled: true },
      { key: 'child', route: '/savings-fund/onboarding/child', enabled: false },
    ]);
  });
});

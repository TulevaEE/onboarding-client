import { getOnboardingFlowOptions, isCompanyOnboardingEnabled } from './onboardingFlows';

describe('isCompanyOnboardingEnabled', () => {
  afterEach(() => {
    sessionStorage.removeItem('companyOnboardingPreview');
    window.history.pushState({}, '', '/');
  });

  it('is disabled before launch', () => {
    expect(isCompanyOnboardingEnabled()).toBe(false);
  });

  it('is enabled for the session when the preview url parameter is present', () => {
    window.history.pushState({}, '', '/?companyOnboardingPreview=true');
    expect(isCompanyOnboardingEnabled()).toBe(true);

    window.history.pushState({}, '', '/account');
    expect(isCompanyOnboardingEnabled()).toBe(true);
  });

  it('is disabled again when the preview url parameter is set to false', () => {
    sessionStorage.setItem('companyOnboardingPreview', 'true');

    window.history.pushState({}, '', '/?companyOnboardingPreview=false');

    expect(isCompanyOnboardingEnabled()).toBe(false);
  });
});

describe('getOnboardingFlowOptions', () => {
  afterEach(() => {
    sessionStorage.removeItem('companyOnboardingPreview');
  });

  it('only enables the personal flow before launch', () => {
    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
      { key: 'company', route: '/savings-fund/onboarding/company', enabled: false },
      { key: 'child', route: '/savings-fund/onboarding/child', enabled: false },
    ]);
  });

  it('enables the company flow in preview, keeping child disabled', () => {
    sessionStorage.setItem('companyOnboardingPreview', 'true');

    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person', enabled: true },
      { key: 'company', route: '/savings-fund/onboarding/company', enabled: true },
      { key: 'child', route: '/savings-fund/onboarding/child', enabled: false },
    ]);
  });
});

import { getOnboardingFlowOptions } from './onboardingFlows';

describe('getOnboardingFlowOptions', () => {
  it('offers the person, company, and child flows', () => {
    expect(getOnboardingFlowOptions()).toEqual([
      { key: 'person', route: '/savings-fund/onboarding/person' },
      { key: 'company', route: '/savings-fund/onboarding/company' },
      { key: 'child', route: '/savings-fund/onboarding/child' },
    ]);
  });
});

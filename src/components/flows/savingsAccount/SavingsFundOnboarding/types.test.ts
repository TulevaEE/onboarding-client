import { CompanyOnboardingFormData, SharedOnboardingFields } from './types';

describe('CompanyOnboardingFormData', () => {
  it('contains all SharedOnboardingFields', () => {
    const formData: CompanyOnboardingFormData = {
      registryLookup: undefined,
      requirementsBackendCheck: false,
      companyAddress: { reuseBackendAddress: true },
      investmentGoals: null,
      investableAssets: null,
      sourceOfCompanyIncome: false,
      termsAccepted: false,
    };

    const shared: SharedOnboardingFields = {
      investmentGoals: formData.investmentGoals,
      investableAssets: formData.investableAssets,
      termsAccepted: formData.termsAccepted,
    };

    expect(shared.investmentGoals).toBeNull();
    expect(shared.investableAssets).toBeNull();
    expect(shared.termsAccepted).toBe(false);
  });
});

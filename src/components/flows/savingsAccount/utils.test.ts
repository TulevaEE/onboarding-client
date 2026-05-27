import {
  transformCompanyFormDataToSurveyCommand,
  transformFormDataToOnboardingSurveryCommand,
} from './utils';
import { CompanyOnboardingFormData, OnboardingFormData } from './SavingsFundOnboarding/types';
import { mockValidatedCompany } from '../../../test/backend-responses';

const buildOnboardingFormData = (
  overrides: Partial<OnboardingFormData> = {},
): OnboardingFormData => ({
  citizenship: ['EE'],
  address: { street: 'Foo 1', city: 'Tallinn', postalCode: '10115', countryCode: 'EE' },
  email: 'test@example.com',
  phoneNumber: '+37255555555',
  pepSelfDeclaration: 'IS_NOT_PEP',
  investmentIntent: 'SELF',
  investmentGoals: { type: 'OPTION', value: 'LONG_TERM' },
  investableAssets: 'LESS_THAN_20K',
  sourceOfIncome: [{ type: 'OPTION', value: 'SALARY' }],
  termsAccepted: true,
  ...overrides,
});

const buildCompanyFormData = (
  overrides: Partial<CompanyOnboardingFormData> = {},
): CompanyOnboardingFormData => ({
  registryLookup: { registryNumber: '12345678', registryName: 'Acme Corp' },
  companyValidatedData: mockValidatedCompany,
  companyAddress: { reuseBackendAddress: true },
  investmentGoals: { type: 'OPTION', value: 'LONG_TERM' },
  investableAssets: 'LESS_THAN_20K',
  sourceOfCompanyIncome: {
    ONLY_ACTIVE_IN_ESTONIA: true,
    NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: true,
    NOT_IN_CRYPTO: true,
  },
  termsAccepted: true,
  ...overrides,
});

describe('transformCompanyFormDataToSurveyCommand', () => {
  it('maps registry number to BUSINESS_REGISTRY_NUMBER', () => {
    const result = transformCompanyFormDataToSurveyCommand(
      buildCompanyFormData({
        registryLookup: { registryNumber: '99887766', registryName: 'Test Corp' },
      }),
    );

    expect(result.answers).toContainEqual({
      type: 'BUSINESS_REGISTRY_NUMBER',
      value: { type: 'TEXT', value: '99887766' },
    });
  });

  it('maps companyAddress with reuseBackendAddress=true using companyValidatedData address', () => {
    const result = transformCompanyFormDataToSurveyCommand(
      buildCompanyFormData({
        companyAddress: { reuseBackendAddress: true },
        companyValidatedData: mockValidatedCompany,
      }),
    );

    expect(result.answers).toContainEqual({
      type: 'COMPANY_ADDRESS',
      value: {
        type: 'ADDRESS',
        value: {
          fullAddress: 'Telliskivi 60/1, 10412 Tallinn',
          street: 'Telliskivi 60/1',
          city: 'Tallinn',
          postalCode: '10412',
          countryCode: 'EE',
        },
      },
    });
  });

  it('maps companyAddress with reuseBackendAddress=false using provided address', () => {
    const address = {
      street: 'Foo 1',
      city: 'Tartu',
      postalCode: '50000',
      countryCode: 'EE' as const,
    };

    const result = transformCompanyFormDataToSurveyCommand(
      buildCompanyFormData({
        companyAddress: { reuseBackendAddress: false, address },
      }),
    );

    expect(result.answers).toContainEqual({
      type: 'COMPANY_ADDRESS',
      value: { type: 'ADDRESS', value: address },
    });
  });

  it('includes INVESTMENT_GOALS when provided', () => {
    const result = transformCompanyFormDataToSurveyCommand(
      buildCompanyFormData({ investmentGoals: { type: 'OPTION', value: 'LONG_TERM' } }),
    );

    expect(result.answers).toContainEqual({
      type: 'INVESTMENT_GOALS',
      value: { type: 'OPTION', value: 'LONG_TERM' },
    });
  });

  it('includes INVESTABLE_ASSETS when provided', () => {
    const result = transformCompanyFormDataToSurveyCommand(
      buildCompanyFormData({ investableAssets: 'RANGE_20K_40K' }),
    );

    expect(result.answers).toContainEqual({
      type: 'INVESTABLE_ASSETS',
      value: { type: 'OPTION', value: 'RANGE_20K_40K' },
    });
  });

  it('omits investmentGoals and investableAssets when null', () => {
    const result = transformCompanyFormDataToSurveyCommand(
      buildCompanyFormData({ investmentGoals: null, investableAssets: null }),
    );

    const types = result.answers.map((a) => a.type);
    expect(types).not.toContain('INVESTMENT_GOALS');
    expect(types).not.toContain('INVESTABLE_ASSETS');
  });
});

describe('transformFormDataToOnboardingSurveryCommand', () => {
  it('includes the personal profile items for a personal (SELF) intent', () => {
    const result = transformFormDataToOnboardingSurveryCommand(
      buildOnboardingFormData({ investmentIntent: 'SELF' }),
    );

    const types = result.answers.map((a) => a.type);
    expect(types).toEqual(
      expect.arrayContaining(['INVESTMENT_GOALS', 'INVESTABLE_ASSETS', 'SOURCE_OF_INCOME']),
    );
  });

  it('omits the personal profile items for a company-only intent even if they were filled earlier', () => {
    const result = transformFormDataToOnboardingSurveryCommand(
      buildOnboardingFormData({
        investmentIntent: 'ONLY_VIA_COMPANY',
        // simulate stale answers from a previous SELF/BOTH selection
        investmentGoals: { type: 'OPTION', value: 'LONG_TERM' },
        investableAssets: 'LESS_THAN_20K',
        sourceOfIncome: [{ type: 'OPTION', value: 'SALARY' }],
      }),
    );

    const types = result.answers.map((a) => a.type);
    expect(types).not.toContain('INVESTMENT_GOALS');
    expect(types).not.toContain('INVESTABLE_ASSETS');
    expect(types).not.toContain('SOURCE_OF_INCOME');
    // identity items are still present
    expect(types).toEqual(
      expect.arrayContaining(['CITIZENSHIP', 'ADDRESS', 'EMAIL', 'PEP_SELF_DECLARATION']),
    );
  });
});

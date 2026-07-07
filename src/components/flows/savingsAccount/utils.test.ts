import {
  transformChildFormDataToSurveyCommand,
  transformCompanyFormDataToSurveyCommand,
  transformFormDataToOnboardingSurveryCommand,
  transformIdentityToOnboardingSurveyCommand,
} from './utils';
import {
  ChildOnboardingFormData,
  CompanyOnboardingFormData,
  OnboardingFormData,
} from './SavingsFundOnboarding/types';
import { mockValidatedCompany } from '../../../test/backend-responses';

const buildOnboardingFormData = (
  overrides: Partial<OnboardingFormData> = {},
): OnboardingFormData => ({
  citizenship: ['EE'],
  address: { street: 'Foo 1', city: 'Tallinn', postalCode: '10115', countryCode: 'EE' },
  email: 'test@example.com',
  phoneNumber: '+37255555555',
  pepSelfDeclaration: 'IS_NOT_PEP',
  personalInvestmentProfile: {
    investmentGoals: { type: 'OPTION', value: 'LONG_TERM' },
    investableAssets: 'LESS_THAN_20K',
    sourceOfIncome: [{ type: 'OPTION', value: 'SALARY' }],
  },
  termsAccepted: true,
  ...overrides,
});

const buildCompanyFormData = (
  overrides: Partial<CompanyOnboardingFormData> = {},
): CompanyOnboardingFormData => ({
  citizenship: ['EE'],
  address: { street: 'Foo 1', city: 'Tallinn', postalCode: '10115', countryCode: 'EE' },
  email: 'test@example.com',
  phoneNumber: '+37255555555',
  pepSelfDeclaration: 'IS_NOT_PEP',
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
  it('marks the submission as a personal onboarding', () => {
    const result = transformFormDataToOnboardingSurveryCommand(buildOnboardingFormData());

    expect(result.purpose).toBe('PERSONAL_ONBOARDING');
  });

  it('includes the personal profile items when the group is populated', () => {
    const result = transformFormDataToOnboardingSurveryCommand(buildOnboardingFormData());

    const types = result.answers.map((a) => a.type);
    expect(types).toEqual(
      expect.arrayContaining(['INVESTMENT_GOALS', 'INVESTABLE_ASSETS', 'SOURCE_OF_INCOME']),
    );
  });

  it('omits the personal profile items when the group is not fully populated', () => {
    const result = transformFormDataToOnboardingSurveryCommand(
      buildOnboardingFormData({
        personalInvestmentProfile: { investableAssets: 'LESS_THAN_20K' },
      }),
    );

    const types = result.answers.map((a) => a.type);
    expect(types).not.toContain('INVESTMENT_GOALS');
    expect(types).not.toContain('INVESTABLE_ASSETS');
    expect(types).not.toContain('SOURCE_OF_INCOME');
  });
});

const buildChildFormData = (
  overrides: Partial<ChildOnboardingFormData> = {},
): ChildOnboardingFormData => ({
  citizenship: [],
  address: { street: 'Foo 1', city: 'Tallinn', postalCode: '10115', countryCode: 'EE' },
  email: 'parent@example.com',
  phoneNumber: '+37255555555',
  pepSelfDeclaration: null,
  childPersonalCode: '61509070000',
  child: { firstName: 'Mammu', lastName: 'Maasikas', dateOfBirth: '2015-09-07' },
  investmentGoals: { type: 'OPTION', value: 'EDUCATION' },
  plannedContribution: 'FROM_200_TO_600',
  investableAssets: 'UP_TO_2000',
  fundingSources: [{ type: 'OPTION', value: 'PARENT_INCOME_AND_SAVINGS' }],
  termsAccepted: true,
  ...overrides,
});

describe('transformChildFormDataToSurveyCommand', () => {
  it("marks the submission as the child's own personal onboarding", () => {
    expect(transformChildFormDataToSurveyCommand(buildChildFormData()).purpose).toBe(
      'PERSONAL_ONBOARDING',
    );
  });

  it('sends the child address, contact, goal, contribution, investable assets and funding sources in order', () => {
    const types = transformChildFormDataToSurveyCommand(buildChildFormData()).answers.map(
      (answer) => answer.type,
    );
    expect(types).toEqual([
      'ADDRESS',
      'EMAIL',
      'PHONE_NUMBER',
      'INVESTMENT_GOALS',
      'PLANNED_CONTRIBUTION',
      'INVESTABLE_ASSETS',
      'FUNDING_SOURCES',
    ]);
  });

  it('never sends citizenship or PEP — both are derived backend-side, not by the parent', () => {
    const types = transformChildFormDataToSurveyCommand(buildChildFormData()).answers.map(
      (answer) => answer.type,
    );
    expect(types).not.toContain('CITIZENSHIP');
    expect(types).not.toContain('PEP_SELF_DECLARATION');
  });

  it('omits the optional phone number when absent', () => {
    const types = transformChildFormDataToSurveyCommand(
      buildChildFormData({ phoneNumber: undefined }),
    ).answers.map((answer) => answer.type);
    expect(types).not.toContain('PHONE_NUMBER');
  });

  it('maps the planned contribution as an OPTION value', () => {
    expect(
      transformChildFormDataToSurveyCommand(
        buildChildFormData({ plannedContribution: 'OVER_1000' }),
      ).answers,
    ).toContainEqual({
      type: 'PLANNED_CONTRIBUTION',
      value: { type: 'OPTION', value: 'OVER_1000' },
    });
  });

  it('maps the investable assets as an OPTION value', () => {
    expect(
      transformChildFormDataToSurveyCommand(
        buildChildFormData({ investableAssets: 'FROM_2000_TO_10000' }),
      ).answers,
    ).toContainEqual({
      type: 'INVESTABLE_ASSETS',
      value: { type: 'OPTION', value: 'FROM_2000_TO_10000' },
    });
  });

  it('passes funding sources through, including a free-text other item', () => {
    const result = transformChildFormDataToSurveyCommand(
      buildChildFormData({
        fundingSources: [
          { type: 'OPTION', value: 'GIFTS' },
          { type: 'TEXT', value: 'lottery win' },
        ],
      }),
    );
    expect(result.answers).toContainEqual({
      type: 'FUNDING_SOURCES',
      value: [
        { type: 'OPTION', value: 'GIFTS' },
        { type: 'TEXT', value: 'lottery win' },
      ],
    });
  });

  it('omits goal, contribution, investable assets and funding sources when not provided', () => {
    const types = transformChildFormDataToSurveyCommand(
      buildChildFormData({
        investmentGoals: null,
        plannedContribution: null,
        investableAssets: null,
        fundingSources: [],
      }),
    ).answers.map((answer) => answer.type);
    expect(types).not.toContain('INVESTMENT_GOALS');
    expect(types).not.toContain('PLANNED_CONTRIBUTION');
    expect(types).not.toContain('INVESTABLE_ASSETS');
    expect(types).not.toContain('FUNDING_SOURCES');
  });
});

describe('transformIdentityToOnboardingSurveyCommand', () => {
  it('builds an identity-only submission with no profile items', () => {
    const result = transformIdentityToOnboardingSurveyCommand(buildOnboardingFormData());

    expect(result.purpose).toBe('IDENTITY_ONLY');
    expect(result.answers.map((answer) => answer.type)).toEqual([
      'CITIZENSHIP',
      'ADDRESS',
      'EMAIL',
      'PHONE_NUMBER',
      'PEP_SELF_DECLARATION',
    ]);
  });

  it('omits the optional phone number when absent', () => {
    const result = transformIdentityToOnboardingSurveyCommand(
      buildOnboardingFormData({ phoneNumber: undefined }),
    );

    expect(result.answers.map((answer) => answer.type)).not.toContain('PHONE_NUMBER');
  });
});

import {
  ChildOnboardingFormData,
  CompanyOnboardingFormData,
  IdentityFormFields,
  OnboardingFormData,
  PersonalInvestmentProfile,
} from './SavingsFundOnboarding/types';
import {
  Address,
  CompanyOnboardingSurveyCommand,
  CompanySourceOfIncomeOption,
  ISO2CountryCode,
  OnboardingSurveyCommand,
} from './SavingsFundOnboarding/types.api';

const isPopulatedPersonalProfile = (
  profile: OnboardingFormData['personalInvestmentProfile'],
): profile is PersonalInvestmentProfile =>
  !!profile.investmentGoals &&
  !!profile.investableAssets &&
  (profile.sourceOfIncome?.length ?? 0) > 0;

const identityAnswers = (data: IdentityFormFields): OnboardingSurveyCommand['answers'] => {
  const answers: OnboardingSurveyCommand['answers'] = [
    {
      type: 'CITIZENSHIP',
      value: {
        type: 'COUNTRIES',
        value: data.citizenship,
      },
    },
    {
      type: 'ADDRESS',
      value: {
        type: 'ADDRESS',
        value: data.address,
      },
    },
    {
      type: 'EMAIL',
      value: {
        type: 'TEXT',
        value: data.email,
      },
    },
  ];

  if (data.phoneNumber) {
    answers.push({
      type: 'PHONE_NUMBER',
      value: {
        type: 'TEXT',
        value: data.phoneNumber,
      },
    });
  }

  if (data.pepSelfDeclaration) {
    answers.push({
      type: 'PEP_SELF_DECLARATION',
      value: {
        type: 'OPTION',
        value: data.pepSelfDeclaration,
      },
    });
  }

  return answers;
};

export const transformIdentityToOnboardingSurveyCommand = (
  data: IdentityFormFields,
): OnboardingSurveyCommand => ({
  purpose: 'IDENTITY_ONLY',
  answers: identityAnswers(data),
});

export const transformFormDataToOnboardingSurveryCommand = (
  data: OnboardingFormData,
): OnboardingSurveyCommand => {
  const answers = identityAnswers(data);

  if (isPopulatedPersonalProfile(data.personalInvestmentProfile)) {
    const { investmentGoals, investableAssets, sourceOfIncome } = data.personalInvestmentProfile;
    answers.push(
      { type: 'INVESTMENT_GOALS', value: investmentGoals },
      { type: 'INVESTABLE_ASSETS', value: { type: 'OPTION', value: investableAssets } },
      { type: 'SOURCE_OF_INCOME', value: sourceOfIncome },
    );
  }

  return { purpose: 'PERSONAL_ONBOARDING', answers };
};

// The parent fills the child's KYC and it is submitted while acting as the child
// (role-aware backend). Citizenship and PEP are intentionally absent — the
// backend derives the child's citizenship from the population register and a
// child cannot be a PEP (that risk is inherited from the parent's own KYC).
export const transformChildFormDataToSurveyCommand = (
  data: ChildOnboardingFormData,
): OnboardingSurveyCommand => {
  const answers: OnboardingSurveyCommand['answers'] = [
    { type: 'ADDRESS', value: { type: 'ADDRESS', value: data.address } },
    { type: 'EMAIL', value: { type: 'TEXT', value: data.email } },
  ];

  if (data.phoneNumber) {
    answers.push({ type: 'PHONE_NUMBER', value: { type: 'TEXT', value: data.phoneNumber } });
  }

  if (data.investmentGoals) {
    answers.push({ type: 'INVESTMENT_GOALS', value: data.investmentGoals });
  }

  if (data.plannedContribution) {
    answers.push({
      type: 'PLANNED_CONTRIBUTION',
      value: { type: 'OPTION', value: data.plannedContribution },
    });
  }

  if (data.investableAssets) {
    answers.push({
      type: 'INVESTABLE_ASSETS',
      value: { type: 'OPTION', value: data.investableAssets },
    });
  }

  if (data.fundingSources.length > 0) {
    answers.push({ type: 'FUNDING_SOURCES', value: data.fundingSources });
  }

  return { purpose: 'PERSONAL_ONBOARDING', answers };
};

export const transformCompanyFormDataToSurveyCommand = (
  data: CompanyOnboardingFormData,
): CompanyOnboardingSurveyCommand => {
  const answers: CompanyOnboardingSurveyCommand['answers'] = [];

  if (data.registryLookup) {
    answers.push({
      type: 'BUSINESS_REGISTRY_NUMBER',
      value: { type: 'TEXT', value: data.registryLookup.registryNumber },
    });
  }

  let resolvedAddress: Address;
  if (data.companyAddress.reuseBackendAddress) {
    const validatedAddress = data.companyValidatedData?.address.value;
    resolvedAddress = {
      fullAddress: validatedAddress?.fullAddress,
      street: validatedAddress?.street ?? '',
      city: validatedAddress?.city ?? '',
      postalCode: validatedAddress?.postalCode ?? '',
      countryCode: (validatedAddress?.countryCode ?? '') as ISO2CountryCode,
    };
  } else {
    resolvedAddress = data.companyAddress.address;
  }

  answers.push({
    type: 'COMPANY_ADDRESS',
    value: { type: 'ADDRESS', value: resolvedAddress },
  });

  if (data.investmentGoals) {
    answers.push({ type: 'INVESTMENT_GOALS', value: data.investmentGoals });
  }

  if (data.investableAssets) {
    answers.push({
      type: 'INVESTABLE_ASSETS',
      value: { type: 'OPTION', value: data.investableAssets },
    });
  }

  const selectedIncomeSources = Object.entries(data.sourceOfCompanyIncome).map(([key]) => ({
    type: 'OPTION' as const,
    value: key as CompanySourceOfIncomeOption,
  }));
  answers.push({ type: 'COMPANY_SOURCE_OF_INCOME', value: selectedIncomeSources });

  return { answers };
};

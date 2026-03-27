import { CompanyOnboardingFormData, OnboardingFormData } from './SavingsFundOnboarding/types';
import {
  Address,
  CompanyOnboardingSurveyCommand,
  CompanySourceOfIncomeOption,
  ISO2CountryCode,
  OnboardingSurveyCommand,
} from './SavingsFundOnboarding/types.api';

export const transformFormDataToOnboardingSurveryCommand = (
  data: OnboardingFormData,
): OnboardingSurveyCommand => {
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

  if (data.investmentGoals) {
    answers.push({
      type: 'INVESTMENT_GOALS',
      value: data.investmentGoals,
    });
  }

  if (data.investableAssets) {
    answers.push({
      type: 'INVESTABLE_ASSETS',
      value: {
        type: 'OPTION',
        value: data.investableAssets,
      },
    });
  }

  if (data.sourceOfIncome.length > 0) {
    answers.push({
      type: 'SOURCE_OF_INCOME',
      value: data.sourceOfIncome,
    });
  }

  return { answers };
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

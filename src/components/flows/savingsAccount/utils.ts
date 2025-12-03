import { OnboardingFormData } from './SavingsFundOnboarding/types';
import { OnboardingSurveyCommand } from './SavingsFundOnboarding/types.api';

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

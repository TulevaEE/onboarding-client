import type {
  ISO2CountryCode,
  PepSelfDeclaration,
  InvestmentGoalOption,
  InvestableAssetsOption,
  Address,
  SourceOfIncomeSurveyItem,
} from './types.api';

export interface OnboardingFormData {
  citizenship: ISO2CountryCode[];
  address: Address;
  email: string;
  phoneNumber?: string;
  pepSelfDeclaration: PepSelfDeclaration | null;
  investmentGoals:
    | { type: 'OPTION'; value: InvestmentGoalOption }
    | { type: 'TEXT'; value: string }
    | null;
  investableAssets: InvestableAssetsOption | null;
  sourceOfIncome: SourceOfIncomeSurveyItem['value'];
  termsAccepted: boolean;
}

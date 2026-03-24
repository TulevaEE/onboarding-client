import type {
  ISO2CountryCode,
  PepSelfDeclaration,
  InvestmentGoalOption,
  InvestableAssetsOption,
  Address,
  SourceOfIncomeSurveyItem,
} from './types.api';

export interface SharedOnboardingFields {
  investmentGoals:
    | { type: 'OPTION'; value: InvestmentGoalOption }
    | { type: 'TEXT'; value: string }
    | null;
  investableAssets: InvestableAssetsOption | null;
  termsAccepted: boolean;
}

export interface OnboardingFormData extends SharedOnboardingFields {
  citizenship: ISO2CountryCode[];
  address: Address;
  email: string;
  phoneNumber?: string;
  pepSelfDeclaration: PepSelfDeclaration | null;
  sourceOfIncome: SourceOfIncomeSurveyItem['value'];
}

export interface CompanyOnboardingFormData extends SharedOnboardingFields {
  // step 1
  registryLookup?: {
    registryNumber: string;
    registryName: string;
  };
  // step 2
  requirementsBackendCheck: boolean;
  // step 3
  companyAddress:
    | {
        reuseBackendAddress: true;
      }
    | {
        reuseBackendAddress: false;
        address: Address;
      };
  // step 6
  sourceOfCompanyIncome: boolean;
}

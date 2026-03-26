import type {
  ISO2CountryCode,
  PepSelfDeclaration,
  InvestmentGoalOption,
  InvestableAssetsOption,
  Address,
  SourceOfIncomeSurveyItem,
} from './types.api';
import { BusinessRegistryValidatedData } from '../../../common/apiModels/company-onboarding';

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
  registryLookup?: {
    registryNumber: string;
    registryName: string;
  };
  companyValidatedData?: BusinessRegistryValidatedData;
  companyAddress:
    | {
        reuseBackendAddress: true;
      }
    | {
        reuseBackendAddress: false;
        address: Address;
      };
  sourceOfCompanyIncome: boolean;
}

import type {
  ISO2CountryCode,
  PepSelfDeclaration,
  InvestmentGoalOption,
  InvestableAssetsOption,
  Address,
  SourceOfIncomeSurveyItem,
  CompanySourceOfIncomeOption,
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

export type InvestmentIntent = 'SELF' | 'BOTH' | 'ONLY_VIA_COMPANY';

export interface OnboardingFormData extends SharedOnboardingFields {
  citizenship: ISO2CountryCode[];
  address: Address;
  email: string;
  phoneNumber?: string;
  pepSelfDeclaration: PepSelfDeclaration | null;
  // Frontend-only: drives which steps are shown and what the KYC payload
  // contains. Never sent to the backend — "company-only" is inferred from
  // the absence of profile answers (see TKF #67).
  investmentIntent: InvestmentIntent | null;
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
  sourceOfCompanyIncome: Record<CompanySourceOfIncomeOption, boolean>;
}

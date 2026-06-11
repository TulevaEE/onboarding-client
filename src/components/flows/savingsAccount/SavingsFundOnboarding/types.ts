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

export type InvestmentGoalsValue =
  | { type: 'OPTION'; value: InvestmentGoalOption }
  | { type: 'TEXT'; value: string };

export interface SharedOnboardingFields {
  termsAccepted: boolean;
}

export type InvestmentIntent = 'SELF' | 'BOTH' | 'ONLY_VIA_COMPANY';

// Grouped so that "the user gave personal-profile answers" is one fact in the
// type, not three coordinated nullables. The form populates the group field by
// field as the user moves through steps, then the transform turns a fully
// populated group into the KYC payload. For ONLY_VIA_COMPANY the group is
// cleared to `null` when the intent flips, so the absence of profile answers
// is structural rather than gated on intent at submit time.
export interface PersonalInvestmentProfile {
  investmentGoals: InvestmentGoalsValue;
  investableAssets: InvestableAssetsOption;
  sourceOfIncome: SourceOfIncomeSurveyItem['value'];
}

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
  // Partial during the flow (fields filled one step at a time), null when
  // intent is ONLY_VIA_COMPANY (cleared on intent flip). At submit time the
  // flow guarantees full population for SELF/BOTH.
  personalInvestmentProfile: Partial<PersonalInvestmentProfile> | null;
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
  // Company KYB always collects these — they aren't grouped because there is
  // no "skip the profile" path on the company flow.
  investmentGoals: InvestmentGoalsValue | null;
  investableAssets: InvestableAssetsOption | null;
  sourceOfCompanyIncome: Record<CompanySourceOfIncomeOption, boolean>;
}

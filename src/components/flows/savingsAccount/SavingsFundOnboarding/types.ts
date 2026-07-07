import type {
  ISO2CountryCode,
  PepSelfDeclaration,
  InvestmentGoalOption,
  InvestableAssetsOption,
  Address,
  SourceOfIncomeSurveyItem,
  CompanySourceOfIncomeOption,
  PlannedContributionOption,
  FundingSourcesSurveyItem,
} from './types.api';
import { BusinessRegistryValidatedData } from '../../../common/apiModels/company-onboarding';

export type InvestmentGoalsValue =
  | { type: 'OPTION'; value: InvestmentGoalOption }
  | { type: 'TEXT'; value: string };

export interface SharedOnboardingFields {
  termsAccepted: boolean;
}

// The 4 identity (KYC) steps' fields — collected once per person and shared by
// the personal and company flows (see identitySteps.tsx).
export interface IdentityFormFields {
  citizenship: ISO2CountryCode[];
  address: Address;
  email: string;
  phoneNumber?: string;
  pepSelfDeclaration: PepSelfDeclaration | null;
}

// Grouped so that "the user gave personal-profile answers" is one fact in the
// type, not three coordinated nullables. The form populates the group field by
// field as the user moves through steps, then the transform turns a fully
// populated group into the KYC payload.
export interface PersonalInvestmentProfile {
  investmentGoals: InvestmentGoalsValue;
  investableAssets: InvestableAssetsOption;
  sourceOfIncome: SourceOfIncomeSurveyItem['value'];
}

export interface OnboardingFormData extends SharedOnboardingFields, IdentityFormFields {
  // Partial during the flow (fields filled one step at a time); at submit
  // time the flow guarantees full population.
  personalInvestmentProfile: Partial<PersonalInvestmentProfile>;
}

// The RR-verified child returned by POST /v1/me/children on the VERIFIED path.
export interface VerifiedChild {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export type FundingSourcesValue = FundingSourcesSurveyItem['value'];

// The parent fills this on the child's behalf. Extends IdentityFormFields so the
// shared address/contact steps can be reused; citizenship and pepSelfDeclaration
// stay at their empty defaults — they are never collected or submitted for a
// child (derived backend-side from the population register).
export interface ChildOnboardingFormData extends SharedOnboardingFields, IdentityFormFields {
  childPersonalCode: string;
  // Populated once POST /v1/me/children confirms custody (VERIFIED); null until then.
  child: VerifiedChild | null;
  investmentGoals: InvestmentGoalsValue | null;
  plannedContribution: PlannedContributionOption | null;
  investableAssets: InvestableAssetsOption | null;
  fundingSources: FundingSourcesValue;
}

export interface CompanyOnboardingFormData extends SharedOnboardingFields, IdentityFormFields {
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

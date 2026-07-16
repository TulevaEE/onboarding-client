type Letter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';
export type ISO2CountryCode = `${Letter}${Letter}`;
export type PepSelfDeclaration = 'IS_PEP' | 'IS_NOT_PEP';
export type InvestmentGoalOption =
  | 'LONG_TERM'
  | 'ASSET_MANAGEMENT'
  | 'SPECIFIC_GOAL'
  | 'CHILD'
  | 'TRADING'
  // Child-flow goals. Proposed contract for backend PR5 — the child onboarding
  // ships hidden until the backend accepts these.
  | 'EDUCATION'
  | 'FIRST_HOME';
// How much the parent plans to contribute for the child (a range, not a total).
// Child-flow only; proposed contract for backend PR5.
export type PlannedContributionOption =
  | 'UP_TO_200'
  | 'FROM_200_TO_600'
  | 'FROM_600_TO_1000'
  | 'OVER_1000';
// Where the money reaching the child's account comes from. "Other" is a
// free-text TEXT item (as with SOURCE_OF_INCOME), not an enum value.
// Child-flow only; proposed contract for backend PR5.
export type FundingSourceOption =
  | 'PARENT_INCOME_AND_SAVINGS'
  | 'GIFTS'
  | 'INHERITANCE'
  | 'CHILD_OWN';
export type InvestableAssetsOption =
  | 'LESS_THAN_20K'
  | 'RANGE_20K_40K'
  | 'RANGE_40K_80K'
  | 'MORE_THAN_80K'
  // Child-flow ranges (smaller brackets than the adult profile). Child-flow only;
  // proposed contract for backend PR5.
  | 'UP_TO_2000'
  | 'FROM_2000_TO_10000'
  | 'OVER_10000';
export type SourceOfIncomeOption =
  | 'SALARY'
  | 'SAVINGS'
  | 'INVESTMENTS'
  | 'PENSION_OR_BENEFITS'
  | 'FAMILY_FUNDS_OR_INHERITANCE'
  | 'BUSINESS_INCOME';
export type CompanySourceOfIncomeOption =
  | 'ONLY_ACTIVE_IN_ESTONIA'
  | 'NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES'
  | 'NOT_IN_CRYPTO';

export type Address = {
  fullAddress?: string;
  street: string;
  city: string;
  postalCode: string;
  countryCode: ISO2CountryCode;
};

type TextValue = {
  type: 'TEXT';
  value: string;
};
type OptionValue<T extends string> = {
  type: 'OPTION';
  value: T;
};

type AddressValue = {
  type: 'ADDRESS';
  value: Address;
};
type CountriesValue = {
  type: 'COUNTRIES';
  value: ISO2CountryCode[];
};

type CitizenshipSurveyItem = {
  type: 'CITIZENSHIP';
  value: CountriesValue;
};
type AddressSurveyItem = {
  type: 'ADDRESS';
  value: AddressValue;
};
type EmailSurveyItem = {
  type: 'EMAIL';
  value: TextValue;
};
type PhoneNumberSurveyItem = {
  type: 'PHONE_NUMBER';
  value: TextValue;
};
type PepSelfDeclarationSurveyItem = {
  type: 'PEP_SELF_DECLARATION';
  value: OptionValue<PepSelfDeclaration>;
};
type InvestmentGoalsSurveyItem = {
  type: 'INVESTMENT_GOALS';
  // A single value (person/company flows) or an array (child flow, multi-select).
  // The backend accepts both — a single value deserializes into a one-element list.
  value:
    | OptionValue<InvestmentGoalOption>
    | TextValue
    | (OptionValue<InvestmentGoalOption> | TextValue)[];
};
type InvestableAssetsSurveyItem = {
  type: 'INVESTABLE_ASSETS';
  value: OptionValue<InvestableAssetsOption>;
};
export type SourceOfIncomeSurveyItem = {
  type: 'SOURCE_OF_INCOME';
  value: (OptionValue<SourceOfIncomeOption> | TextValue)[];
};
type PlannedContributionSurveyItem = {
  type: 'PLANNED_CONTRIBUTION';
  value: OptionValue<PlannedContributionOption>;
};
export type FundingSourcesSurveyItem = {
  type: 'FUNDING_SOURCES';
  value: (OptionValue<FundingSourceOption> | TextValue)[];
};

type BusinessRegistryNumberSurveyItem = {
  type: 'BUSINESS_REGISTRY_NUMBER';
  value: TextValue;
};
type CompanyAddressSurveyItem = {
  type: 'COMPANY_ADDRESS';
  value: AddressValue;
};
type CompanySourceOfIncomeSurveyItem = {
  type: 'COMPANY_SOURCE_OF_INCOME';
  value: OptionValue<CompanySourceOfIncomeOption>[];
};

type OnboardingSurveyItem =
  | CitizenshipSurveyItem
  | AddressSurveyItem
  | EmailSurveyItem
  | PhoneNumberSurveyItem
  | PepSelfDeclarationSurveyItem
  | InvestmentGoalsSurveyItem
  | InvestableAssetsSurveyItem
  | SourceOfIncomeSurveyItem
  | PlannedContributionSurveyItem
  | FundingSourcesSurveyItem;

// Mirrors the backend's KycSurveyPurpose: only PERSONAL_ONBOARDING submissions
// may complete the person's savings-fund onboarding; IDENTITY_ONLY runs the
// identity screening and nothing else.
export type OnboardingSurveyPurpose = 'IDENTITY_ONLY' | 'PERSONAL_ONBOARDING';

export type OnboardingSurveyCommand = {
  purpose: OnboardingSurveyPurpose;
  answers: OnboardingSurveyItem[];
};

// GET /v1/kyc/identity — `complete` means all identity steps can be skipped.
export type KycIdentity = {
  citizenship?: ISO2CountryCode[];
  address?: Address;
  email?: string;
  phoneNumber?: string;
  pepSelfDeclaration?: PepSelfDeclaration;
  complete: boolean;
  updatedAt?: string;
};

// GET /v1/me/children — children whose assets the parent may manage according
// to the population register. The name comes from the register and may be absent.
export type EligibleChild = {
  personalCode: string;
  firstName?: string;
  lastName?: string;
};

// POST /v1/me/children — the parent opens an account for their child. The custody
// check runs server-side against the population register; only the code is sent.
export type CreateChildCommand = {
  childPersonalCode: string;
};

// VERIFIED → 200 with the child's RR identity (name/DOB, and address for prefill).
// UNDER_REVIEW → 202 with no details — the unified "we'll review it" outcome that
// discloses no reason. Always branch on `status`, never the HTTP status code.
export type ChildResponse = {
  status: 'VERIFIED' | 'UNDER_REVIEW';
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: Address;
};

type CompanyOnboardingSurveyItem =
  | BusinessRegistryNumberSurveyItem
  | CompanyAddressSurveyItem
  | InvestmentGoalsSurveyItem
  | InvestableAssetsSurveyItem
  | CompanySourceOfIncomeSurveyItem;

export type CompanyOnboardingSurveyCommand = {
  answers: CompanyOnboardingSurveyItem[];
};

export type BusinessRegistrySearchResult = { company_id: number; name: string; reg_code: string };

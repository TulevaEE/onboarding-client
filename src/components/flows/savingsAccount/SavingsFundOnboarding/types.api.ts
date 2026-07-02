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
  | 'UP_TO_50'
  | 'FROM_50_TO_100'
  | 'FROM_100_TO_300'
  | 'OVER_300';
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
  | 'MORE_THAN_80K';
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
  value: OptionValue<InvestmentGoalOption> | TextValue;
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

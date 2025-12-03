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
export type InvestmentGoalOption = 'LONG_TERM' | 'SPECIFIC_GOAL' | 'CHILD' | 'TRADING';
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

export type Address = {
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

type OnboardingSurveyItem =
  | CitizenshipSurveyItem
  | AddressSurveyItem
  | EmailSurveyItem
  | PhoneNumberSurveyItem
  | PepSelfDeclarationSurveyItem
  | InvestmentGoalsSurveyItem
  | InvestableAssetsSurveyItem
  | SourceOfIncomeSurveyItem;

export type OnboardingSurveyCommand = {
  answers: OnboardingSurveyItem[];
};

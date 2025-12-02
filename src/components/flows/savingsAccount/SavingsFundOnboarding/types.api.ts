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
  item: 'CITIZENSHIP';
  value: CountriesValue;
};
type AddressSurveyItem = {
  item: 'ADDRESS';
  value: AddressValue;
};
type EmailSurveyItem = {
  item: 'EMAIL';
  value: TextValue;
};
type PhoneNumberSurveyItem = {
  item: 'PHONE_NUMBER';
  value: TextValue;
};
type PepSelfDeclarationSurveyItem = {
  item: 'PEP_SELF_DECLARATION';
  value: OptionValue<PepSelfDeclaration>;
};
type InvestmentGoalsSurveyItem = {
  item: 'INVESTMENT_GOALS';
  value: OptionValue<InvestmentGoalOption> | TextValue;
};
type InvestableAssetsSurveyItem = {
  item: 'INVESTABLE_ASSETS';
  value: OptionValue<InvestableAssetsOption>;
};
export type SourceOfIncomeSurveyItem = {
  item: 'SOURCE_OF_INCOME';
  value: (OptionValue<SourceOfIncomeOption> | TextValue)[];
};
type TermsSurveyItem = {
  item: 'TERMS';
  value: OptionValue<'ACCEPTED'>;
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
  | TermsSurveyItem;

export type OnboardingSurveyCommand = {
  answers: OnboardingSurveyItem[];
};

// Example JSON payload:
/*
{
  "answers": [
    {
      "item": "CITIZENSHIP",
      "value": {
        "type": "COUNTRIES",
        "value": ["US", "CA"]
      }
    },
    {
      "item": "ADDRESS",
      "value": {
        "type": "ADDRESS",
        "value": {
          "street": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "postalCode": "12345",
          "countryCode": "US"
        }
      }
    },
    {
      "item": "EMAIL",
      "value": {
        "type": "TEXT",
        "value": "hendrik@molder.eu"
      }
    },
    {
      "item": "PHONE_NUMBER",
      "value": {
        "type": "TEXT",
        "value": "+1234567890"
      }
    },
    {
      "item": "PEP_SELF_DECLARATION",
      "value": {
        "type": "OPTION",
        "value": "IS_NOT_PEP"
      }
    },
    {
      "item": "INVESTMENT_GOALS",
      "value": {
        "type": "OPTION",
        "value": "LONG_TERM"
      }
    },
    {
      "item": "INVESTABLE_ASSETS",
      "value": {
        "type": "OPTION",
        "value": "80_OR_MORE"
      }
    },
    {
      "item": "SOURCE_OF_INCOME",
      "value": {
        "type": "MULTI_OPTION",
        "value": ["SALARY", "INVESTMENTS"]
      }
    },
    {
      "item": "TERMS",
      "value": {
        "type": "OPTION",
        "value": "ACCEPTED"
      }
    }
  ]
}
*/

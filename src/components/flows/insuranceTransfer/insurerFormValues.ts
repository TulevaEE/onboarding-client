import {
  ArteaQuestionnaire,
  CreateInsuranceTransferFormCommand,
  IdDocumentType,
  INCOME_SOURCES,
  IncomeSource,
  InsuranceTransferAddress,
  InsuranceTransferFormInsurer,
  MonthlyNetIncome,
  OccupationStatus,
} from '../../common/apiModels/insurance-transfer';
import { User } from '../../common/apiModels';
import { preProcessIban } from '../../common/iban';
import { KycIdentity, PepSelfDeclaration } from '../savingsAccount/SavingsFundOnboarding/types.api';

export type ArteaAnswers = {
  idDocument: {
    type: IdDocumentType | '';
    number: string;
    issuedOn: string;
    validUntil: string;
    issuingCountry: string;
  };
  occupation: {
    status: OccupationStatus | '';
    position: string;
    employer: string;
    employerAddress: string;
    description: string;
  };
  incomeSources: IncomeSource[];
  incomeSourceDetails: Partial<Record<IncomeSource, string>>;
  monthlyNetIncome: MonthlyNetIncome | '';
  premiumAccountIban: string;
};

export type InsurerFormValues = {
  policyNumber: string;
  address: InsuranceTransferAddress;
  citizenship: string[];
  countryOfBirth: string;
  taxResidencyIfNotAddressCountry: string;
  pepSelfDeclaration: PepSelfDeclaration | null;
  notUsPerson: boolean;
  artea: ArteaAnswers;
};

export type DetailsOnFile = {
  address: boolean;
  citizenship: boolean;
  pep: boolean;
};

const ESTONIA = 'EE';

const OCCUPATIONS_DESCRIBED_IN_OWN_WORDS = ['SELF_EMPLOYED', 'COMPANY_OWNER', 'OTHER'] as const;

type OccupationDescribedInOwnWords = (typeof OCCUPATIONS_DESCRIBED_IN_OWN_WORDS)[number];

const INCOME_SOURCES_EXPLAINED_BY_OCCUPATION = ['SALARY', 'SELF_EMPLOYMENT'] as const;

type IncomeSourceNeedingDetails = Exclude<
  IncomeSource,
  (typeof INCOME_SOURCES_EXPLAINED_BY_OCCUPATION)[number]
>;

export const asksCitizenshipTaxResidencyAndExposure = (insurer: InsuranceTransferFormInsurer) =>
  insurer === 'ERGO' || insurer === 'ARTEA';

export const asksUsPersonDeclaration = (insurer: InsuranceTransferFormInsurer) =>
  insurer === 'COMPENSA';

export const asksEmployer = (status: OccupationStatus | '') => status === 'EMPLOYED';

export const asksOccupationDescription = (
  status: OccupationStatus | '',
): status is OccupationDescribedInOwnWords =>
  OCCUPATIONS_DESCRIBED_IN_OWN_WORDS.some((described) => described === status);

export const asksIncomeSourceDetails = (
  source: IncomeSource,
): source is IncomeSourceNeedingDetails =>
  !INCOME_SOURCES_EXPLAINED_BY_OCCUPATION.some((explained) => explained === source);

export const taxResidencyOf = ({
  taxResidencyIfNotAddressCountry,
  address,
}: Pick<InsurerFormValues, 'taxResidencyIfNotAddressCountry' | 'address'>) =>
  taxResidencyIfNotAddressCountry || address.countryCode;

const aYearAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
};

const isUnderAYearOld = (identity: KycIdentity | undefined) =>
  !!identity?.updatedAt && new Date(identity.updatedAt) > aYearAgo();

const isComplete = (address: KycIdentity['address']) =>
  !!address?.street && !!address.city && !!address.postalCode && !!address.countryCode;

export const detailsOnFile = (identity: KycIdentity | undefined): DetailsOnFile => {
  const current = isUnderAYearOld(identity);
  return {
    address: current && isComplete(identity?.address),
    citizenship: current && !!identity?.citizenship?.length,
    pep: current && !!identity?.pepSelfDeclaration,
  };
};

export const defaultValuesFrom = (
  identity: KycIdentity | undefined,
  user: User,
): InsurerFormValues => ({
  policyNumber: '',
  address: {
    street: identity?.address?.street ?? '',
    city: identity?.address?.city ?? '',
    postalCode: identity?.address?.postalCode ?? '',
    countryCode: identity?.address?.countryCode || user.address?.countryCode || ESTONIA,
  },
  citizenship: identity?.citizenship ?? [],
  countryOfBirth: ESTONIA,
  taxResidencyIfNotAddressCountry: '',
  pepSelfDeclaration: identity?.pepSelfDeclaration ?? null,
  notUsPerson: false,
  artea: {
    idDocument: { type: '', number: '', issuedOn: '', validUntil: '', issuingCountry: ESTONIA },
    occupation: { status: '', position: '', employer: '', employerAddress: '', description: '' },
    incomeSources: [],
    incomeSourceDetails: {},
    monthlyNetIncome: '',
    premiumAccountIban: '',
  },
});

const missingAnswer = (field: string) => new Error(`Insurer form answer missing: field=${field}`);

const chosen = <T extends string>(value: T | '', field: string): T => {
  if (value === '') {
    throw missingAnswer(field);
  }
  return value;
};

const answered = (value: string | undefined, field: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw missingAnswer(field);
  }
  return trimmed;
};

const answeredIfAsked = (asked: boolean, value: string | undefined, field: string) =>
  asked ? answered(value, field) : null;

const toArteaQuestionnaire = ({
  idDocument,
  occupation,
  incomeSources,
  incomeSourceDetails,
  monthlyNetIncome,
  premiumAccountIban,
}: ArteaAnswers): ArteaQuestionnaire => ({
  idDocument: {
    type: chosen(idDocument.type, 'idDocument.type'),
    number: answered(idDocument.number, 'idDocument.number'),
    issuedOn: answered(idDocument.issuedOn, 'idDocument.issuedOn'),
    validUntil: answered(idDocument.validUntil, 'idDocument.validUntil'),
    issuingCountry: idDocument.issuingCountry,
  },
  occupation: {
    status: chosen(occupation.status, 'occupation.status'),
    position: answeredIfAsked(asksEmployer(occupation.status), occupation.position, 'position'),
    employer: answeredIfAsked(asksEmployer(occupation.status), occupation.employer, 'employer'),
    employerAddress: answeredIfAsked(
      asksEmployer(occupation.status),
      occupation.employerAddress,
      'employerAddress',
    ),
    description: answeredIfAsked(
      asksOccupationDescription(occupation.status),
      occupation.description,
      'description',
    ),
  },
  incomeSources: INCOME_SOURCES.filter((source) => incomeSources.includes(source)).map(
    (source) => ({
      source,
      details: answeredIfAsked(
        asksIncomeSourceDetails(source),
        incomeSourceDetails[source],
        `incomeSourceDetails.${source}`,
      ),
    }),
  ),
  monthlyNetIncome: chosen(monthlyNetIncome, 'monthlyNetIncome'),
  premiumAccountIban: preProcessIban(premiumAccountIban),
});

export const toCommand = (
  insurer: InsuranceTransferFormInsurer,
  endDate: string | null,
  values: InsurerFormValues,
): CreateInsuranceTransferFormCommand => {
  const { street, city, postalCode, countryCode } = values.address;
  return {
    insurer,
    policyNumber: values.policyNumber.trim(),
    endDate,
    address: {
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      countryCode,
    },
    ...(asksUsPersonDeclaration(insurer) && { usPerson: !values.notUsPerson }),
    ...(asksCitizenshipTaxResidencyAndExposure(insurer) && {
      citizenship: values.citizenship,
      countryOfBirth: values.countryOfBirth,
      taxResidency: taxResidencyOf(values),
      pep: values.pepSelfDeclaration === 'IS_PEP',
    }),
    ...(insurer === 'ARTEA' && { artea: toArteaQuestionnaire(values.artea) }),
  };
};

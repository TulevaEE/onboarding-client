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
import { TranslationKey } from '../../translations';
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

const ERGO_POLICY_NUMBER_DIGITS = 8;
const ERGO_PRINTED_PREFIX = '705';

const isErgoPolicyNumber = (policyNumber: string) => {
  const digits = policyNumber.replace(/\D/g, '');
  return (
    digits.length === ERGO_POLICY_NUMBER_DIGITS ||
    (digits.length === ERGO_PRINTED_PREFIX.length + ERGO_POLICY_NUMBER_DIGITS &&
      digits.startsWith(ERGO_PRINTED_PREFIX))
  );
};

const ARTEA_POLICY_NUMBER =
  /^(?:(?:KK|KP|SK|SP|LK|IK|IP|JK|JP)\d{1,6}|(?:TL|TW|NL|NW|UL|UP)\d{9})$/;

const arteaPolicyNumberAsSent = (policyNumber: string) =>
  policyNumber
    .trim()
    .replace(/^([a-z]{2})\s*-?\s*/i, (_typedPrefix, letters: string) => letters.toUpperCase());

const isArteaPolicyNumber = (policyNumber: string) =>
  ARTEA_POLICY_NUMBER.test(arteaPolicyNumberAsSent(policyNumber));

type PolicyNumberFormat = {
  holds: (policyNumber: string) => boolean;
  messageId: TranslationKey;
};

const POLICY_NUMBER_FORMATS: Partial<Record<InsuranceTransferFormInsurer, PolicyNumberFormat>> = {
  ERGO: { holds: isErgoPolicyNumber, messageId: 'insuranceTransfer.form.policyNumber.format.ERGO' },
  ARTEA: {
    holds: isArteaPolicyNumber,
    messageId: 'insuranceTransfer.form.policyNumber.format.ARTEA',
  },
};

export const policyNumberFormatOf = (insurer: InsuranceTransferFormInsurer) =>
  POLICY_NUMBER_FORMATS[insurer];

const policyNumberAsSent = (insurer: InsuranceTransferFormInsurer, policyNumber: string) =>
  insurer === 'ARTEA' ? arteaPolicyNumberAsSent(policyNumber) : policyNumber.trim();

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

export const detailsOnFile = (
  identity: KycIdentity | undefined,
  pepDeclaredThisSession: PepSelfDeclaration | null,
): DetailsOnFile => {
  const current = isUnderAYearOld(identity);
  return {
    address: current && isComplete(identity?.address),
    citizenship: current && !!identity?.citizenship?.length,
    pep: identity?.pepSelfDeclaration ? current : !!pepDeclaredThisSession,
  };
};

const pepSelfDeclarationFrom = (
  identity: KycIdentity | undefined,
  pepDeclaredThisSession: PepSelfDeclaration | null,
) =>
  isUnderAYearOld(identity)
    ? identity?.pepSelfDeclaration ?? pepDeclaredThisSession
    : pepDeclaredThisSession ?? identity?.pepSelfDeclaration ?? null;

export const defaultValuesFrom = (
  identity: KycIdentity | undefined,
  user: User,
  pepDeclaredThisSession: PepSelfDeclaration | null,
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
  pepSelfDeclaration: pepSelfDeclarationFrom(identity, pepDeclaredThisSession),
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
    policyNumber: policyNumberAsSent(insurer, values.policyNumber),
    endDate,
    address: {
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      countryCode,
    },
    ...(asksCitizenshipTaxResidencyAndExposure(insurer) && {
      citizenship: values.citizenship,
      countryOfBirth: values.countryOfBirth,
      taxResidency: taxResidencyOf(values),
      pep: values.pepSelfDeclaration === 'IS_PEP',
    }),
    ...(insurer === 'ARTEA' && { artea: toArteaQuestionnaire(values.artea) }),
  };
};

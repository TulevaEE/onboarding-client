import { PaymentRate } from '../../flows/secondPillarPaymentRate/types';

export type Application =
  | TransferApplication
  | StopContributionsApplication
  | ResumeContributionsApplication
  | EarlyWithdrawalApplication
  | WithdrawalApplication
  | PaymentApplication
  | SavingsFundPaymentApplication
  | PaymentRateApplication
  | FundPensionOpeningApplication
  | PartialWithdrawalApplication
  | ThirdPillarWithdrawalApplication;

export type PaymentRateApplication = BaseApplication<
  'PAYMENT_RATE',
  {
    paymentRate: number;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export type PaymentApplication = BaseApplication<
  'PAYMENT',
  {
    amount: number;
    currency: Currency;
    targetFund: Fund;
  }
>;

export type SavingsFundPaymentApplication = BaseApplication<
  'SAVING_FUND_PAYMENT',
  {
    amount: number;
    currency: Currency;
    cancellationDeadline: string;
    fulfillmentDeadline: string;
    paymentId: string;
  }
>;

export type TransferApplication = BaseApplication<
  'TRANSFER',
  {
    sourceFund: Fund;
    exchanges: {
      targetFund: Fund | null;
      targetPik: string | null;
      amount: number;
    }[];
    cancellationDeadline: string;
  }
>;

export type StopContributionsApplication = BaseApplication<
  'STOP_CONTRIBUTIONS',
  {
    stopTime: string;
    earliestResumeTime: string;
    cancellationDeadline: string;
  }
>;

export type ResumeContributionsApplication = BaseApplication<
  'RESUME_CONTRIBUTIONS',
  {
    resumeTime: string;
    cancellationDeadline: string;
  }
>;

export type EarlyWithdrawalApplication = BaseApplication<
  'EARLY_WITHDRAWAL',
  {
    depositAccountIBAN: string;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export type WithdrawalApplication = BaseApplication<
  'WITHDRAWAL',
  {
    depositAccountIBAN: string;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export type FundPensionOpeningApplication = BaseApplication<
  'FUND_PENSION_OPENING' | 'FUND_PENSION_OPENING_THIRD_PILLAR',
  {
    depositAccountIBAN: string;
    cancellationDeadline: string;
    fulfillmentDate: string;
    fundPensionDetails: {
      durationYears: number | 0;
      paymentsPerYear: 1 | 4 | 12;
    };
  }
>;

export type PartialWithdrawalApplication = BaseApplication<
  'PARTIAL_WITHDRAWAL',
  {
    depositAccountIBAN: string;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export type ThirdPillarWithdrawalApplication = BaseApplication<
  'WITHDRAWAL_THIRD_PILLAR',
  {
    depositAccountIBAN: string;
    cancellationDeadline: null;
    fulfillmentDate: string;
  }
>;

export type SavingsFundPaymentCancellationCommand = {
  paymentId: string;
};

export type ApplicationType =
  | 'TRANSFER'
  | 'STOP_CONTRIBUTIONS'
  | 'RESUME_CONTRIBUTIONS'
  | 'EARLY_WITHDRAWAL'
  | 'WITHDRAWAL'
  | 'PAYMENT'
  | 'SAVING_FUND_PAYMENT'
  | 'PAYMENT_RATE'
  | 'FUND_PENSION_OPENING'
  | 'FUND_PENSION_OPENING_THIRD_PILLAR'
  | 'PARTIAL_WITHDRAWAL'
  | 'WITHDRAWAL_THIRD_PILLAR';

export type ApplicationStatus = 'PENDING' | 'COMPLETE' | 'FAILED';

export interface BaseApplication<Type extends ApplicationType, Details> {
  id: number;
  status: ApplicationStatus;
  creationTime: string;

  type: Type;
  details: Details;
}

export interface Fund {
  isin: string;
  name: string;
  nav: number | null;
  pillar: Pillar;
  managementFeeRate: number;
  ongoingChargesFigure: number;
  fundManager: FundManager;
  status: FundStatus;
  inceptionDate: string;
}

export type Pillar = 2 | 3;

export type FundStatus =
  | 'ACTIVE'
  | 'LIQUIDATED'
  | 'SUSPENDED'
  | 'CONTRIBUTIONS_FORBIDDEN'
  | 'PAYOUTS_FORBIDDEN';

export interface FundBalance {
  fund: Fund;
  value: number;
  unavailableValue: number;
  currency: string;
  activeContributions: boolean;
  contributions: number;
  subtractions: number;
  profit: number;
  units: number;
}

export interface SourceFund {
  fundManager: FundManager;
  activeFund: boolean;
  name: string;
  pillar: Pillar;
  managementFeePercent: number;
  isin: string;
  price: number;
  unavailablePrice: number;
  currency: string;
  ongoingChargesFigure: number;
  contributions: number;
  subtractions: number;
  profit: number;
  units: number;
}

export interface FundManager {
  name: string;
}

export interface CancellationMandate {
  mandateId: number;
}

export interface Mandate {
  id: number;
  pillar: Pillar;
}

interface Address {
  countryCode: string;
}

interface PaymentRates {
  current: PaymentRate;
  pending: PaymentRate | null;
}

export interface User {
  id: number;
  personalCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  memberNumber: number | null;
  memberJoinDate: string | null;
  pensionAccountNumber: string;
  secondPillarPikNumber: string;
  address: Address;
  secondPillarActive: boolean;
  thirdPillarActive: boolean;
  dateOfBirth: string;
  age: number;
  retirementAge: number;
  secondPillarPaymentRates: PaymentRates;
  secondPillarOpenDate: string | null;
  thirdPillarInitDate: string | null;
  contactDetailsLastUpdateDate: string | null;
}

export interface MemberLookup {
  id: number;
  memberNumber: number;
  firstName: string;
  lastName: string;
  personalCode: string;
}

export interface UserConversion {
  secondPillar: Conversion;
  thirdPillar: Conversion;
  weightedAverageFee: number;
}

export interface Amount {
  yearToDate: number;
  lastYear: number;
  total: number;
}

export interface Conversion {
  selectionComplete: boolean;
  selectionPartial: boolean;
  transfersComplete: boolean;
  transfersPartial: boolean;
  paymentComplete: boolean;
  pendingWithdrawal: boolean;
  contribution: Amount;
  subtraction: Amount;
  weightedAverageFee: number;
}

export interface CapitalRow {
  type: CapitalType;
  contributions: number;
  profit: number;
  value: number;
  unitCount: number;
  unitPrice: number;
  currency: Currency;
}

export interface CapitalTotal {
  unitAmount: number;
  totalValue: number;
  unitPrice: number;
}

export interface CapitalEvent {
  date: string;
  type: CapitalType;
  value: number;
  currency: Currency;
}

export type CapitalType =
  | 'CAPITAL_PAYMENT'
  | 'UNVESTED_WORK_COMPENSATION'
  | 'WORK_COMPENSATION'
  | 'MEMBERSHIP_BONUS'
  | 'CAPITAL_ACQUIRED';

export interface AmlCheck {
  type: string;
  success: boolean;
}

export interface ErrorResponse {
  body: { errors: [{ code: string }] };
}

export interface Token {
  accessToken: string;
  refreshToken: string;
}

export type LoginMethod = 'MOBILE_ID' | 'SMART_ID' | 'ID_CARD' | 'PARTNER';
export type SigningMethod = 'MOBILE_ID' | 'SMART_ID' | 'ID_CARD';
export interface AuthenticationPrincipal extends Token {
  loginMethod: LoginMethod;
  signingMethod: SigningMethod;
}

export interface MobileSignatureResponse {
  challengeCode: string | null; // Can be null during first request of Smart-ID
}

export interface MobileSignatureStatusResponse {
  statusCode: 'SIGNATURE' | 'OUTSTANDING_TRANSACTION';
  challengeCode: string;
}

export interface IdCardSignatureResponse {
  hash: string;
}

export interface IdCardSignatureStatusResponse {
  statusCode: string;
}

export interface Payment {
  type: PaymentType;
  paymentChannel: PaymentChannel;
  recipientPersonalCode: string;
  amount?: number;
  currency?: Currency;
}

export type Currency = 'EUR';

export type PaymentType = 'SINGLE' | 'RECURRING' | 'EMPLOYER' | 'GIFT' | 'MEMBER_FEE' | 'SAVINGS';

export type PaymentChannel =
  | 'SWEDBANK'
  | 'LHV'
  | 'SEB'
  | 'LUMINOR'
  | 'COOP'
  | 'COOP_WEB'
  | 'PARTNER'
  | 'TULUNDUSUHISTU';

export interface Authentication {
  authenticationHash: string;
  challengeCode: string;
}

export interface Transaction {
  amount: number;
  currency: Currency;
  time: string;
  isin: string;
  type: TransactionType;
}

export type TransactionType = 'CONTRIBUTION_CASH' | 'CONTRIBUTION_CASH_WORKPLACE' | 'SUBTRACTION';
export interface BaseContribution {
  time: string;
  sender: string;
  amount: number;
  currency: Currency;
  pillar: Pillar;
}

export interface SecondPillarContribution extends BaseContribution {
  pillar: 2;
  additionalParentalBenefit: number;
  employeeWithheldPortion: number;
  socialTaxPortion: number;
  interest: number;
}

export interface ThirdPillarContribution extends BaseContribution {
  pillar: 3;
}

export type Contribution = SecondPillarContribution | ThirdPillarContribution;

export interface MandateDeadlines {
  transferMandateFulfillmentDate: string;
  periodEnding: string;
  withdrawalFulfillmentDate: string;
  withdrawalLatestFulfillmentDate: string;
  earlyWithdrawalFulfillmentDate: string;
  transferMandateCancellationDeadline: string;
  withdrawalCancellationDeadline: string;
  earlyWithdrawalCancellationDeadline: string;
  paymentRateDeadline: string;
  paymentRateFulfillmentDate: string;
  secondPillarContributionEndDate: string;
}

export interface PaymentLink {
  url: string;
}

export type MemberCapitalListingType = 'BUY' | 'SELL';

export type MemberCapitalListingCreationRequest = {
  type: MemberCapitalListingType;
  bookValue: number;
  totalPrice: number;
  currency: Currency;
  expiryDate: string;
};

export type CreateMemberCapitalListingDto = {
  type: MemberCapitalListingType;
  bookValue: number;
  totalPrice: number;
  currency: Currency;
  expiryTime: string;
};

export type MemberCapitalListing = {
  id: number;
  type: MemberCapitalListingType;
  bookValue: number;
  totalPrice: number;
  currency: Currency;
  expiryTime: string;
  createdTime: string;
  isOwnListing: boolean;
  language: 'et' | 'en';
};

export type ContactListingOwnerDto = {
  id: number;
  addPersonalCode: boolean;
  addPhoneNumber: boolean;
};

export type ContactListingOwnerResponse = {
  id: number;
  status: string;
};

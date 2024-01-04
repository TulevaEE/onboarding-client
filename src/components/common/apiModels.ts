export type Application =
  | TransferApplication
  | StopContributionsApplication
  | ResumeContributionsApplication
  | EarlyWithdrawalApplication
  | WithdrawalApplication
  | PaymentApplication
  | PaymentRateApplication;

export type PaymentRateApplication = BaseApplication<
  ApplicationType.PAYMENT_RATE,
  {
    paymentRate: number;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export type PaymentApplication = BaseApplication<
  ApplicationType.PAYMENT,
  {
    amount: number;
    currency: Currency;
    targetFund: Fund;
  }
>;

export type TransferApplication = BaseApplication<
  ApplicationType.TRANSFER,
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
  ApplicationType.STOP_CONTRIBUTIONS,
  {
    stopTime: string;
    earliestResumeTime: string;
    cancellationDeadline: string;
  }
>;

export type ResumeContributionsApplication = BaseApplication<
  ApplicationType.RESUME_CONTRIBUTIONS,
  {
    resumeTime: string;
    cancellationDeadline: string;
  }
>;

export type EarlyWithdrawalApplication = BaseApplication<
  ApplicationType.EARLY_WITHDRAWAL,
  {
    depositAccountIBAN: string;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export type WithdrawalApplication = BaseApplication<
  ApplicationType.WITHDRAWAL,
  {
    depositAccountIBAN: string;
    cancellationDeadline: string;
    fulfillmentDate: string;
  }
>;

export enum ApplicationType {
  TRANSFER = 'TRANSFER',
  STOP_CONTRIBUTIONS = 'STOP_CONTRIBUTIONS',
  RESUME_CONTRIBUTIONS = 'RESUME_CONTRIBUTIONS',
  EARLY_WITHDRAWAL = 'EARLY_WITHDRAWAL',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  PAYMENT_RATE = 'PAYMENT_RATE',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

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
  pillar: Pillar;
  managementFeeRate: number;
  ongoingChargesFigure: number;
  fundManager: FundManager;
  status: FundStatus;
}

export type Pillar = 2 | 3;

export enum FundStatus {
  ACTIVE = 'ACTIVE',
  LIQUIDATED = 'LIQUIDATED',
  SUSPENDED = 'SUSPENDED',
  CONTRIBUTIONS_FORBIDDEN = 'CONTRIBUTIONS_FORBIDDEN',
  PAYOUTS_FORBIDDEN = 'PAYOUTS_FORBIDDEN',
}

export interface FundBalance {
  fund: Fund;
  value: number;
  unavailableValue: number;
  currency: string;
  activeContributions: boolean;
  contributions: number;
  subtractions: number;
  profit: number;
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
  current: number;
  pending: number;
}

export interface User {
  id: number;
  personalCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  memberNumber: number;
  pensionAccountNumber: string;
  secondPillarPikNumber: string;
  address: Address;
  secondPillarActive: boolean;
  thirdPillarActive: boolean;
  dateOfBirth: string;
  age: number;
  retirementAge: number;
  secondPillarPaymentRates: PaymentRates;
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

export interface InitialCapital {
  membershipBonus: number;
  capitalPayment: number;
  unvestedWorkCompensation: number;
  workCompensation: number;
  profit: number;
  total: number;
  currency: Currency;
}

export interface AmlCheck {
  type: string;
  success: boolean;
}

export interface HttpError {
  body: { errors: [{ code: string }] };
}

export interface Token {
  accessToken: string;
}

export interface MobileSignatureResponse {
  challengeCode: string;
}

export interface MobileSignatureStatusResponse {
  statusCode: string;
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

export enum PaymentType {
  SINGLE = 'SINGLE',
  RECURRING = 'RECURRING',
  EMPLOYER = 'EMPLOYER',
  GIFT = 'GIFT',
  MEMBER_FEE = 'MEMBER_FEE',
}

export enum PaymentChannel {
  SWEDBANK = 'SWEDBANK',
  LHV = 'LHV',
  SEB = 'SEB',
  LUMINOR = 'LUMINOR',
  COOP = 'COOP',
  PARTNER = 'PARTNER',
  TULUNDUSUHISTU = 'TULUNDUSUHISTU',
}

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

export enum TransactionType {
  CONTRIBUTION_CASH = 'CONTRIBUTION_CASH',
  CONTRIBUTION_CASH_WORKPLACE = 'CONTRIBUTION_CASH_WORKPLACE',
  SUBTRACTION = 'SUBTRACTION',
}

export interface Contribution {
  time: string;
  sender: string;
  amount: number;
  currency: Currency;
  pillar: Pillar;
}

export interface MandateDeadlines {
  transferMandateFulfillmentDate: string;
  periodEnding: string;
  withdrawalFulfillmentDate: string;
  earlyWithdrawalFulfillmentDate: string;
  transferMandateCancellationDeadline: string;
  withdrawalCancellationDeadline: string;
  earlyWithdrawalCancellationDeadline: string;
  paymentRateDeadline: string;
  paymentRateFulfillmentDate: string;
}

export interface PaymentLink {
  url: string;
}

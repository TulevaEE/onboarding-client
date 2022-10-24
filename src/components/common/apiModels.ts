export type Application =
  | TransferApplication
  | StopContributionsApplication
  | ResumeContributionsApplication
  | EarlyWithdrawalApplication
  | WithdrawalApplication
  | PaymentApplication;

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

enum FundStatus {
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
  managementFeePercent: string;
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
}

interface Address {
  street: string;
  districtCode: string;
  postalCode: string;
  countryCode: string;
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
  age: number;
}

export interface UserConversion {
  secondPillar: Conversion;
  thirdPillar: Conversion;
}

export interface Amount {
  yearToDate: number;
  total: number;
}

export interface Conversion {
  selectionComplete: boolean;
  transfersComplete: boolean;
  paymentComplete: boolean;
  pendingWithdrawal: boolean;
  contribution: Amount;
  subtraction: Amount;
}

export interface InitialCapital {
  membershipBonus: number;
  capitalPayment: number;
  currency: string;
  unvestedWorkCompensation: number;
  workCompensation: number;
  profit: number;
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
  amount: number;
  currency: Currency;
  bank: string;
}

export type Currency = 'EUR';

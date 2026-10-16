import { TranslationKey } from '../../../translations';
import { BankKey } from '../ThirdPillarPayment/types';

export type StandingOrderBank = BankKey | 'other';

type ChangeMethod = 'EDIT_IN_PLACE' | 'END_AND_RECREATE';

type GuideStep = { text: TranslationKey; amountEntered?: boolean };

export type InternetBank = { url: string; openLabel: TranslationKey };

export type BankGuide = {
  internetBank?: InternetBank;
  changeMethod: ChangeMethod;
  steps: GuideStep[];
};

export const STANDING_ORDER_CHANGE_GUIDES: Record<StandingOrderBank, BankGuide> = {
  swedbank: {
    internetBank: {
      url: 'https://www.swedbank.ee/private/pensions/my/pensionAssets',
      openLabel: 'thirdPillarStandingOrder.openBank.swedbank',
    },
    changeMethod: 'END_AND_RECREATE',
    steps: [
      { text: 'thirdPillarStandingOrder.steps.swedbank.1' },
      { text: 'thirdPillarStandingOrder.steps.swedbank.2', amountEntered: true },
    ],
  },
  seb: {
    internetBank: {
      url: 'https://e.seb.ee/ib/p/payments/standing-orders',
      openLabel: 'thirdPillarStandingOrder.openBank.seb',
    },
    changeMethod: 'EDIT_IN_PLACE',
    steps: [
      { text: 'thirdPillarStandingOrder.steps.seb.1' },
      { text: 'thirdPillarStandingOrder.steps.seb.2', amountEntered: true },
    ],
  },
  lhv: {
    internetBank: {
      url: 'https://www.lhv.ee/ibank/cf/portfolio/payment_standing',
      openLabel: 'thirdPillarStandingOrder.openBank.lhv',
    },
    changeMethod: 'EDIT_IN_PLACE',
    steps: [
      { text: 'thirdPillarStandingOrder.steps.lhv.1' },
      { text: 'thirdPillarStandingOrder.steps.lhv.2', amountEntered: true },
    ],
  },
  luminor: {
    internetBank: {
      url: 'https://luminor.ee/auth/#/web/view/autopilot/',
      openLabel: 'thirdPillarStandingOrder.openBank.luminor',
    },
    changeMethod: 'EDIT_IN_PLACE',
    steps: [
      { text: 'thirdPillarStandingOrder.steps.luminor.1' },
      { text: 'thirdPillarStandingOrder.steps.luminor.2', amountEntered: true },
    ],
  },
  coop: {
    internetBank: {
      url: 'https://i.cooppank.ee/i/standing-orders',
      openLabel: 'thirdPillarStandingOrder.openBank.coop',
    },
    changeMethod: 'EDIT_IN_PLACE',
    steps: [
      { text: 'thirdPillarStandingOrder.steps.coop.1' },
      { text: 'thirdPillarStandingOrder.steps.coop.2', amountEntered: true },
    ],
  },
  other: {
    changeMethod: 'EDIT_IN_PLACE',
    steps: [
      { text: 'thirdPillarStandingOrder.steps.other.1' },
      { text: 'thirdPillarStandingOrder.steps.other.2' },
      { text: 'thirdPillarStandingOrder.steps.other.3', amountEntered: true },
    ],
  },
};

export const isStandingOrderBank = (value: string | null): value is StandingOrderBank =>
  value !== null && Object.keys(STANDING_ORDER_CHANGE_GUIDES).includes(value);

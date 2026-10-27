import { TranslationKey } from '../../../translations';
import {
  BANK_KEYS,
  BankKey,
  BankWithStandingOrderLink,
  hasStandingOrderLink,
} from '../ThirdPillarPayment/types';

export type StandingOrderBank = BankKey | 'other';

type ChangeMethod = 'EDIT_IN_PLACE' | 'END_AND_RECREATE';

type GuideStep = { text: TranslationKey; amountEntered?: boolean };

export type InternetBank = { url: string; openLabel: TranslationKey };

export type BankGuide = {
  internetBank?: InternetBank;
  changeMethod: ChangeMethod;
  steps: GuideStep[];
};

const ANY_OTHER_BANK_GUIDE: BankGuide = {
  changeMethod: 'EDIT_IN_PLACE',
  steps: [
    { text: 'thirdPillarStandingOrder.steps.other.1' },
    { text: 'thirdPillarStandingOrder.steps.other.2' },
    { text: 'thirdPillarStandingOrder.steps.other.3', amountEntered: true },
  ],
};

const STANDING_ORDER_CHANGE_GUIDES: Record<BankWithStandingOrderLink, BankGuide> = {
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
};

export const standingOrderChangeGuideFor = (bank: StandingOrderBank): BankGuide =>
  hasStandingOrderLink(bank) ? STANDING_ORDER_CHANGE_GUIDES[bank] : ANY_OTHER_BANK_GUIDE;

export const isStandingOrderBank = (value: string | null): value is StandingOrderBank =>
  value === 'other' || BANK_KEYS.some((bank) => bank === value);

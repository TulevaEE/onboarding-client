import { MessageDescriptor } from 'react-intl';
import { Fund, UserConversion } from '../../common/apiModels';
import { TranslationKey } from '../../translations';

export interface GraphBarProperties {
  color: string;
  amount: number;
  percentage: number;
  height: number;
  label: string;
}

export interface GraphProperties {
  barCount: 2 | 3;
  hasNegativeValueBar: boolean;
  barProperties: {
    1: GraphBarProperties;
    2: GraphBarProperties;
    3: GraphBarProperties | undefined;
  };
}

export enum PerformanceVerdict {
  POSITIVE_ALPHA = 'POSITIVE_ALPHA',
  NEGATIVE_ALPHA = 'NEGATIVE_ALPHA',
  NEUTRAL = 'NEUTRAL',
}

export enum PerformanceVerdictComparison {
  WORLD_INDEX = 'WORLD_INDEX',
  FUND = 'FUND',
  INFLATION = 'INFLATION',
}

export interface PerformanceVerdictProperties {
  verdict: PerformanceVerdict;
  comparison: PerformanceVerdictComparison;
  amount: number;
}

export interface ContentTextProperties {
  years: number;
  pillar: string;
  ctaLink: string | null;
  shortPeriod: boolean;
}

export interface RootState {
  exchange: { targetFunds: Fund[] };
  thirdPillar: { funds: Fund[] };
  login: {
    user?: {
      secondPillarOpenDate: string;
      thirdPillarInitDate: string;
      secondPillarActive: boolean;
      thirdPillarActive: boolean;
    };
    userConversion: UserConversion;
  };
}

export type BarHeights = {
  personal: number;
  pensionFund: number;
  index: number;
  hasNegativeHeightBar: boolean;
};

export interface FormatValues {
  [key: string]: string | JSX.Element | ((chunks: string | JSX.Element) => JSX.Element);
}

export interface FormatTagsMessageDescriptor extends MessageDescriptor {
  id: TranslationKey;
  values?: FormatValues;
}

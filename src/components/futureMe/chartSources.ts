import { TranslationKey } from '../translations';
import { ChartSourceId } from './chartData';

export const SOURCE_LABELS: Record<ChartSourceId, TranslationKey> = {
  salary: 'futureMe.result.chart.source.salary',
  firstPillar: 'futureMe.result.chart.source.firstPillar',
  specialPension: 'futureMe.result.chart.source.specialPension',
  secondPillar: 'futureMe.result.chart.source.secondPillar',
  secondPillarTaxed: 'futureMe.result.chart.source.secondPillarTaxed',
  thirdPillar: 'futureMe.result.chart.source.thirdPillar',
  deposit: 'futureMe.result.chart.source.deposit',
};

export const SUMMARY_LABELS: Record<ChartSourceId, TranslationKey> = {
  salary: 'futureMe.result.chart.summary.salary',
  firstPillar: 'futureMe.result.chart.summary.firstPillar',
  specialPension: 'futureMe.result.chart.summary.specialPension',
  secondPillar: 'futureMe.result.chart.summary.secondPillar',
  secondPillarTaxed: 'futureMe.result.chart.summary.secondPillarTaxed',
  thirdPillar: 'futureMe.result.chart.summary.thirdPillar',
  deposit: 'futureMe.result.chart.summary.deposit',
};

export const SOURCE_COLORS: Record<ChartSourceId, string> = {
  salary: '#4d7c0f',
  firstPillar: '#6a4fc4',
  specialPension: '#00796b',
  secondPillar: '#0088c2',
  secondPillarTaxed: '#0088c2',
  thirdPillar: '#c26f00',
  deposit: '#b8457a',
};

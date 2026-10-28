import { IntlShape } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { ChartRow, ChartSourceId } from './chartData';
import { ChartEvent, ChartEventKind } from './chartEvents';
import { SOURCE_LABELS } from './chartSources';

const EVENT_LABELS: Record<ChartEventKind, TranslationKey> = {
  pension: 'futureMe.result.chart.event.pension',
  workEnd: 'futureMe.result.chart.event.workEnd',
  statePension: 'futureMe.result.chart.event.statePension',
  fundStart: 'futureMe.result.chart.event.fundStart',
  fundEnd: 'futureMe.result.chart.event.fundEnd',
  depositStart: 'futureMe.result.chart.event.depositStart',
  moneyEnd: 'futureMe.result.chart.event.moneyEnd',
  horizon: 'futureMe.result.chart.event.horizon',
};

export const eventTextOf = (intl: IntlShape, { kind, pillars, years, next }: ChartEvent) =>
  intl.formatMessage({ id: EVENT_LABELS[kind] }, { pillars, years, next });

export const announcementOf = (
  intl: IntlShape,
  row: ChartRow,
  events: ChartEvent[],
  layers: ChartSourceId[],
) => {
  const amounts = layers
    .filter((id) => row[id] > 0)
    .map((id) => `${intl.formatMessage({ id: SOURCE_LABELS[id] })} ${euro(row[id])}`);
  const costs = intl.formatMessage(
    { id: 'futureMe.result.chart.announce.costs' },
    { amount: euro(row.costs) },
  );
  const coverLine = (id: TranslationKey, amount: number) => [
    intl.formatMessage({ id }, { amount: euro(amount) }),
  ];
  let cover: string[] = [];
  if (row.shortfall > 0) {
    cover = coverLine('futureMe.result.chart.announce.missing', row.shortfall);
  } else if (row.surplus > 0) {
    cover = coverLine('futureMe.result.chart.announce.surplus', row.surplus);
  }
  const details = [...amounts, costs, ...cover].join(', ');
  return events.length
    ? intl.formatMessage(
        { id: 'futureMe.result.chart.announce.withEvents' },
        {
          age: row.age,
          events: events.map((event) => eventTextOf(intl, event)).join(', '),
          details,
        },
      )
    : intl.formatMessage({ id: 'futureMe.result.chart.announce.plain' }, { age: row.age, details });
};

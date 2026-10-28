import { Result } from './resultAnswers';

export type ChartEventKind =
  | 'pension'
  | 'workEnd'
  | 'statePension'
  | 'fundStart'
  | 'fundEnd'
  | 'depositStart'
  | 'moneyEnd'
  | 'horizon';

export type FundPillars = 'both' | 'second' | 'third';
export type AfterFundEnd = 'secondContinues' | 'thirdContinues' | 'deposit' | 'stateOnly';

export interface ChartEvent {
  kind: ChartEventKind;
  age: number;
  bad?: boolean;
  pillars?: FundPillars;
  years?: number;
  next?: AfterFundEnd;
}

type FundPillar = 'second' | 'third';

const PAID_FROM = 0.5;
const HAS_MONEY = 1;
const PAYMENTS: Record<FundPillar, 'i2' | 'i3'> = { second: 'i2', third: 'i3' };
const OTHER_PILLAR: Record<FundPillar, FundPillar> = { second: 'third', third: 'second' };
const CONTINUES: Record<FundPillar, AfterFundEnd> = {
  second: 'secondContinues',
  third: 'thirdContinues',
};

const isPaid = (monthly: number) => monthly > PAID_FROM;

export const chartEventsOf = (result: Result): ChartEvent[] => {
  const rows = result.rows.filter(({ age }) => age >= result.pensionStartAge);
  const events: ChartEvent[] = [{ kind: 'pension', age: result.pensionStartAge }];

  const workEnd = rows.find((row, index) => index > 0 && rows[index - 1].work && !row.work);
  if (workEnd) {
    events.push({ kind: 'workEnd', age: workEnd.age });
  }

  if (result.p1StartAge > result.pensionStartAge) {
    events.push({ kind: 'statePension', age: result.p1StartAge });
  }

  // The III pillar paid before the pension age is the chart's first fund pension row.
  const fundStartAge = result.earlyThirdPillar[0]?.age ?? rows.find(({ fp }) => isPaid(fp))?.age;
  if (fundStartAge !== undefined) {
    events.push({ kind: 'fundStart', age: fundStartAge });
  }

  const rowAt = (age: number) => rows.find((row) => row.age === age);
  const paysAt = (pillar: FundPillar, age: number) => isPaid(rowAt(age)?.[PAYMENTS[pillar]] ?? 0);
  const contractsEndingOnTime = (['second', 'third'] as const).flatMap((pillar) => {
    const contract = result.fundPensionContracts[pillar];
    return contract && paysAt(pillar, contract.end - 1) ? [{ pillar, ...contract }] : [];
  });

  const afterFundEnd = (age: number, pillar?: FundPillar): AfterFundEnd => {
    if (pillar && paysAt(OTHER_PILLAR[pillar], age)) {
      return CONTINUES[OTHER_PILLAR[pillar]];
    }
    return isPaid(rowAt(age)?.dep ?? 0) ? 'deposit' : 'stateOnly';
  };
  const [first, second] = contractsEndingOnTime;
  const fundEnds: ChartEvent[] =
    second && first.start === second.start && first.end === second.end
      ? [
          {
            kind: 'fundEnd',
            age: first.end,
            pillars: 'both',
            years: first.end - first.start,
            next: afterFundEnd(first.end),
          },
        ]
      : contractsEndingOnTime.map(({ pillar, start, end }) => ({
          kind: 'fundEnd',
          age: end,
          pillars: pillar,
          years: end - start,
          next: afterFundEnd(end, pillar),
        }));
  events.push(...fundEnds);

  const depositStart = rows.find(({ dep }) => isPaid(dep));
  const fundEndAges = fundEnds.map(({ age }) => age);
  if (depositStart && !fundEndAges.includes(depositStart.age)) {
    events.push({ kind: 'depositStart', age: depositStart.age });
  }

  const hadMoney = rows.some(({ pot, deposit }) => pot + deposit > HAS_MONEY);
  if (result.moneyEndAge !== null && hadMoney) {
    events.push({ kind: 'moneyEnd', age: result.moneyEndAge, bad: true });
  }

  events.push({ kind: 'horizon', age: result.horizonAge });
  return events.sort((a, b) => a.age - b.age);
};

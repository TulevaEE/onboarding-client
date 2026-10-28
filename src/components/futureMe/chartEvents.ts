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

const ONE_CONTRACT_SCENARIO = 'B';
const PAID_FROM = 0.5;
const HAS_MONEY = 1;

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

  const fundStart = rows.find(({ fp }) => isPaid(fp));
  if (fundStart) {
    events.push({ kind: 'fundStart', age: fundStart.age });
  }

  const endOfPaymentsOf = (pillar: 'i2' | 'i3') =>
    rows.find((row, index) => index > 0 && isPaid(rows[index - 1][pillar]) && !isPaid(row[pillar]))
      ?.age;
  const fundEnds: Partial<Record<'second' | 'third', number>> =
    fundStart && result.scenarioId === ONE_CONTRACT_SCENARIO
      ? { second: endOfPaymentsOf('i2'), third: endOfPaymentsOf('i3') }
      : {};

  const afterFundEnd = (age: number, other?: number): AfterFundEnd => {
    if (other !== undefined && other > age) {
      return other === fundEnds.third ? 'thirdContinues' : 'secondContinues';
    }
    return isPaid(rows.find((row) => row.age === age)?.dep ?? 0) ? 'deposit' : 'stateOnly';
  };
  const { second, third } = fundEnds;
  if (fundStart && second !== undefined && second === third) {
    events.push({
      kind: 'fundEnd',
      age: second,
      pillars: 'both',
      years: second - fundStart.age,
      next: afterFundEnd(second),
    });
  } else if (fundStart) {
    (
      [
        ['second', second, third],
        ['third', third, second],
      ] as const
    ).forEach(([pillars, age, other]) => {
      if (age !== undefined) {
        events.push({
          kind: 'fundEnd',
          age,
          pillars,
          years: age - fundStart.age,
          next: afterFundEnd(age, other),
        });
      }
    });
  }

  const depositStart = rows.find(({ dep }) => isPaid(dep));
  const fundEndAges = Object.values(fundEnds);
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

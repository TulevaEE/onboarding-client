export const CURRENT_YEAR = 2026;
const MAX_AGE = 100;
const HORIZON_SURVIVAL = 0.1;

export type Sex = 'M' | 'N' | 'X';

type LifeTableColumns = { M: number[]; N: number[]; K?: number[] };

export interface LifeTable {
  ellujaajad: LifeTableColumns;
  elada_jaanud: LifeTableColumns;
}

type LifeTableKey = keyof LifeTable;

export interface KidsInput {
  b1991?: number;
  b2012?: number;
  b2013?: number;
  b2021?: number;
  bUnknown?: number;
  user?: string;
  earlyUser?: string;
  supUser?: string;
  disabled?: boolean;
  u3?: number;
  u3Left?: number[];
  u3Start?: number[];
  u3StartMonth?: number[];
  iiMonths?: number[];
  b2013noII?: number;
  monthNow?: number;
  inForecast?: 'yes' | 'no' | string;
}

export interface SeparateThirdPillar {
  amount: number;
  mode: 'grow' | 'lump' | 'fund';
  contract?: 'once' | string;
  start?: number;
}

export interface SecondPillarEarlyWithdrawal {
  age: number;
  rejoin?: boolean;
  save?: boolean;
}

export type FirstPillarChoice = 'special' | 'oldAge';

export interface PensionInput {
  birthYear: number;
  sex: Sex;
  p1Monthly: number;
  p2: number;
  p3: number;
  needMonthly: number;
  realReturn: number;
  realReturn3?: number;
  depositReturn?: number;
  extraDeposit?: number;
  pensionAgeYears?: number;
  grossMonthly?: number;
  p2Rate?: number;
  p3Monthly?: number;
  p3Before2021?: boolean;
  p3Indexed?: boolean;
  p3After?: number;
  p3Sep?: SeparateThirdPillar | null;
  wageGrowth?: number;
  inflation?: number;
  firstYearShare?: number;
  incomeTax?: boolean;
  kids?: KidsInput;
  hazard?: 'list1' | 'list2' | string;
  hazardYears?: number;
  undergroundYears?: number;
  rescueYears?: number;
  rescueBasis?: 'toetus' | 'mix' | 'pension' | string;
  civilYears?: number;
  soodus?: number;
  soodusWork?: boolean;
  flexEarly?: number;
  workOn?: boolean;
  workUntil?: number;
  spHas?: boolean;
  spMonthly?: number;
  spStartAge?: number;
  spWork?: boolean;
  spGross?: number;
  firstPillarChoice?: FirstPillarChoice;
  firstPillarChoicePa?: FirstPillarChoice;
  p2Early?: SecondPillarEarlyWithdrawal | null;
}

export interface Scenario {
  id: string;
  name?: string;
  short?: string;
  deferral?: number;
  half?: number;
  contract?: 'once' | string;
  fundFrom?: number;
}

export interface SimulationRow {
  age: number;
  year: number;
  i1: number;
  i1g: number;
  tax1: number;
  isp: number;
  ispg: number;
  taxSp: number;
  i23: number;
  i2: number;
  i3: number;
  fp: number;
  extra: number;
  dep: number;
  spend: number;
  work: boolean;
  shortfall: number;
  moneyLeft: number;
  pot: number;
  deposit: number;
  alive: number;
}

export interface SimulationSummary {
  rows: SimulationRow[];
  pensionStartAge: number;
  p1StartAge: number;
  horizonAge: number;
  startSpend: number;
  startIncome: number;
  coversNeedUntil: number | null;
  gapEnd: number | null;
  gapTemporary: boolean;
  aliveAtShortfall: number;
  moneyEndAge: number | null;
  incomeAfterMoney: number | null;
  spendAt90: number;
  expectedLifetime: number;
}

export interface EarlyWithdrawalResult {
  age: number;
  gross: number;
  tax: number;
  net: number;
  rejoin: boolean;
  save: boolean;
}

export interface FirstPillarComparison {
  special: number;
  oldAge: number;
  paid: FirstPillarChoice;
  larger: FirstPillarChoice;
}

export interface FundPensionContract {
  start: number;
  end: number;
}

export interface SimulationResult extends SimulationSummary {
  ordinaryPensionAge: number;
  fundPensionContracts: Record<'second' | 'third', FundPensionContract | null>;
  childSupplement: { monthly: number; applied: boolean } | null;
  rescueAllowance: { from: number; until: number; monthly: number; pension: number } | null;
  hazardSupplement: number | null;
  p2Early: EarlyWithdrawalResult | null;
  firstPillar:
    | (FirstPillarComparison & {
        atPa: (Omit<FirstPillarComparison, 'special'> & { age: number }) | null;
      })
    | null;
}

export interface PensionAge {
  years: number;
  months: number;
  year: number;
  known: boolean;
  label: string;
}

export interface Decision {
  age: number;
  year: number;
  title: string;
  text: string;
}

export interface OptionState {
  open: boolean;
  reason: string;
}

// SKA flexible old-age pension, average increase per year of deferral (2026)
export const DEFERRAL_INCREASE: Record<number, number> = {
  0: 0,
  1: 0.0793,
  2: 0.1688,
  3: 0.2701,
  4: 0.385,
  5: 0.5157,
};
// SKA flexible old-age pension, lifelong decrease per year taken early (2026)
export const EARLY_DECREASE: Record<number, number> = {
  0: 0,
  1: 0.0717,
  2: 0.1378,
  3: 0.1988,
  4: 0.255,
  5: 0.3067,
};
// Päästeteenistuse seadus § 18 applies until 28.02.2043
export const RESCUE_LAST_YEAR = 2042;
// Average old-age pension with 44 years of service from 1.04.2026 (Vabariigi Valitsus)
export const AVG_OLD_AGE_PENSION = 860.23;

// Avaliku teenistuse seadus § 113 uses the same increase table as Päästeteenistuse seadus § 18 lg 2
export function civilIncrease(years?: number): number {
  return rescueIncrease(years);
}

export function rescueIncrease(years?: number, pensionYear?: number): number {
  if (pensionYear !== undefined && pensionYear > RESCUE_LAST_YEAR) {
    return 0;
  }
  const y = Math.floor(years || 0);
  if (y > 30) {
    return 0.5;
  }
  if (y >= 26) {
    return 0.4;
  }
  if (y >= 21) {
    return 0.25;
  }
  if (y >= 16) {
    return 0.2;
  }
  if (y >= 10) {
    return 0.1;
  }
  return 0;
}

export const TAX_SHORT = 0.1;
// EMTA 2026: 22% income tax, pensioner tax-free income 776 € a month
export const INCOME_TAX = 0.22;
export const PENSIONER_ALLOWANCE = 776 * 12;
// EMTA 2026: general tax-free income 700 € a month
export const GENERAL_ALLOWANCE = 700 * 12;
// SKA, from 1.04.2026
export const AASTAHINNE = 10.477;
// Statistikaamet PA103, average gross monthly wage 2025
const AVG_WAGE = 2092;
// Minimum wage from 1.04.2026
const MIN_WAGE = 946;
export const WAGE_GROWTH = 0.03;
export const INFLATION = 0.02;

// RPKS § 12 and § 13¹: (insurance part + solidarity part) / 2 × aastahinne per year worked
export function workAccrual(
  grossMonthly: number,
  iiContributing: boolean,
  iiJoined: boolean,
): number {
  if (!(grossMonthly > 0)) {
    return 0;
  }
  const share = iiContributing ? 0.8 : 1;
  return (
    (AASTAHINNE *
      ((share * grossMonthly) / AVG_WAGE +
        Math.min(iiJoined ? 0.8 : 1, (share * grossMonthly) / MIN_WAGE))) /
    2
  );
}

function netTenPercent(gross: number, allowance: number): number {
  return gross - TAX_SHORT * Math.max(0, gross - allowance);
}

function grossForNet(net: number, allowance: number): number {
  return net <= allowance ? net : (net - TAX_SHORT * allowance) / (1 - TAX_SHORT);
}

// Statistikaamet RV045, life expectancy at 65 (RPKS § 7 and § 7¹)
export const LIFE_EXP_65: Record<number, number> = {
  2018: 17.94,
  2019: 18.245,
  2020: 18.3,
  2021: 17.06,
  2022: 17.795,
  2023: 18.52,
  2024: 18.755,
  2025: 18.88,
};
const LAST_LE_YEAR = Math.max(...Object.keys(LIFE_EXP_65).map(Number));
const LE_BASE = [2018, 2019, 2020, 2021, 2022].reduce((sum, y) => sum + LIFE_EXP_65[y], 0) / 5;
const le65 = (year: number): number => LIFE_EXP_65[Math.min(year, LAST_LE_YEAR)];

// RPKS § 7 lg 7: the pension age rises by at most 3 months a year
export function pensionAgeMonthsIn(year: number): number {
  let months = 0;
  for (let y = 2027; y <= year; y += 1) {
    let sum = 0;
    for (let k = y - 8; k <= y - 4; k += 1) {
      sum += le65(k);
    }
    const target = Math.round((sum / 5 - LE_BASE) * 12);
    months = Math.min(target, months + 3);
  }
  return months;
}

// RPKS § 7 lg 10: the pension age of the year the person reaches it applies
export function pensionAge(birthYear: number): PensionAge {
  let year = birthYear + 65;
  let months = 0;
  for (let y = birthYear + 65; y <= birthYear + 72; y += 1) {
    const m = pensionAgeMonthsIn(y);
    if (birthYear + 65 + Math.floor(m / 12) === y) {
      year = y;
      months = m;
      break;
    }
  }
  const years = 65 + Math.floor(months / 12);
  const mm = months % 12;
  const known = year <= 2029;
  return {
    years,
    months: mm,
    year,
    known,
    label: `${(known ? '' : 'u ') + years} a${mm ? ` ${mm} k` : ''}`,
  };
}

const averageColumns = new WeakMap<LifeTable, Partial<Record<LifeTableKey, number[]>>>();

function column(table: LifeTable, key: LifeTableKey, sex: Sex): number[] {
  if (sex !== 'X') {
    return table[key][sex];
  }
  const total = table[key].K;
  if (total) {
    return total;
  }
  let cached = averageColumns.get(table);
  if (!cached) {
    cached = {};
    averageColumns.set(table, cached);
  }
  if (!cached[key]) {
    cached[key] = table[key].M.map((v, i) => (v + table[key].N[i]) / 2);
  }
  return cached[key] as number[];
}

export function survival(table: LifeTable, sex: Sex, fromAge: number, age: number): number {
  const survivors = column(table, 'ellujaajad', sex);
  if (age > MAX_AGE) {
    return 0;
  }
  if (age <= fromAge) {
    return 1;
  }
  return survivors[age] / survivors[fromAge];
}

export function horizonAge(table: LifeTable, sex: Sex, fromAge: number): number {
  for (let a = fromAge; a <= MAX_AGE; a += 1) {
    if (survival(table, sex, fromAge, a) <= HORIZON_SURVIVAL) {
      return a;
    }
  }
  return MAX_AGE;
}

export function fundPensionTerm(table: LifeTable, sex: Sex, age: number): number {
  const total = table.elada_jaanud && table.elada_jaanud.K;
  return Math.max(
    1,
    Math.round((total || column(table, 'elada_jaanud', sex))[Math.min(age, MAX_AGE)]),
  );
}

export function retirementYears(
  input: Pick<PensionInput, 'pensionAgeYears' | 'birthYear'>,
): number {
  return input.pensionAgeYears || pensionAge(input.birthYear).years;
}

function yearsFromNow(input: Pick<PensionInput, 'birthYear'>, age: number): number {
  return Math.max(0, age - (CURRENT_YEAR - input.birthYear)) || 0;
}

export function wageFactor(
  input: Pick<PensionInput, 'birthYear' | 'wageGrowth' | 'inflation'>,
  age: number,
): number {
  if (!input.wageGrowth && !input.inflation) {
    return 1;
  }
  const t = yearsFromNow(input, age);
  return (1 + (input.wageGrowth || 0)) ** t / (1 + (input.inflation || 0)) ** (t + 0.5);
}

export function p3Factor(
  input: Pick<PensionInput, 'birthYear' | 'inflation' | 'p3Indexed'>,
  age: number,
): number {
  if (input.p3Indexed !== false) {
    return 1;
  }
  return 1 / (1 + (input.inflation || 0)) ** (yearsFromNow(input, age) + 0.5);
}

export function yearlyContribution(input: PensionInput, age?: number): number {
  const rate = input.p2Rate || 0;
  const isDuringSpecialPension =
    age !== undefined && (input.spMonthly || 0) > 0 && age >= specialStart(input);
  let gross = input.grossMonthly || 0;
  if (isDuringSpecialPension) {
    if (input.spWork === false) {
      gross = 0;
    } else if (input.spGross !== undefined) {
      gross = input.spGross;
    }
  }
  const a = age !== undefined ? age : CURRENT_YEAR - input.birthYear;
  return (
    gross * 12 * (rate > 0 ? rate + 0.04 : 0) * wageFactor(input, a) +
    (input.p3Monthly || 0) * 12 * p3Factor(input, a)
  );
}

// RPKS § 10, SVPS § 1, PäästeTS § 19; RPKS § 6: only one basis applies, the years do not add up
export function earlyYears(input: Partial<PensionInput>): number {
  const kids = input.kids || {};
  const count =
    (kids.b1991 || 0) +
    (kids.b2012 || 0) +
    (kids.b2013 || 0) +
    (kids.b2021 || 0) +
    (kids.bUnknown || 0);
  const earlyUser = kids.earlyUser || kids.user;
  let kidsYears = 0;
  if (earlyUser === 'me') {
    if (kids.disabled || count >= 5) {
      kidsYears = 5;
    } else if (count === 4) {
      kidsYears = 3;
    } else if (count === 3) {
      kidsYears = 1;
    }
  }
  const { hazardYears } = input;
  let hazardEarly = 0;
  if (input.hazard === 'list1') {
    hazardEarly = hazardYears === undefined || hazardYears >= 10 ? 10 : 0;
  } else if (input.hazard === 'list2') {
    hazardEarly = hazardYears === undefined || hazardYears >= 12.5 ? 5 : 0;
  }
  const rescueEarly = (input.rescueYears || 0) >= 15 && input.rescueBasis !== 'pension' ? 5 : 0;
  return Math.max(kidsYears, hazardEarly, rescueEarly);
}

export function rescueUntil(input: PensionInput): number | null {
  if ((input.rescueYears || 0) < 15 || input.rescueBasis === 'pension') {
    return null;
  }
  const kidsYears = earlyYears({ kids: input.kids });
  const pa = retirementYears(input);
  return input.rescueBasis !== 'toetus' && kidsYears > 0 ? pa - kidsYears : pa;
}

// RPKS § 24 lg 1¹ and lg 6, § 28 lg 2 p 12
export function childSupplement(input: PensionInput): number {
  const kids = input.kids || {};
  if ((kids.supUser || kids.user) !== 'me') {
    return 0;
  }
  const noII = !((input.p2 || 0) > 0 || (input.p2Rate || 0) > 0);
  const under3Count = Math.min(kids.u3 || 0, kids.b2021 || 0);
  const older2021 = Math.max(0, (kids.b2021 || 0) - under3Count);
  let part2021 = 0;
  for (let i = 0; i < older2021; i += 1) {
    const knownMonths =
      kids.iiMonths && kids.iiMonths[i] !== undefined ? kids.iiMonths[i] : undefined;
    const defaultMonths = noII ? 0 : 36;
    const months = knownMonths !== undefined ? knownMonths : defaultMonths;
    part2021 += (36 - Math.max(0, Math.min(36, months))) / 36;
  }
  let born2013 = 0;
  if (input.birthYear < 1983) {
    if (kids.b2013noII !== undefined) {
      born2013 = kids.b2013noII;
    } else if (noII) {
      born2013 = kids.b2013 || 0;
    }
  }
  const after2013 = born2013 + (noII ? under3Count : 0) + part2021;
  return AASTAHINNE * 3.5 * ((kids.b1991 || 0) + (kids.b2012 || 0) + after2013);
}

// SVPS § 3
export function hazardSupplement(input: PensionInput): number {
  if (input.hazard !== 'list1') {
    return 0;
  }
  const listYears = Math.max(0, input.hazardYears || 0);
  const undergroundYears = Math.min(listYears, Math.max(0, input.undergroundYears || 0));
  return AASTAHINNE * (0.031 * listYears + 0.219 * undergroundYears);
}

// KoPS § 10, SKA "Perehüvitiste määrad ja maksmine" 18.09.2026
export const CHILD_II_MONTHLY: Record<number, number> = { 2026: 76.12, 2027: 80.76 };

function childIIMonthly(year: number): number {
  const years = Object.keys(CHILD_II_MONTHLY)
    .map(Number)
    .sort((a, b) => a - b);
  return CHILD_II_MONTHLY[years.filter((y) => y <= year).pop() || years[0]];
}

const DEFAULT_MONTHS_UNTIL_CHILD_IS_3 = 18;

export function childPillar2(input: PensionInput, untilAge?: number): number {
  const kids = input.kids || {};
  if ((kids.supUser || kids.user) !== 'me' || !((input.p2Rate || 0) > 0)) {
    return 0;
  }
  const count = Math.min(kids.u3 || 0, kids.b2021 || 0);
  const monthNow = kids.monthNow !== undefined ? kids.monthNow : 0;
  let sum = 0;
  const endYear = untilAge !== undefined ? input.birthYear + untilAge : Infinity;
  for (let i = 0; i < count; i += 1) {
    const knownLeft = kids.u3Left && kids.u3Left[i] !== undefined ? kids.u3Left[i] : undefined;
    const left = Math.max(
      0,
      Math.min(36, knownLeft !== undefined ? knownLeft : DEFAULT_MONTHS_UNTIL_CHILD_IS_3),
    );
    const startYear =
      kids.u3Start && kids.u3Start[i] > CURRENT_YEAR ? kids.u3Start[i] : CURRENT_YEAR;
    const first =
      startYear === CURRENT_YEAR
        ? 12 - monthNow
        : 13 - ((kids.u3StartMonth && kids.u3StartMonth[i]) || 1);
    for (
      let paid = 0, year = startYear, months = Math.min(left, first);
      paid < left && year < endYear;
      year += 1, months = Math.min(12, left - paid)
    ) {
      sum += months * childIIMonthly(year);
      paid += months;
    }
  }
  return sum;
}

export function specialStart(
  input: Pick<PensionInput, 'spStartAge' | 'pensionAgeYears' | 'birthYear'>,
): number {
  return input.spStartAge !== undefined ? input.spStartAge : retirementYears(input);
}

export function decisionMap(input: PensionInput): Decision[] {
  const pa = { ...pensionAge(input.birthYear) };
  if (input.pensionAgeYears) {
    pa.years = input.pensionAgeYears;
    pa.label = `${input.pensionAgeYears} a`;
  }
  const at = (age: number) => input.birthYear + age;
  const p3Age = input.p3Before2021 ? 55 : 60;
  return [
    {
      age: p3Age,
      year: at(p3Age),
      title: 'III sammas soodusmaksuga',
      text: `Väljamaksed 10% tulumaksuga (regulaarne pikk väljamakse 0%), kui kogumist on vähemalt 5 aastat.${
        input.p3Before2021
          ? ' Alates 55, sest alustasid enne 2021.'
          : ' Alates 60, sest alustasid 2021 või hiljem.'
      }`,
    },
    {
      age: 60,
      year: at(60),
      title: 'II sammas ja paindlik riiklik pension',
      text: 'II sammas: ühekordne või lühike fondipension 10%, pikk fondipension 0%. Väljamaksete alustamisel lõpevad II samba sissemaksed igaveseks. Riiklikku pensioni saab võtta kuni 5 aastat varem, vähendatult.',
    },
    {
      age: pa.years,
      year: at(pa.years),
      title: `Riiklik pension täissummas (${pa.label})`,
      text: pa.known
        ? 'Pensioniiga on kehtestatud.'
        : 'Pensioniiga arvutatakse igal aastal uuesti Statistikaameti eluea järgi, seega see on ligikaudne.',
    },
    {
      age: pa.years + 1,
      year: at(pa.years + 1),
      title: 'Riikliku pensioni edasilükkamine',
      text: 'Iga edasilükatud aasta tõstab riiklikku pensioni eluks ajaks: +7,93% (1 a) kuni +51,57% (5 a), 2026 keskmised.',
    },
    {
      age: pa.years,
      year: at(pa.years),
      title: 'Fondipensioni leping: üks kord või igal aastal uuesti',
      text: 'Ühe lepinguga lõpeb väljamakse perioodi lõpus. Kui sõlmid lepingu igal aastal uuesti vähemalt maksuvaba perioodiga, jääb see maksuvabaks ega saa otsa, aga väga kõrges eas on kuumakse väiksem.',
    },
  ].sort((a, b) => a.age - b.age);
}

export function simulate(
  input: PensionInput,
  table: LifeTable,
  scenario: Scenario,
  needOverride?: number,
): SimulationResult {
  const need = needOverride !== undefined ? needOverride : input.needMonthly;
  const r = input.realReturn;
  const r3 = input.realReturn3 !== undefined ? input.realReturn3 : r;
  const rd = input.depositReturn !== undefined ? input.depositReturn : -0.01;
  const pa = retirementYears(input);
  const currentAge = CURRENT_YEAR - input.birthYear;
  const startAge = Math.max(currentAge, 55);
  // RPKS: only one first pillar pension is paid; flexible pension rules do not apply to a special pension
  const spYear = (input.spMonthly || 0) * 12;
  const spStart = specialStart(input);
  const soodus = Math.max(0, input.soodus !== undefined ? input.soodus : earlyYears(input));
  const ret = pa - soodus;
  const deferral = spYear > 0 || soodus > 0 ? 0 : scenario.deferral || 0;
  const p1Start = ret + deferral;
  const half =
    deferral === 0 && spYear === 0 && soodus === 0
      ? Math.min(5, Math.max(0, scenario.half || 0))
      : 0;
  const kidsMonthly = childSupplement(input);
  const kidsApplied = kidsMonthly > 0 && (input.kids || {}).inForecast === 'no';
  const hazardMonthly = hazardSupplement(input);
  const earlyMissing = soodus > 0 && currentAge < ret ? soodus : 0;
  const earlyCut =
    earlyMissing *
    workAccrual(input.grossMonthly || 0, (input.p2Rate || 0) > 0, (input.p2Rate || 0) > 0);
  const p1Base =
    (Math.max(0, input.p1Monthly - earlyCut) + (kidsApplied ? kidsMonthly : 0) + hazardMonthly) *
    12;
  // RPKS § 11¹ lg 4: the increasing coefficient applies to the whole pension
  const flexEarly = soodus > 0 ? Math.min(5, Math.max(0, input.flexEarly || 0)) : 0;
  const serviceIncrease =
    (input.rescueYears || 0) > 0
      ? rescueIncrease(input.rescueYears, input.birthYear + ret)
      : civilIncrease(input.civilYears);
  const p1Factor =
    (1 + DEFERRAL_INCREASE[deferral] + DEFERRAL_INCREASE[half] / 2) *
    (1 - EARLY_DECREASE[flexEarly]) *
    (1 + serviceIncrease);
  const p1Full = p1Base * p1Factor;
  const toetusEnd = flexEarly > 0 ? null : rescueUntil(input);
  const kidsInP1 =
    kidsApplied || (kidsMonthly > 0 && (input.kids || {}).inForecast === 'yes') ? kidsMonthly : 0;
  const toetusYear = Math.max(0, p1Full - kidsInP1 * 12 * p1Factor);
  const workOn = input.workOn !== undefined ? !!input.workOn : soodus > 0 && !!input.soodusWork;
  let defaultWorkUntil = ret + 1;
  if (input.workUntil !== undefined) {
    defaultWorkUntil = input.workUntil;
  } else if (soodus > 0) {
    defaultWorkUntil = pa;
  }
  const workEnd = workOn ? Math.max(ret, defaultWorkUntil) : ret;
  const iiJoined = (input.p2Rate || 0) > 0;
  const accrualYear = 12 * workAccrual(input.grossMonthly || 0, iiJoined, iiJoined);
  const workedBefore = (age: number) =>
    Math.max(0, Math.min(age, workEnd) - Math.max(ret, currentAge));
  const c3After =
    soodus > 0 ? (input.p3After !== undefined ? input.p3After : input.p3Monthly || 0) * 12 : 0;
  const choice = input.firstPillarChoice;
  const prefersSpecial = (choiceMade: FirstPillarChoice | undefined, oldAgeYear: number) => {
    if (choiceMade === 'special') {
      return true;
    }
    if (choiceMade === 'oldAge') {
      return false;
    }
    return spYear >= oldAgeYear;
  };
  const spPaid = spYear > 0 && prefersSpecial(choice, p1Full);
  const p1AtPa = p1Full + accrualYear * workedBefore(pa) * p1Factor;
  const spPaidPa = spPaid && ret < pa ? prefersSpecial(input.firstPillarChoicePa, p1AtPa) : spPaid;
  const spPaidAt = (age: number) => (age >= pa ? spPaidPa : spPaid);
  const p1Year = spPaid ? 0 : p1Full;
  const p1At = (age: number) => {
    if (spPaidAt(age)) {
      return 0;
    }
    return toetusEnd !== null && age < toetusEnd ? toetusYear : p1Full;
  };
  const taxOn = input.incomeTax !== false;
  const allowance = taxOn ? PENSIONER_ALLOWANCE : 0;
  const needYear = need * 12;
  const spAt = (age: number) => {
    if (age < spStart) {
      return 0;
    }
    if (age < p1Start) {
      return spYear;
    }
    return spPaidAt(age) ? spYear : 0;
  };
  const working =
    input.spWork !== false &&
    (input.spGross !== undefined ? input.spGross : input.grossMonthly || 0) > 0;
  const generalAt = (age: number) =>
    taxOn && !(age < ret && working) && !(age >= ret && age < workEnd) ? GENERAL_ALLOWANCE : 0;
  // EMTA: only one tax-free income, while working it is used by the salary
  const allowAt = (age: number) => {
    if (taxOn && age >= ret && age < workEnd) {
      return 0;
    }
    return age >= pa ? allowance : generalAt(age);
  };
  const open2 = Math.max(workEnd, pa - 5);
  const open3 = Math.max(workEnd, input.p3Before2021 ? 55 : 60);

  const sep = input.p3Sep || null;
  const c3 = sep ? (input.p3Monthly || 0) * 12 : 0;
  const pe = input.p2Early || null;
  const isEarlyAgeValid = (age: number) => age >= currentAge && age < Math.min(workEnd, pa - 5);
  const peCut = pe && isEarlyAgeValid(pe.age) ? pe.age : ret;
  let fund = input.p2 + input.p3 + childPillar2(input, Math.min(ret, peCut));
  let fund3 = sep ? sep.amount : 0;
  const share = (a: number) =>
    a === currentAge && input.firstYearShare !== undefined
      ? Math.max(0, Math.min(1, input.firstYearShare))
      : 1;
  // KoPS § 43¹: one early II pillar withdrawal, 22% income tax, rejoining after 5 years
  const peAge = pe && isEarlyAgeValid(pe.age) ? pe.age : null;
  let early: EarlyWithdrawalResult | null = null;
  for (let a = currentAge; a < workEnd; a += 1) {
    if (pe && a === peAge) {
      const tax = taxOn ? INCOME_TAX * fund : 0;
      early = { age: a, gross: fund, tax, net: fund - tax, rejoin: !!pe.rejoin, save: !!pe.save };
      fund = 0;
    }
    const c3a = c3 * p3Factor(input, a) * share(a);
    const stopII = pe !== null && peAge !== null && a >= peAge && !(pe.rejoin && a >= peAge + 5);
    const contrib = stopII
      ? (input.p3Monthly || 0) * 12 * p3Factor(input, a)
      : yearlyContribution(input, a);
    fund = fund * (1 + r) + contrib * share(a) - c3a;
    fund3 = fund3 * (1 + r3) + c3a;
  }

  let deposit =
    (input.extraDeposit || 0) +
    (early && early.save ? early.net * (1 + rd) ** Math.max(0, ret - early.age) : 0);
  const firstRetAge = Math.max(open2, startAge);
  const lump3Age = Math.max(open3, startAge);
  const firstPillarAt = (age: number) => {
    if (age < p1Start) {
      return 0;
    }
    return age < ret + half ? (p1Base / 2) * (1 + serviceIncrease) : p1At(age);
  };
  let allowAtPa =
    firstRetAge >= pa ? Math.max(0, allowance - firstPillarAt(firstRetAge) - spAt(firstRetAge)) : 0;
  const lumpNet = (gross: number) => {
    const used = Math.min(allowAtPa, gross);
    allowAtPa -= used;
    return gross - TAX_SHORT * (gross - used);
  };
  const lumpOut = (pot: number) => (taxOn ? lumpNet(pot) : pot * (1 - TAX_SHORT));
  const onceC = scenario.id === 'C' && scenario.contract === 'once';
  const fundFrom = Math.max(open2, scenario.fundFrom || 0);
  const contractStart = scenario.id === 'B' || onceC ? Math.max(fundFrom, currentAge) : null;
  const contractTerm =
    contractStart !== null ? fundPensionTerm(table, input.sex, contractStart) : 0;
  const once3 = !!(sep && sep.mode === 'fund' && sep.contract === 'once');
  let start3: number | null = null;
  if (sep && once3) {
    start3 = sep.start !== undefined ? sep.start : Math.max(open3, currentAge);
  }
  const term3 = start3 !== null ? fundPensionTerm(table, input.sex, start3) : 0;

  const rows: SimulationRow[] = [];
  for (let age = startAge; age <= MAX_AGE; age += 1) {
    if (scenario.id === 'A' && age === firstRetAge) {
      deposit += lumpOut(fund);
      fund = 0;
    }
    if (sep && sep.mode === 'lump' && age === lump3Age) {
      deposit += lumpOut(fund3);
      fund3 = 0;
    }
    const fundStart = fund + fund3;
    const depositStart = deposit;
    const i1gross =
      age >= p1Start
        ? firstPillarAt(age) +
          (spPaidAt(age) ? 0 : accrualYear * workedBefore(age) * (age < ret + half ? 1 : p1Factor))
        : 0;
    const work = age >= ret && age < workEnd;
    const ispg = spAt(age);
    const allowT = allowAt(age);
    const taxSp = taxOn ? INCOME_TAX * Math.max(0, ispg - allowT) : 0;
    const isp = ispg - taxSp;
    const tax1 =
      taxOn && age >= ret ? INCOME_TAX * Math.max(0, i1gross - Math.max(0, allowT - ispg)) : 0;
    const i1 = i1gross - tax1;
    let allowLeft = 0;
    if (age >= pa) {
      allowLeft = age === firstRetAge ? allowAtPa : Math.max(0, allowance - i1gross - ispg);
    }
    let sched = 0;
    let extraNet = 0;
    let fromDeposit = 0;
    let saved = 0;
    let sched3 = 0;
    let extra3 = 0;
    if (work) {
      saved = i1 + isp;
      deposit += saved;
    } else if (age >= ret) {
      if (age < open2 || (scenario.id === 'D' && age < fundFrom)) {
        sched = 0;
      } else if (scenario.id === 'D' || (scenario.id === 'C' && !onceC)) {
        sched = fund / fundPensionTerm(table, input.sex, age);
      } else if (contractStart !== null && age >= contractStart) {
        // KoPS § 52³ lg 8, § 60¹ lg 5: units are divided by the number of payments still due
        const left = contractTerm - (age - contractStart);
        sched = left > 0 ? fund / left : 0;
      }
      fund -= sched;
      if (
        sep &&
        sep.mode === 'fund' &&
        age >= open3 &&
        (start3 !== null ? age >= start3 : sep.start === undefined || age >= sep.start)
      ) {
        if (start3 !== null) {
          const left3 = term3 - (age - start3);
          sched3 = left3 > 0 ? fund3 / left3 : 0;
        } else {
          sched3 = fund3 / fundPensionTerm(table, input.sex, age);
        }
        fund3 -= sched3;
      }
      const c3a = age < pa ? c3After : 0;
      if (c3a > 0) {
        if (sep) {
          fund3 += c3a;
        } else {
          fund += c3a;
        }
      }
      let gap = needYear + c3a - i1 - isp - sched - sched3;
      if (gap > 0) {
        fromDeposit = Math.min(deposit, gap);
        deposit -= fromDeposit;
        gap -= fromDeposit;
        if (gap > 0 && fund > 0 && age >= open2) {
          const gross = Math.min(fund, grossForNet(gap, allowLeft));
          extraNet = netTenPercent(gross, allowLeft);
          fund -= gross;
          gap -= extraNet;
          allowLeft = Math.max(0, allowLeft - gross);
        }
        if (gap > 0 && fund3 > 0 && age >= open3) {
          const gross3 = Math.min(fund3, grossForNet(gap, allowLeft));
          extra3 = netTenPercent(gross3, allowLeft);
          fund3 -= gross3;
          gap -= extra3;
          allowLeft = Math.max(0, allowLeft - gross3);
        }
      } else {
        saved = -gap;
        deposit += saved;
      }
    }
    if (age >= workEnd) {
      fund *= 1 + r;
      fund3 *= 1 + r3;
    }
    if (age >= ret) {
      deposit *= 1 + rd;
    }
    const income = i1 + isp + sched + extraNet + sched3 + extra3;
    const c3paid = !work && age >= ret && age < pa ? c3After : 0;
    let spend = isp;
    if (work) {
      spend = needYear;
    } else if (age >= ret) {
      spend = income + fromDeposit - saved - c3paid;
    }
    rows.push({
      age,
      year: input.birthYear + age,
      i1: i1 / 12,
      i1g: i1gross / 12,
      tax1: tax1 / 12,
      isp: isp / 12,
      ispg: ispg / 12,
      taxSp: taxSp / 12,
      i23: (sched + extraNet + sched3 + extra3) / 12,
      i2: (sched + extraNet) / 12,
      i3: (sched3 + extra3) / 12,
      fp: (sched + sched3) / 12,
      extra: (extraNet + extra3) / 12,
      dep: fromDeposit / 12,
      spend: spend / 12,
      work,
      shortfall: age >= ret ? Math.max(0, needYear - spend) / 12 : 0,
      moneyLeft: fundStart + depositStart,
      pot: fundStart,
      deposit: depositStart,
      alive: survival(table, input.sex, currentAge, age),
    });
  }
  const showAtPa = spPaid && ret < pa && (p1AtPa > p1Full + 0.5 * 12 || p1AtPa > spYear);
  return {
    ...summarize(rows, input, table, ret, p1Start, currentAge),
    ordinaryPensionAge: pa,
    fundPensionContracts: {
      second:
        contractStart !== null ? { start: contractStart, end: contractStart + contractTerm } : null,
      third: start3 !== null ? { start: start3, end: start3 + term3 } : null,
    },
    childSupplement: kidsMonthly > 0 ? { monthly: kidsMonthly, applied: kidsApplied } : null,
    rescueAllowance:
      toetusEnd !== null && toetusEnd > ret
        ? { from: ret, until: toetusEnd, monthly: toetusYear / 12, pension: p1Year / 12 }
        : null,
    hazardSupplement: hazardMonthly > 0 ? hazardMonthly : null,
    p2Early: early,
    firstPillar:
      spYear > 0
        ? {
            special: spYear / 12,
            oldAge: p1Full / 12,
            paid: spPaid ? 'special' : 'oldAge',
            larger: spYear >= p1Full ? 'special' : 'oldAge',
            atPa: showAtPa
              ? {
                  age: pa,
                  oldAge: p1AtPa / 12,
                  paid: spPaidPa ? 'special' : 'oldAge',
                  larger: spYear >= p1AtPa ? 'special' : 'oldAge',
                }
              : null,
          }
        : null,
  };
}

export function options(input: PensionInput): {
  deferral: OptionState;
  p2: OptionState;
  p3: OptionState;
} {
  const hasSpecialPension = !!input.spHas || (input.spMonthly || 0) > 0;
  const soodus = (input.soodus !== undefined ? input.soodus : earlyYears(input)) > 0;
  let deferral: OptionState = { open: true, reason: '' };
  if (hasSpecialPension) {
    deferral = {
      open: false,
      reason:
        'Eripensionile paindliku pensioni reeglid ei kehti: eripensioni ei saa edasi lükata, varem võtta ega peatada.',
    };
  } else if (soodus) {
    deferral = {
      open: false,
      reason:
        (input.flexEarly || 0) > 0
          ? 'Lähed paindliku pensioniga varem, seega pensioni edasi lükata ega pooleks võtta ei saa.'
          : 'Lähed pensionile varem soodustusega (lapsed, tervist kahjustav töö või päästeteenistus). Siis ei saa pensioni edasi lükata ega pooleks võtta.',
    };
  }
  return {
    deferral,
    p2:
      (input.p2 || 0) > 0 || (input.p2Rate || 0) > 0
        ? { open: true, reason: '' }
        : { open: false, reason: 'II sammast ei ole.' },
    p3:
      (input.p3 || 0) > 0 || (input.p3Monthly || 0) > 0 || !!input.p3Sep
        ? { open: true, reason: '' }
        : { open: false, reason: 'III sammast ei ole.' },
  };
}

function summarize(
  rows: SimulationRow[],
  input: PensionInput,
  table: LifeTable,
  pa: number,
  p1Start: number,
  currentAge: number,
): SimulationSummary {
  const fromPa = rows.filter((x) => x.age >= pa);
  const short = fromPa.find((x) => x.shortfall > 0.5);
  let gapEnd: number | null = null;
  let gapTemporary = false;
  if (short) {
    let i = rows.indexOf(short);
    while (i + 1 < rows.length && rows[i + 1].shortfall > 0.5) {
      i += 1;
    }
    gapEnd = rows[i].age;
    gapTemporary = gapEnd < MAX_AGE && !rows.slice(i + 1).some((x) => x.shortfall > 0.5);
  }
  const empty = fromPa.find((x) => x.moneyLeft < 1 && x.age >= p1Start);
  const at = (age: number) => rows.find((x) => x.age === age);
  const startRow = at(pa) || rows[0];
  const horizon = horizonAge(table, input.sex, currentAge);
  return {
    rows,
    pensionStartAge: pa,
    p1StartAge: p1Start,
    horizonAge: horizon,
    startSpend: startRow.spend,
    startIncome: startRow.i1 + startRow.isp + startRow.i23 + startRow.dep,
    coversNeedUntil: short ? short.age : null,
    gapEnd,
    gapTemporary,
    aliveAtShortfall: short ? short.alive : 0,
    moneyEndAge: empty ? empty.age : null,
    incomeAfterMoney: empty ? empty.i1 + empty.isp : null,
    spendAt90: (at(90) || { spend: 0 }).spend,
    expectedLifetime: fromPa.reduce((sum, x) => sum + x.spend * 12 * x.alive, 0),
  };
}

const SUSTAINABLE_NEED_SEARCH_STEPS = 30;
const SUSTAINABLE_NEED_MAX = 10000;

export function sustainableNeed(input: PensionInput, table: LifeTable, scenario: Scenario): number {
  let lo = 0;
  let hi = SUSTAINABLE_NEED_MAX;
  for (let i = 0; i < SUSTAINABLE_NEED_SEARCH_STEPS; i += 1) {
    const m = (lo + hi) / 2;
    const s = simulate(input, table, scenario, m);
    if (s.coversNeedUntil === null || s.coversNeedUntil > s.horizonAge) {
      lo = m;
    } else {
      hi = m;
    }
  }
  return Math.floor(lo / 10) * 10;
}

export function bestDeferral(
  input: PensionInput,
  table: LifeTable,
  scenario: Scenario,
): number | null {
  for (let d = scenario.deferral || 0; d >= 0; d -= 1) {
    const s = simulate(input, table, { ...scenario, deferral: d });
    if (s.coversNeedUntil === null || s.coversNeedUntil > s.horizonAge) {
      return d;
    }
  }
  return null;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'A',
    name: 'Kõik korraga',
    short: 'II ja III sammas ühekordselt välja (10% maks), raha hoiusel, kasutad vajaduse järgi.',
  },
  {
    id: 'B',
    name: 'Üks fondipensioni leping',
    short: 'Maksuvaba fondipension elada jäänud aastate peale. Leping lõpeb perioodi lõpus.',
  },
  {
    id: 'C',
    name: 'Sild ja riiklik pension hiljem',
    short:
      'Riiklik pension algab hiljem ja on eluks ajaks suurem. Seni elad sambast: maksuvaba fondipension (leping igal aastal uuesti), puudu jääv osa lisaväljamaksena.',
  },
  {
    id: 'D',
    name: 'Leping igal aastal uuesti',
    short:
      'Maksuvaba fondipension, mille lepingu sõlmid igal aastal uuesti. Ei saa otsa, aga väheneb vanas eas.',
  },
];

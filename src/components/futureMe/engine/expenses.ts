import expensesData from './expenses.json';

export type Household = 'alone' | 'couple';
export type CostLevel = 'frugal' | 'optimal' | 'comfortable';
export type CostCategoryId = (typeof expensesData.categories)[number]['id'];
export type CostLineId = CostCategoryId | 'other';

export interface CostLine {
  id: CostLineId;
  amount: number;
}

export interface CostFacts {
  foodPerDay: number;
  fuelTanks: number;
  cafeLunches: number;
  tripsPerYear: number;
  gifts: number;
}

export const HOUSEHOLDS: Household[] = ['alone', 'couple'];
export const COST_LEVELS: CostLevel[] = ['frugal', 'optimal', 'comfortable'];
export const OWN_COST_LINE: CostLineId = 'other';
export const CARE_HOME_OWN_SHARES = { cheaper: 750, average: 950, dearer: 1050 };

export type CareHomeCoverage = {
  covers: 'dearer' | 'average' | 'cheaper' | 'none';
  missing: number;
};

const NEXT_DEARER_PLACE = {
  dearer: 0,
  average: CARE_HOME_OWN_SHARES.dearer,
  cheaper: CARE_HOME_OWN_SHARES.average,
  none: CARE_HOME_OWN_SHARES.cheaper,
};
const ROUND_TO_EUROS = 10;

export const careHomeCoverage = (monthlyNeed: number): CareHomeCoverage => {
  const covers = (['dearer', 'average', 'cheaper'] as const).find(
    (place) => monthlyNeed >= CARE_HOME_OWN_SHARES[place],
  );
  const place = covers ?? 'none';
  const gap = Math.max(0, NEXT_DEARER_PLACE[place] - monthlyNeed);
  const rounded = Math.round(gap / ROUND_TO_EUROS) * ROUND_TO_EUROS;
  return { covers: place, missing: gap > 0 ? Math.max(ROUND_TO_EUROS, rounded) : 0 };
};

export const { studyYear, pricesAsOf, priceFactor } = expensesData;

const PRICE = { fuelTank: 80, packageTrip: 900, cafeLunch: 12 };
const DAYS_IN_MONTH = 365 / 12;
const MONTHS_IN_YEAR = 12;
const MIN_FUEL_TANKS = 0.5;

const categoryAmount = (id: CostCategoryId, household: Household, level: CostLevel): number => {
  const category = expensesData.categories.find((candidate) => candidate.id === id);
  return category ? category[household][level] : 0;
};

const extraOverFrugal = (id: CostCategoryId, household: Household, level: CostLevel): number =>
  Math.max(0, categoryAmount(id, household, level) - categoryAmount(id, household, 'frugal'));

export const costLines = (household: Household, level: CostLevel): CostLine[] => [
  ...expensesData.categories.map((category) => ({
    id: category.id,
    amount: category[household][level],
  })),
  { id: OWN_COST_LINE, amount: 0 },
];

export const levelTotal = (household: Household, level: CostLevel): number =>
  costLines(household, level).reduce((sum, line) => sum + line.amount, 0);

export const costFacts = (household: Household, level: CostLevel): CostFacts => {
  const amount = (id: CostCategoryId) => categoryAmount(id, household, level);
  const extra = (id: CostCategoryId) => extraOverFrugal(id, household, level);
  const trips =
    ((extra('leisure') + extra('cafesAndAccommodation')) * MONTHS_IN_YEAR) / PRICE.packageTrip;
  return {
    foodPerDay: Math.round(amount('food') / DAYS_IN_MONTH),
    fuelTanks: Math.max(MIN_FUEL_TANKS, Math.round((amount('transport') / PRICE.fuelTank) * 2) / 2),
    cafeLunches: Math.max(1, Math.round(amount('cafesAndAccommodation') / PRICE.cafeLunch)),
    tripsPerYear: Math.round(trips),
    gifts: amount('gifts'),
  };
};

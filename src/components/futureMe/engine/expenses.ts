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
  beefOnHolidaysOnly: boolean;
  beefKg: number;
  fuelTanks: number;
  cafeLunches: number;
  tripsPerYear: number;
  gifts: number;
}

export const HOUSEHOLDS: Household[] = ['alone', 'couple'];
export const COST_LEVELS: CostLevel[] = ['frugal', 'optimal', 'comfortable'];
export const OWN_COST_LINE: CostLineId = 'other';
export const CARE_HOME_SHARE = 1000;

export const { studyYear, pricesAsOf, priceFactor } = expensesData;

const PRICE = { fuelTank: 80, beefKg: 10, trip: 1800, cafeLunch: 12 };
const BEEF_SHARE_OF_FOOD_EXTRA = 0.4;
const MONTHS_IN_YEAR = 12;
const BEEF_ON_HOLIDAYS_ONLY_BELOW_KG = 1.5;
const MIN_FUEL_TANKS = 0.5;

const categoryAmount = (id: CostCategoryId, household: Household, level: CostLevel): number => {
  const category = expensesData.categories.find((candidate) => candidate.id === id);
  return category ? category[household][level] : 0;
};

const extraOverFrugal = (id: CostCategoryId, household: Household, level: CostLevel): number =>
  Math.max(0, categoryAmount(id, household, level) - categoryAmount(id, household, 'frugal'));

const oneDecimal = (value: number): number => Math.round(value * 10) / 10;

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
  const beefKg = 1 + (extra('food') * BEEF_SHARE_OF_FOOD_EXTRA) / PRICE.beefKg;
  const trips = ((extra('leisure') + extra('cafesAndAccommodation')) * MONTHS_IN_YEAR) / PRICE.trip;
  return {
    beefOnHolidaysOnly: beefKg < BEEF_ON_HOLIDAYS_ONLY_BELOW_KG,
    beefKg: oneDecimal(beefKg),
    fuelTanks: Math.max(MIN_FUEL_TANKS, Math.round((amount('transport') / PRICE.fuelTank) * 2) / 2),
    cafeLunches: Math.max(1, Math.round(amount('cafesAndAccommodation') / PRICE.cafeLunch)),
    tripsPerYear: Math.round(trips),
    gifts: amount('gifts'),
  };
};

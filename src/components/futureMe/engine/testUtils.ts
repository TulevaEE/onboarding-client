import lifeTableData from './lifeTable.json';
import {
  LifeTable,
  PensionInput,
  Scenario,
  SCENARIOS,
  simulate,
  SimulationResult,
  SimulationRow,
  sustainableNeed,
} from './pension';

export const lifeTable: LifeTable = lifeTableData;

export const [scenarioA, scenarioB, scenarioC, scenarioD] = SCENARIOS;

export const simulateWithoutIncomeTax = (
  input: PensionInput,
  table: LifeTable,
  scenario: Scenario,
  needOverride?: number,
): SimulationResult => simulate({ ...input, incomeTax: false }, table, scenario, needOverride);

export const sustainableNeedWithoutIncomeTax = (
  input: PensionInput,
  table: LifeTable,
  scenario: Scenario,
): number => sustainableNeed({ ...input, incomeTax: false }, table, scenario);

export const rowAt = ({ rows }: SimulationResult, age: number): SimulationRow => {
  const row = rows.find((candidate) => candidate.age === age);
  if (!row) {
    throw new Error(`No simulation row: age=${age}`);
  }
  return row;
};

export const within = (tolerance: number): number => -Math.log10(2 * tolerance);

export const isWithin = (actual: number, expected: number, tolerance: number): boolean =>
  Math.abs(actual - expected) <= tolerance;

export const yearsCovered = ({ coversNeedUntil }: SimulationResult): number =>
  coversNeedUntil === null ? 101 : coversNeedUntil;

export const keepGrowingScenario: Scenario = { id: 'E' };

export const coversNeedUntilHorizon = ({
  coversNeedUntil,
  horizonAge,
}: SimulationResult): boolean => coversNeedUntil === null || coversNeedUntil > horizonAge;

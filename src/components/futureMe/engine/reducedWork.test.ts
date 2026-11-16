import {
  PensionInput,
  simulate,
  workAccrual,
  yearlyContribution,
  yearlyThirdPillarContribution,
} from './pension';
import { lifeTable, scenarioA } from './testUtils';

const base: PensionInput = {
  birthYear: 1975,
  sex: 'N',
  pensionAgeYears: 65,
  p1Monthly: 1000,
  p2: 50000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 2000,
  p2Rate: 0.02,
  p3Monthly: 100,
  needMonthly: 1000,
  realReturn: 0,
  depositReturn: -0.01,
  extraDeposit: 0,
};
const REDUCED_FROM = 60;
const reduced: PensionInput = {
  ...base,
  reducedFrom: REDUCED_FROM,
  reducedGross: 1200,
  reducedP3Monthly: 40,
};

describe('working less in the last years before the pension age', () => {
  it('pays the II pillar from the lower salary from the age the workload drops', () => {
    expect(yearlyContribution(reduced, REDUCED_FROM - 1)).toBe(
      yearlyContribution(base, REDUCED_FROM - 1),
    );
    expect(yearlyContribution(reduced, REDUCED_FROM)).toBe(
      yearlyContribution({ ...base, grossMonthly: 1200, p3Monthly: 40 }, REDUCED_FROM),
    );
  });

  it('pays the new III pillar amount from the age the workload drops', () => {
    expect(yearlyThirdPillarContribution(reduced, REDUCED_FROM - 1)).toBe(
      yearlyThirdPillarContribution(base, REDUCED_FROM - 1),
    );
    expect(yearlyThirdPillarContribution(reduced, REDUCED_FROM)).toBe(
      yearlyThirdPillarContribution({ ...base, p3Monthly: 40 }, REDUCED_FROM),
    );
  });

  it('lowers the state pension by what the lower salary accrues less in those years', () => {
    const yearsReduced = 65 - REDUCED_FROM;
    const accrualLost = workAccrual(2000, true, true) - workAccrual(1200, true, true);
    const statePensionAt65 = (input: PensionInput) =>
      simulate(input, lifeTable, scenarioA).rows.find(({ age }) => age === 65)?.i1g;

    expect(statePensionAt65(reduced)).toBeCloseTo(
      statePensionAt65({ ...base, p1Monthly: 1000 - yearsReduced * accrualLost }) ?? 0,
      6,
    );
  });

  it('keeps the lower salary when working on after the pension age', () => {
    const yearsReduced = 65 - REDUCED_FROM;
    const accrualLost = workAccrual(2000, true, true) - workAccrual(1200, true, true);
    const workingOn = { workOn: true, workUntil: 68 };
    const statePensionAt68 = (input: PensionInput) =>
      simulate(input, lifeTable, scenarioA).rows.find(({ age }) => age === 68)?.i1g;

    expect(statePensionAt68({ ...reduced, ...workingOn })).toBeCloseTo(
      statePensionAt68({
        ...base,
        ...workingOn,
        grossMonthly: 1200,
        p1Monthly: 1000 - yearsReduced * accrualLost,
      }) ?? 0,
      6,
    );
  });

  it('accrues the full salary for the years worked on before the workload drops', () => {
    const retiresAt55AndWorksOn = { hazard: 'list1', hazardYears: 10, workOn: true, workUntil: 63 };
    const statePensionAt = (input: PensionInput, age: number) =>
      simulate({ ...input, ...retiresAt55AndWorksOn }, lifeTable, scenarioA).rows.find(
        (row) => row.age === age,
      )?.i1g ?? 0;

    expect(statePensionAt(reduced, REDUCED_FROM)).toBeCloseTo(
      statePensionAt(base, REDUCED_FROM),
      6,
    );
    expect(statePensionAt(reduced, 63)).toBeLessThan(statePensionAt(base, 63));
  });

  it('pays the II pillar from the lower salary when a special pension changed the salary before', () => {
    const specialPensionFrom55 = { spMonthly: 800, spStartAge: 55, spWork: true, spGross: 1500 };
    const withSpecialPension = { ...reduced, ...specialPensionFrom55 };

    expect(yearlyContribution(withSpecialPension, REDUCED_FROM - 1)).toBe(
      yearlyContribution({ ...base, grossMonthly: 1500 }, REDUCED_FROM - 1),
    );
    expect(yearlyContribution(withSpecialPension, REDUCED_FROM)).toBe(
      yearlyContribution({ ...base, grossMonthly: 1200, p3Monthly: 40 }, REDUCED_FROM),
    );
  });

  it('pays the II pillar from the special pension salary when it changes after the workload drops', () => {
    const specialPensionFrom62 = { spMonthly: 800, spStartAge: 62, spWork: true, spGross: 1500 };
    const withSpecialPension = { ...reduced, ...specialPensionFrom62 };

    expect(yearlyContribution(withSpecialPension, 62)).toBe(
      yearlyContribution({ ...base, grossMonthly: 1500, p3Monthly: 40 }, 62),
    );
  });
});

import React from 'react';
import { useContributions } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { SecondPillarContribution } from '../common/apiModels';

export const FirstVsSecondPillarComparison = () => {
  const { data: contributions } = useContributions();

  if (!contributions) {
    return (
      <section className="mt-5">
        <Shimmer height={32} />
      </section>
    );
  }

  const contribs = contributions
    .filter((contribution): contribution is SecondPillarContribution => contribution.pillar === 2)
    .map(
      (contribution) =>
        ({
          ...contribution,
          time: minusOneMonth(contribution.time),
        } as SecondPillarContribution),
    )
    .filter(
      ({ time }) =>
        new Date(time) >= new Date('2018-01-01') && new Date(time) <= new Date('2024-12-31'),
    )
    .map((contribution) => {
      const salary = contribution.employeeWithheldPortion / 0.02;
      const socialTaxPensionInsurancePortion = salary * 0.2;
      return {
        ...contribution,
        socialTaxPensionInsurancePortion,
      };
    });

  type YearTotals = Record<number, number>;

  const totalsByYear = contribs.reduce((acc, { time, socialTaxPensionInsurancePortion }) => {
    const year = new Date(time).getUTCFullYear();
    acc[year] = (acc[year] ?? 0) + socialTaxPensionInsurancePortion;
    return acc;
  }, {} as YearTotals);

  interface YearStat {
    year: number;
    total: number;
    average: number;
    ratio: number;
    ratioWithReduction: number;
  }

  const yearStats: YearStat[] = Object.keys({
    ...totalsByYear,
    ...AVG_PERSONALIZED_SOCIAL_TAX_PENSION_COMPONENT_EUR_BY_YEAR,
  })
    .map(Number)
    .filter((y) => y >= 2018 && y <= 2024)
    .sort((a, b) => a - b)
    .map((year) => {
      const total = totalsByYear[year] ?? 0;
      const average = AVG_PERSONALIZED_SOCIAL_TAX_PENSION_COMPONENT_EUR_BY_YEAR[year];

      const base = total / average;
      const ratio = year <= 2020 ? base : base * 0.5 + 0.5;
      const ratioWithReduction = ratio * 0.8;

      return { year, total, average, ratio, ratioWithReduction };
    });

  return (
    <>
      <>year – total – average – ratio – ratioWithReduction</>
      <br />
      {yearStats.map((yearStat) => (
        <>
          {yearStat.year} – {yearStat.total.toFixed(2)} – {yearStat.average} –{' '}
          {yearStat.ratio.toFixed(3)} – {yearStat.ratioWithReduction.toFixed(3)}
          <br />
        </>
      ))}
    </>
  );
};

export const AVG_PERSONALIZED_SOCIAL_TAX_PENSION_COMPONENT_EUR_BY_YEAR: Record<number, number> = {
  2024: 4567.33,
  2023: 4212.07,
  2022: 3786.82,
  2021: 3433.03,
  2020: 3234.45,
  2019: 3057.23,
  2018: 2838.48,
} as const;

const minusOneMonth = (isoDate: string): string => {
  const date = new Date(isoDate);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString();
};

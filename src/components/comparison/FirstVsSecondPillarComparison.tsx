/* eslint-disable no-irregular-whitespace */

import React from 'react';
import { useContributions, useSourceFunds } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { SecondPillarContribution } from '../common/apiModels';
import { Euro } from '../common/Euro';

export const FirstVsSecondPillarComparison = () => {
  const { data: contributions } = useContributions();
  const { data: sourceFunds } = useSourceFunds();

  if (!contributions || !sourceFunds) {
    return (
      <section className="mt-5">
        <Shimmer height={32} />
      </section>
    );
  }

  const secondPillarSum = sourceFunds
    ?.filter(({ pillar }) => pillar === 2)
    .reduce((total, { price, unavailablePrice }) => total + price + unavailablePrice, 0);

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

  const totalDiff = yearStats.reduce(
    (acc, { ratio, ratioWithReduction }) => acc + (ratio - ratioWithReduction),
    0,
  );

  const pricePerUnit = 10.0; // EUR

  const impactOfReduction = totalDiff * pricePerUnit; // EUR per month

  const breakEven = secondPillarSum / impactOfReduction;

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      <div className="card shadow-lg border-0 rounded-4 p-4 mt-4">
        <h1 className="mb-4 text-center">Kui palju vähendab II sambas kogumine sinu I sammast?</h1>
        <p className="m-0 text-center">
          Kui kogud II sambasse, suunab riik sinna osa sinu sotsiaalmaksust. Seepärast koguneb sulle
          II sambasse rohkem raha, aga I samba pension tuleb tulevikus veidi väiksem.
        </p>
        <p className="mt-3 text-center">Võrdle ise, kumb tundub sulle kasulikum.</p>
        <div className="row g-3" id="results" aria-live="polite">
          <div className="col-12 col-md-6">
            <div className="card result-card alert alert-danger text-center border-0 m-0">
              <div className="card-body">
                <h2 className="fw-bold">
                  -<Euro amount={impactOfReduction} fractionDigits={0} />
                  <span className="fs-6"> kuus</span>
                </h2>
                <p className="card-text mb-0 fw-medium">Vähem I sambast</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card result-card alert alert-success text-center border-0 m-0">
              <div className="card-body">
                <h2 className="fw-bold">
                  +<Euro amount={secondPillarSum} fractionDigits={0} />
                </h2>
                <p className="card-text mb-0 fw-medium">Rohkem II sambas</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-3 mb-1 fs-6">
          Tasuvusaeg ≈<strong id="breakEven"> {breakEven.toFixed(0)} aastat</strong>
        </p>
        <p className="text-center text-muted small mt-3">
          Arvestame aastaid 2018–2024, sest see on periood, mil Tuleva on tegutsenud ja mille kohta
          on meil andmed olemas. 2025. aastat see ei arvesta, sest I samba õiguseid arvutatakse
          täisaasta kohta. Mõlemad summad on tänases väärtuses. Pea meeles, et tulevikus mõjutavad
          I sammast ka indekseerimine ning II sammast tootlust.
        </p>
        <p className="text-center mb-0">
          <a href="?asdf">Kuidas see arvutus täpselt käib?</a>
        </p>
      </div>

      <div className="m-5 text-white small">
        <>year – total – average – ratio – ratioWithReduction</>
        <br />
        {yearStats.map((yearStat) => (
          <>
            {yearStat.year} – {yearStat.total.toFixed(2)} – {yearStat.average} –{' '}
            {yearStat.ratio.toFixed(3)} – {yearStat.ratioWithReduction.toFixed(3)}
            <br />
          </>
        ))}
      </div>
    </div>
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

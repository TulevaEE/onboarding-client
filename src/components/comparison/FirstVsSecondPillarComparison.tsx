/* eslint-disable no-irregular-whitespace */
/* eslint-disable no-console */

import React from 'react';
import { Link } from 'react-router-dom';
import { useContributions, useSourceFunds } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { SecondPillarContribution } from '../common/apiModels';
import { Euro } from '../common/Euro';
import { useReturns } from '../account/ComparisonCalculator/returnComparisonHooks';
import { Key } from '../account/ComparisonCalculator/api';

export const FirstVsSecondPillarComparison = () => {
  const BEGINNING_OF_TIME = '2000-01-01';
  const fromDate = '2018-01-01';
  const toDate = '2024-12-31';
  const yearsBetween = 7;

  const { data: contributions } = useContributions();
  const { data: beginSourceFunds } = useSourceFunds(BEGINNING_OF_TIME, fromDate);
  const { data: endSourceFunds } = useSourceFunds(BEGINNING_OF_TIME, toDate);
  const { data: returnsResponse } = useReturns([Key.SECOND_PILLAR], fromDate, toDate);

  if (!contributions || !beginSourceFunds || !endSourceFunds || !returnsResponse) {
    return (
      <section className="mt-5">
        <Shimmer height={32} />
      </section>
    );
  }

  const { returns } = returnsResponse;
  const returnRate = returns.find((r) => r.key === Key.SECOND_PILLAR)?.rate || 0;

  const beginSum = beginSourceFunds
    ?.filter(({ pillar }) => pillar === 2)
    .reduce((total, { price, unavailablePrice }) => total + price + unavailablePrice, 0);

  const endSum = endSourceFunds
    ?.filter(({ pillar }) => pillar === 2)
    .reduce((total, { price, unavailablePrice }) => total + price + unavailablePrice, 0);

  const beginSumWithGrowth = beginSum * (1 + returnRate) ** yearsBetween;
  const secondPillarSum = endSum - beginSumWithGrowth;
  console.log(
    'beginSum',
    beginSum,
    'beginSumWithGrowth',
    beginSumWithGrowth,
    'endSum',
    endSum,
    'secondPillarSum',
    secondPillarSum,
  );

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
      ({ time }) => new Date(time) >= new Date(fromDate) && new Date(time) <= new Date(toDate),
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

  const tabularData = yearStats.map(({ year, total, average, ratio, ratioWithReduction }) => ({
    year,
    total: Number(total.toFixed(2)),
    average,
    ratio: Number(ratio.toFixed(3)),
    ratioWithReduction: Number(ratioWithReduction.toFixed(3)),
  }));
  console.table(tabularData);

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      <h2 className="mb-4">Kui palju vähendab II sammas sinu riiklikku pensionit?</h2>
      <p>
        Kogud igal kuul II sambasse vara ja riik lisab sellele omapoolse maksuvõimenduse. Teisalt on
        sinu riiklik pension selle võrra natukene väiksem. Täpsemalt on viimase 8 aasta (2018-2024)
        tulemus selline:
      </p>
      <ul>
        <li>
          Sa said {totalDiff.toFixed(1).replace('.', ',')} kindlustusosakut vähem kui siis kui sa
          poleks II sambasse kogunud. Kui sa oleksid täna 65-aastane ja läheksid pensionile, oleks
          sinu <strong>riiklik pension</strong> seetõttu{' '}
          <strong>
            <Euro amount={impactOfReduction} fractionDigits={0} /> kuus väiksem
          </strong>
          .
        </li>
        <li>
          Aga samal ajal kogunes sinu <strong>II samba</strong> kontole koos sissemaksete ja neilt
          teenitud tootlusega{' '}
          <strong>
            <Euro amount={secondPillarSum} fractionDigits={0} /> rohkem
          </strong>{' '}
          kui siis kui sa poleks sel perioodil II sambasse kogunud.
        </li>
      </ul>

      <p className="mt-3">
        Keeruline võrrelda? Need summad ei olegi objektiivselt võrreldavad. Üks on riigi lubadus
        maksta sulle kunagi tulevikus igakuist sissetulekut, teine on sinu isiklikul kontol olev
        vara, mida saad igal hetkel kasutada. Meie Tulevas usume, et kuigi riigi lubadused on
        toredad, siis kindlam on ikka oma kontol vara omada.
      </p>
      <div className="text-center mt-4">
        <Link className="btn btn-outline-primary" to="/account">
          Vaata oma konto seisu
        </Link>
        <p className="mt-4">
          <a href="https://tuleva.ee/kui-palju-vahendab-ii-sammas-sinu-riiklikku-pensionit/">
            Kuidas see arvutus täpselt käib?
          </a>
        </p>
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

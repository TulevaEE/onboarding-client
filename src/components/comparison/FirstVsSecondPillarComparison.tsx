/* eslint-disable no-irregular-whitespace */
/* eslint-disable no-console */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';
import { useContributions, useSourceFunds } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import { usePageTitle } from '../common/usePageTitle';
import { SecondPillarContribution } from '../common/apiModels';
import { Euro } from '../common/Euro';
import { useReturns } from '../account/ComparisonCalculator/returnComparisonHooks';
import { Key } from '../account/ComparisonCalculator/api';

export const FirstVsSecondPillarComparison = () => {
  usePageTitle('pageTitle.firstVsSecondPillar');
  const [calculationDetailsToggle, setCalculationDetailsToggle] = useState(false);

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
      <div className="col-12 col-md-10 col-lg-7 mx-auto pt-5">
        <div className="d-flex flex-column gap-4">
          <Shimmer height={72} />
          <div className="d-flex flex-column gap-3">
            <Shimmer height={48} />
            <Shimmer height={24} />
          </div>
          <div className="d-flex flex-column gap-2">
            <Shimmer height={104} />
            <Shimmer height={104} />
          </div>
        </div>
      </div>
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
    <div className="col-12 col-md-10 col-lg-7 mx-auto pt-5">
      <h1 className="mb-4">Kui palju vähendab II sambasse kogumine sinu riiklikku pensioni?</h1>
      <p>
        Kui kogud raha II sambasse, lisab riik sellele omapoolse maksuvõimenduse. See vähendab pisut
        sinu riikliku pensioni ehk I sammast.
      </p>
      <p>Täpsemalt on viimase 8 aasta (2018–2024) tulemus selline:</p>
      <div className="my-4 vstack gap-2">
        <div className="card">
          <div className="card-body">
            <p className="card-text">
              Sa said I sambasse {totalDiff.toFixed(1).replace('.', ',')} kindlustusosakut vähem kui
              juhul, kui sa poleks II sambasse kogunud. Kui läheksid täna 65-aastaselt pensionile,
              oleks sinu <strong>riiklik pension</strong> seetõttu{' '}
              <strong>
                <Euro amount={impactOfReduction} fractionDigits={0} /> kuus väiksem
              </strong>
              .
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="card-text">
              Samal ajal kogunes sinu <strong>II samba</strong> kontole koos sissemaksete ja neilt
              teenitud tootlusega{' '}
              <strong>
                <Euro amount={secondPillarSum} fractionDigits={0} /> rohkem
              </strong>{' '}
              võrreldes olukorraga, kus sa poleks II sambasse kogunud.
            </p>
          </div>
        </div>
      </div>
      <h2 className="mt-5 mb-3">Keeruline võrrelda?</h2>
      <p>
        Need summad ei olegi objektiivselt võrreldavad. Üks on riigi lubadus maksta sulle kunagi
        tulevikus igakuist sissetulekut, teine on sinu isiklikul kontol olev vara, mida saad igal
        hetkel kasutada.
      </p>
      <p>
        Meie Tulevas usume, et kuigi riigi lubadused on toredad, siis kindlam on ikka oma isiklikul
        pensionikontol vara omada. <Link to="/account">Vaata oma kontoseisu</Link>
      </p>

      <h2 className="mt-5 mb-3">
        <button
          id="calculationDetailsToggle"
          className="btn btn-light"
          type="button"
          onClick={() => setCalculationDetailsToggle(!calculationDetailsToggle)}
          aria-expanded="false"
          aria-controls="calculationDetails"
        >
          Kuidas see arvutus täpselt käib?
        </button>
      </h2>
      <Collapse in={calculationDetailsToggle}>
        <div id="calculationDetails" aria-labelledby="calculationDetailsToggle">
          <p>
            I samba pensioni suurus sõltub sinu sissetulekust. Täpsemalt, igal aastal arvutab
            sotsiaalkindlustusamet välja, mitu “osakut” sa viimase aasta eest said. Kogunenud
            osakute arvu näed <a href="https://eesti.ee">eesti.ee</a> lehel sisse logides. Need, kes
            on ühinenud II sambaga, saavad iga aasta eest 20% vähem osakuid. See on õiglane, sest II
             sambaga ühinedes läheb osa sinu palgalt tasutud sotsiaalmaksust sinu kontole, mitte
            riigikassasse.
          </p>
          <ul className="d-flex flex-column gap-3">
            <li>
              <strong>Riiklik pension.</strong> Võtsime sinu 2018–2024 tehtud II samba sissemaksed
              ja arvutasime nende alusel välja, kui palju sa sel perioodil osakuid oleks teeninud,
              kui sa II sambaga ühinenud poleks. Korrutasime selle 0,2-ga ja saimegi teada, kui
              palju vähem osakuid tegelikult riik sulle kirja pani. Kuna tugineme II samba
              sissemaksetele, on arvutus mõnel juhul ebatäpne. Näiteks kui oled teeninud tulu
              ettevõtluskontoga või kui sinu eest on mõnel kuul makstud sotsiaalmaksu, aga sa pole
              palka saanud. Täpse arvutuse leiad eesti.ee lehelt.
            </li>
            <li>
              <strong>Osaku väärtus.</strong> Osak ei ole vara, vaid lihtsalt riigi viis arvet
              pidada selle üle, kui palju ta sulle I samba pensionit maksma peaks kui sa
              pensioniikka jõuad. Sel aastal maksab riik iga osaku eest 10 eurot kuus pensionit.
            </li>
            <li>
              <strong>Miks just 2018–2024?</strong> II sambaga sai ühineda juba 2002. aasta suvel.
              Me võtsime arvutuse aluseks viimased 8 aastat kahel põhjusel. Esiteks, see on aeg, mil
              paljud meist koguvad Tulevas. Teiseks, varasematel perioodidel on II samba
              sissemaksetes olnud mitu muutust, mis teevad nende alusel palga arvutamise võimatuks.
            </li>
            <li>
              <strong>II samba kasv.</strong> Seepärast ei vaata me kogu sinu II sambasse kogunenud
              summat vaid ainult seda osa, mis on tekkinud 2018–2024 tehtud sissemaksetest ja
              nendele kogunenud kasumist.
            </li>
          </ul>
        </div>
      </Collapse>
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

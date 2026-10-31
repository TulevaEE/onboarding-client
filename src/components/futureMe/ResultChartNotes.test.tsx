import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { Age66Answers, initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { ResultChart } from './ResultChart';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput, YouAnswers } from './youAnswers';
import translations from '../translations';

jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return { Chart: forwardRef(() => <div data-testid="mock-chart" />) };
});

interface Changes {
  you?: Partial<YouAnswers>;
  age65?: Partial<Age65Answers>;
  age66?: Partial<Age66Answers>;
  specialPensionMonthly?: string;
}

const contextWith = ({
  you: youChanges = {},
  age65 = {},
  age66 = {},
  specialPensionMonthly = '',
}: Changes = {}): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
    secondPillarReturnPercent: 2,
    thirdPillarReturnPercent: 2,
    ...youChanges,
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: { ...initialAge65(), ...age65 },
    age66: { ...initialAge66(), ...age66 },
    specialPension: { ...initialSpecialPension(), monthly: specialPensionMonthly },
    expenses: initialExpenses(),
  };
};

const oneFundContract: Changes = {
  you: { thirdPillarJoined: 'before', thirdPillarAmount: '10000', thirdPillarMonthly: '100' },
  age65: { secondPillar: 'fund', thirdPillar: 'fund' },
  age66: { secondPillarContract: 'once', thirdPillarContract: 'once' },
};

const renderChart = (changes?: Changes) => {
  const context = contextWith(changes);
  const result = resultOf(context);
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <ResultChart result={result} need={needMonthly(context.expenses)} />
    </IntlProvider>,
  );
  return result;
};

const summary = () => screen.getByRole('list', { name: 'Graafiku kokkuvõte' });

describe('ResultChart summary notes', () => {
  it('says there is no tax when the state pension is below the pensioner tax-free income', () => {
    renderChart();

    expect(
      screen.getByText(
        'Riiklik pension on väiksem kui pensionäri tulumaksuvaba tulu (776 € kuus), seega tulumaksu pole.',
      ),
    ).toBeInTheDocument();
  });

  it('gives the tax on a state pension above the tax-free income', () => {
    renderChart({ you: { firstPillarMonthly: '1000' } });

    expect(
      screen.getByText(
        /Riiklikust pensionist \(1\s?000 € enne tulumaksu\) läheb tulumaksuks 49 € kuus: 22% summalt, mis ületab pensionäri tulumaksuvaba tulu 776 € kuus\./,
      ),
    ).toBeInTheDocument();
  });

  it('says which of the special pension and the old-age pension is paid, and that not both are', () => {
    renderChart({
      you: { workAdded: true, hasSpecialPension: true, specialPensionStartAge: '55' },
      specialPensionMonthly: '900',
    });

    expect(
      screen.getByText(
        'Pensionieas makstakse sulle eripensioni 900 € kuus enne tulumaksu (eripension 900 €, vanaduspension 700 €). Kahte riiklikku pensioni korraga ei maksta.',
      ),
    ).toBeInTheDocument();
  });

  it('says when the state pension starts later and what pays until then', () => {
    renderChart({ age65: { mode: 'defer', years: 3, secondPillar: 'fund' } });

    expect(
      screen.getByText(
        /Riiklik pension algab alles 68-⁠aastaselt\. Seni tuleb kuus keskmiselt \d+ € II sambast (ja|and) \d+ € II sambast \(10% tulumaksuga\)\./,
      ),
    ).toBeInTheDocument();
  });

  it('leaves the notes about a later state pension and the special pension out of the usual case', () => {
    renderChart();

    expect(summary()).not.toHaveTextContent('Riiklik pension algab alles');
    expect(summary()).not.toHaveTextContent('Kahte riiklikku pensioni');
  });
});

describe('ResultChart assumption', () => {
  const assumption =
    /kulud on kaetud kogu elu, kui paned igakuiste väljamaksete ja riikliku pensioni ülejäägi hoiusele/;

  it('says the costs are covered for life only if the surplus goes to the deposit, and what is missing without it', () => {
    renderChart(oneFundContract);

    expect(screen.getByText('Eeldus:')).toBeInTheDocument();
    expect(
      screen.getByText(
        /ja kasutad seda, kui fondid saavad otsa \(84-⁠aastaselt\)\. Kui ülejäägi kulutad, jääb siis puudu kuni 91 € kuus\./,
      ),
    ).toBeInTheDocument();
  });

  it('names the other ways out', () => {
    renderChart(oneFundContract);

    expect(
      screen.getByText(
        /Teised võimalused: vali väljamaksetele keskmisest elueast pikem periood või uus leping igal aastal\./,
      ),
    ).toBeInTheDocument();
  });

  it('is not shown when the costs do not depend on the deposit', () => {
    renderChart();

    expect(screen.queryByText(assumption)).not.toBeInTheDocument();
  });
});

describe('ResultChart reading guide', () => {
  const guide = () => screen.getByRole('group', { name: '' });

  it('is a closed section named for what it explains', () => {
    renderChart();

    expect(screen.getByText('Selgitus: kuidas graafikut lugeda')).toBeInTheDocument();
    expect(guide()).not.toHaveAttribute('open');
  });

  it('explains the layers, the costs line and the life events', () => {
    renderChart();

    expect(guide()).toHaveTextContent('Kihid näitavad, millest sinu kulud igas vanuses kaetakse.');
    expect(guide()).toHaveTextContent(
      'Punane katkendjoon on sinu kulud kuus. Kus kihtide ülaserv jääb sellest allapoole, on raha puudu.',
    );
    expect(guide()).toHaveTextContent('Suuremad punktid ja püstjooned on elusündmused');
  });

  it('says the last event is statistics and not the end of the person’s life', () => {
    const { horizonAge } = renderChart();

    expect(guide()).toHaveTextContent(
      `„10% sinuvanustest on veel elus“ (${horizonAge}-⁠aastaselt) on statistika, mitte sinu elu lõpp`,
    );
  });

  it('explains that the fund pension period follows the average lifetime when a fund pension ends', () => {
    renderChart(oneFundContract);

    expect(guide()).toHaveTextContent(
      /Igakuiste väljamaksete periood on \d+ aastat ja see on arvutatud keskmise eluea järgi, mitte sinu elu pikkuse järgi\./,
    );
  });

  it('leaves the fund pension period out when no fund pension ends', () => {
    renderChart();

    expect(guide()).not.toHaveTextContent('Igakuiste väljamaksete periood');
  });

  describe('the order the costs are covered in', () => {
    const steps = () =>
      within(screen.getByRole('list', { name: 'Kulud kaetakse igal aastal selles järjekorras:' }))
        .getAllByRole('listitem')
        .map(({ textContent }) => textContent);
    const fundPensionWithSurplus: Changes = {
      you: { firstPillarMonthly: '700', secondPillarAmount: '400000' },
      age65: { secondPillar: 'fund' },
    };

    it('names only the steps this chart has: the state pension, then the II pillar taken out when needed', () => {
      renderChart();

      expect(steps()).toEqual([
        'Riiklik pension.',
        expect.stringMatching(
          /^II\ssammas \(viirutatud kiht\): Arvutus eeldab, et võtad pensionile jäädes igal aastal fondist välja nii palju, kui eelmistest puudu jääb\. Sellelt läheb 10% tulumaksu\.$/,
        ),
      ]);
      expect(guide()).toHaveTextContent(
        'Kui sa raha välja ei võta, jääb see fondi kasvama ja kulud jäävad selle võrra katmata.',
      );
    });

    it('puts the fund pension with the state pension and the surplus on the deposit when they pay more than the costs', () => {
      renderChart(fundPensionWithSurplus);

      expect(steps()[0]).toBe(
        'Riiklik pension ja igakuised väljamaksed. Väljamakse tuleb lepingu järgi, mitte kulude järgi, ja selle suurus kõigub koos fondi väärtusega.',
      );
      expect(guide()).toHaveTextContent(
        /Hoius \(kiht „Hoiuselt“\): raha, mis on välja makstud, aga kuludeks veel vaja ei olnud\. Seal kaotab see väärtust 1%\saastas pärast inflatsiooni\./,
      );
    });

    it('takes the III pillar after the II pillar runs out, in the III pillar layer', () => {
      renderChart({
        you: { thirdPillarJoined: 'before', thirdPillarAmount: '10000', thirdPillarMonthly: '0' },
      });

      expect(steps()).toContainEqual(
        expect.stringMatching(
          /^III\ssammas \(viirutatud kiht\), kui II\ssambast enam ei jätku: Arvutus eeldab/,
        ),
      );
    });

    it('takes the III pillar on its own when there is no II pillar, in the III pillar layer', () => {
      renderChart({
        you: {
          secondPillarAmount: '0',
          secondPillarRate: '0',
          thirdPillarJoined: 'before',
          thirdPillarAmount: '10000',
          thirdPillarMonthly: '0',
        },
      });

      expect(steps()).toContainEqual(
        expect.stringMatching(
          /^III\ssammas \(viirutatud kiht\): Arvutus eeldab, et võtad igal aastal fondist välja nii palju, kui eelmistest puudu jääb\. Sellelt läheb 10% tulumaksu\.$/,
        ),
      );
    });

    it('leaves the order out when the state pension alone covers the costs', () => {
      renderChart({ you: { firstPillarMonthly: '1500' } });

      expect(guide()).not.toHaveTextContent('järjekorras');
      expect(guide()).not.toHaveTextContent('viirutatud kiht');
    });
  });

  it('leaves the years before the pension age out when the chart starts at the pension age', () => {
    renderChart();

    expect(guide()).not.toHaveTextContent('Enne pensioniiga');
  });
});

describe('ResultChart reading guide: what happens on the chart', () => {
  const changes = () =>
    within(screen.getByRole('list', { name: 'Mis graafikul juhtub:' }))
      .getAllByRole('listitem')
      .map(({ textContent }) => textContent);
  const guide = () => screen.getByRole('group', { name: '' });
  const rescuer = (thirdPillarMonthly: string): Changes => ({
    you: {
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
      earlyYearsPicked: '5',
      thirdPillarJoined: 'after',
      thirdPillarAmount: '5000',
      thirdPillarMonthly,
    },
  });

  it('says why the II pillar is taken out when the pension does not cover the costs', () => {
    renderChart(rescuer('500'));

    expect(changes()).toContainEqual(
      expect.stringMatching(
        /^60-⁠aastaselt: pensionist ja väljamaksetest ei jätku kuludeks\. Arvutus eeldab, et võtad puudu jääva osa kasvama jäetud II\ssambast välja 10% tulumaksuga \(viirutatud kiht\)\.$/,
      ),
    );
  });

  it('says the rescue allowance is in the state pension layer until the old-age pension starts', () => {
    renderChart(rescuer('500'));

    expect(changes()).toContainEqual(
      expect.stringMatching(
        /^65-⁠aastaselt: päästeteenistuja toetus lõpeb ja algab vanaduspension\. Seni on toetus kihis „Riiklik pension“\.$/,
      ),
    );
  });

  it('says the state pension rises at the pension age because the tax-free income grows', () => {
    renderChart(rescuer('500'));

    expect(changes()).toContainEqual(
      expect.stringMatching(
        /^65-⁠aastaselt: riiklik pension tõuseb \d+\s€ kuus, sest pensionieast on tulumaksuvaba tulu 776\s€ kuus, enne seda 700\s€\. Summa enne tulumaksu jääb samaks\.$/,
      ),
    );
  });

  it('says the assumption that the III pillar contributions end when the work ends', () => {
    renderChart(rescuer('500'));

    expect(guide()).toHaveTextContent(
      'Arvutus eeldab, et III samba sissemaksed lõpevad, kui töötamine lõpeb. Kui maksad edasi, lisa see oma kuludele.',
    );
  });

  it('leaves the contribution assumption out without a III pillar contribution', () => {
    renderChart(rescuer(''));

    expect(guide()).not.toHaveTextContent('III samba sissemaksed lõpevad');
  });

  it('says why the fund pension layer ends abruptly', () => {
    renderChart(oneFundContract);

    expect(changes()).toContainEqual(
      expect.stringMatching(
        /^\d+-⁠aastaselt: II\sja\sIII\ssamba igakuiste väljamaksete lepingud lõpevad\. Nende periood \(\d+\sa\) arvutati väljamaksete alguses keskmise eluea järgi ja selleks ajaks on raha välja makstud, seepärast langeb kiht järsult\.$/,
      ),
    );
  });

  it('says the salary covers the costs while working and the pensions go to the deposit', () => {
    renderChart({ age65: { work: 'yes', workUntil: '68' } });

    expect(guide()).toHaveTextContent(
      'Tööaastatel katab kulud palk. Riiklik pension ja samba väljamaksed lähevad nendel aastatel hoiusele ja on hiljem kihis „Hoiuselt“.',
    );
    expect(changes()).toContainEqual(
      expect.stringMatching(
        /^68-⁠aastaselt: lõpetad töö\. Edasi katavad kulud pension ja väljamaksed\.$/,
      ),
    );
  });
});

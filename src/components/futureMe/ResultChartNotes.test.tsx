import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { Age65Answers, initialAge65 } from './age65Answers';
import { Age66Answers, initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { ResultChart } from './ResultChart';
import { nominalReturnsOf } from './nominal';
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
      <ResultChart
        result={result}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
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
        'Riiklik pension on väiksem kui pensionäri maksuvaba tulu (776 € kuus), seega tulumaksu pole.',
      ),
    ).toBeInTheDocument();
  });

  it('gives the tax on a state pension above the tax-free income', () => {
    renderChart({ you: { firstPillarMonthly: '1000' } });

    expect(
      screen.getByText(
        /Riiklikust pensionist \(1\s?000 € enne maksu\) läheb tulumaksuks 49 € kuus: 22% summalt, mis ületab pensionäri maksuvaba tulu 776 € kuus\./,
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
        'Pensionieas makstakse sulle eripensioni 900 € kuus enne maksu (eripension 900 €, vanaduspension 700 €). Kahte riiklikku pensioni korraga ei maksta.',
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
    /kulud on kaetud kogu elu, kui paned fondipensioni ja riikliku pensioni ülejäägi hoiusele/;

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
        /Teised võimalused: vali fondipensionile keskmisest elueast pikem periood või uus leping igal aastal\./,
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
      /Fondipensioni periood on \d+ aastat ja see on arvutatud keskmise eluea järgi, mitte sinu elu pikkuse järgi\./,
    );
  });

  it('leaves the fund pension period out when no fund pension ends', () => {
    renderChart();

    expect(guide()).not.toHaveTextContent('Fondipensioni periood');
  });

  it('leaves the years before the pension age out when the chart starts at the pension age', () => {
    renderChart();

    expect(guide()).not.toHaveTextContent('Enne pensioniiga');
  });
});

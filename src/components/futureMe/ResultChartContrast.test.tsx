import React from 'react';
import { act, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { initialAge66 } from './age66Answers';
import { initialExpenses, needMonthly } from './expensesAnswers';
import { initialSpecialPension } from './specialPensionAnswers';
import { ResultChart } from './ResultChart';
import { nominalReturnsOf } from './nominal';
import { resultOf, ResultContext } from './resultAnswers';
import { initialAnswers, toStepPlanInput } from './youAnswers';
import translations from '../translations';

const mockChart = jest.fn();
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    Chart: forwardRef(
      (
        { data, options, plugins, type, ...domProps }: Record<string, unknown>,
        ref: React.Ref<unknown>,
      ) => {
        mockChart({ data, options, plugins, type });
        useImperativeHandle(ref, () => ({
          chartArea: { top: 10, bottom: 210, left: 0, right: 300 },
          scales: { x: { getPixelForValue: (age: number) => (age - 65) * 10 } },
          setActiveElements: jest.fn(),
          update: jest.fn(),
        }));
        return <div data-testid="mock-chart" {...domProps} />;
      },
    ),
  };
});

const context = (): ResultContext => {
  const you = {
    ...initialAnswers({ birthYear: 1976, sex: null, secondPillarRate: null }),
    pensionAgeYears: '65',
    firstPillarMonthly: '700',
    grossMonthly: '2000',
    secondPillarAmount: '10000',
  };
  return {
    you,
    plan: toStepPlanInput(you),
    age60: initialAge60(),
    age65: initialAge65(),
    age66: initialAge66(),
    specialPension: initialSpecialPension(),
    expenses: initialExpenses(),
  };
};

const ageAxisLineColour = () =>
  mockChart.mock.calls[mockChart.mock.calls.length - 1][0].options.scales.x.border.color;

describe('ResultChart in high contrast', () => {
  afterEach(() => {
    document.documentElement.classList.remove('high-contrast');
    jest.clearAllMocks();
  });

  it('draws the age axis line in a darker colour once the footer switch is on', async () => {
    render(
      <IntlProvider locale="et" messages={translations.et}>
        <ResultChart
          result={resultOf(context())}
          need={needMonthly(context().expenses)}
          nominalReturns={nominalReturnsOf(context())}
        />
      </IntlProvider>,
    );
    const normal = ageAxisLineColour();

    await act(async () => {
      document.documentElement.classList.add('high-contrast');
    });

    expect(ageAxisLineColour()).not.toEqual(normal);
    expect(ageAxisLineColour()).toBe('#6b7074');
  });
});

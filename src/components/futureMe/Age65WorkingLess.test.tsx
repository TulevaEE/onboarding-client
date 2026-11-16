import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { initialAge60 } from './age60Answers';
import { initialAge65 } from './age65Answers';
import { Age65Step } from './Age65Step';
import { euro } from './amountFormat';
import { contextWith } from './resultContextFixture';
import { statePensionAtRetirementOf } from './reducedPay';

const workingLessFrom60 = { ...initialAge60(), reducedPay: { gross: '1200' } };
const { you, plan, age66, specialPension } = contextWith();
const loweredStatePension = euro(statePensionAtRetirementOf(workingLessFrom60, you, plan));

const renderAge65Step = () =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <Age65Step
        answers={{ ...initialAge65(), work: 'yes' }}
        you={you}
        plan={plan}
        age60={workingLessFrom60}
        age66={age66}
        specialPension={specialPension}
        headingRef={createRef()}
        onChange={jest.fn()}
        onEditYou={jest.fn()}
        onEditAge60={jest.fn()}
        onEditAge55={jest.fn()}
      />
    </IntlProvider>,
  );

describe('Age 65 step after working less from the payout age', () => {
  it('says how much each year worked raises the pension with the lower salary', () => {
    renderAge65Step();

    expect(
      screen.getByText(
        /^Brutopalgaga 1\s200\s€ tõstab iga tööaasta pensioni u \d+(,\d)?\s€ kuus\.$/,
      ),
    ).toBeInTheDocument();
  });

  it('shows the state pension lowered by the years worked for less', () => {
    renderAge65Step();

    expect(
      screen.getByText(
        `${loweredStatePension.replace(/\s/g, ' ')} kuus enne tulumaksu, kohe 65-aastaselt`,
      ),
    ).toBeInTheDocument();
  });

  it('works out what deferring by a year does from the lowered state pension', () => {
    renderAge65Step();

    userEvent.click(screen.getByText('Mida tähendab pensioni edasilükkamine või pool pensioni?'));

    expect(
      screen.getByText(new RegExp(`pension ${loweredStatePension.replace(/\s/g, '\\s')} asemel`)),
    ).toBeInTheDocument();
  });
});

describe('Age 65 step with a special pension that changes the salary', () => {
  it('says how much each year worked raises the pension with the special pension salary', () => {
    const context = contextWith({
      workAdded: true,
      hasSpecialPension: true,
      specialPensionStartAge: '55',
    });
    render(
      <IntlProvider locale="et" messages={translations.et}>
        <Age65Step
          answers={{ ...initialAge65(), work: 'yes' }}
          you={context.you}
          plan={context.plan}
          age60={initialAge60()}
          age66={context.age66}
          specialPension={{
            ...context.specialPension,
            monthly: '800',
            work: 'yes',
            pay: 'change',
            gross: '1500',
          }}
          headingRef={createRef()}
          onChange={jest.fn()}
          onEditYou={jest.fn()}
          onEditAge60={jest.fn()}
          onEditAge55={jest.fn()}
        />
      </IntlProvider>,
    );

    expect(
      screen.getByText(/^Brutopalgaga 1\s500\s€ tõstab iga tööaasta pensioni/),
    ).toBeInTheDocument();
  });
});

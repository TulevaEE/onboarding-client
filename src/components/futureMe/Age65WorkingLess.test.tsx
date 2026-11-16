import React, { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
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

const renderAge65Step = () => {
  const { you, plan, age66, specialPension } = contextWith();
  const answers = { ...initialAge65(), work: 'yes' as const };
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <Age65Step
        answers={answers}
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
  return statePensionAtRetirementOf(workingLessFrom60, you, plan);
};

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
    const statePension = renderAge65Step();

    expect(
      screen.getByText(
        `${euro(statePension).replace(/\s/g, ' ')} kuus enne tulumaksu, kohe 65-aastaselt`,
      ),
    ).toBeInTheDocument();
  });

  it('works out what deferring by a year does from the lowered state pension', () => {
    const statePension = renderAge65Step();

    userEvent.click(screen.getByText('Mida tähendab pensioni edasilükkamine või pool pensioni?'));

    expect(
      within(
        screen
          .getByText('Mida tähendab pensioni edasilükkamine või pool pensioni?')
          .closest('details') as HTMLElement,
      ).getByText(new RegExp(euro(statePension).replace(/\s/g, '\\s'))),
    ).toBeInTheDocument();
  });
});

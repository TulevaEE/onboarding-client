import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PotBar } from './PotBar';
import { contextWith } from './resultContextFixture';
import { resultOf } from './resultAnswers';
import translations from '../translations';

const renderBar = (context = contextWith({ thirdPillarAmount: '5000' })) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <PotBar context={context} />
    </IntlProvider>,
  );

const bar = () => screen.getByRole('complementary', { name: 'Jooksev kokkuvõte' });

describe('PotBar', () => {
  it('shows what the II and the III pillar hold when the pension starts', () => {
    const context = contextWith({ thirdPillarAmount: '5000' });
    const { p2, p3, age } = resultOf(context).potAtPension;

    renderBar(context);

    const items = within(bar()).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(new RegExp(`II\\ssammas ${age}.aastaselt`));
    expect(items[0]).toHaveTextContent(/\d/);
    expect(items[1]).toHaveTextContent(new RegExp(`III\\ssammas ${age}.aastaselt`));
    expect(p2).toBeGreaterThan(0);
    expect(p3).toBeGreaterThan(0);
  });

  it('leaves the III pillar out when there is nothing in it', () => {
    renderBar(contextWith({ thirdPillarAmount: '' }));

    expect(within(bar()).queryByText(/III\ssammas/)).not.toBeInTheDocument();
  });

  it('leaves the deposit out when nothing has been taken out of a pillar', () => {
    renderBar();

    expect(within(bar()).queryByText(/^Hoius/)).not.toBeInTheDocument();
  });

  it('shows the deposit instead of the III pillar when the III pillar was taken out at 55', () => {
    const context = contextWith({
      thirdPillarJoined: 'before',
      thirdPillarAmount: '5000',
      thirdPillarMonthly: '0',
      thirdPillarPlan: 'lump',
    });
    expect(resultOf(context).potAtPension).toMatchObject({ p3: 0 });
    expect(resultOf(context).potAtPension.deposit).toBeGreaterThan(1);

    renderBar(context);

    expect(within(bar()).getByText(/^Hoius \d+.aastaselt$/)).toBeVisible();
    expect(within(bar()).queryByText(/III\ssammas/)).not.toBeInTheDocument();
  });
});

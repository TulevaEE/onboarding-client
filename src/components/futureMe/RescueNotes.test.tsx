import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { PensionInput } from './engine/pension';
import { RescueNotes } from './RescueNotes';

const rescueWorkerWithFiveChildren = (earlyUser: string): PensionInput => ({
  birthYear: 1980,
  sex: 'N',
  pensionAgeYears: 65,
  p1Monthly: 700,
  p2: 0,
  p3: 0,
  needMonthly: 0,
  realReturn: 0,
  rescueYears: 20,
  soodus: 5,
  kids: { b2012: 5, earlyUser },
});

const renderNotes = (earlyUser: string) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <RescueNotes input={rescueWorkerWithFiveChildren(earlyUser)} age={60} pensionAge={65} />
    </IntlProvider>,
  );

const kidsPensionWork = /Laste eest varem saadud vanaduspensioni kõrvalt võid töötada/;

describe('RescueNotes', () => {
  it('says work goes on beside the pension for the children when the saver uses the right', () => {
    renderNotes('me');

    expect(screen.getByText(kidsPensionWork)).toBeInTheDocument();
  });

  it('says the same when the saver shares the right with the other parent', () => {
    renderNotes('split');

    expect(screen.getByText(kidsPensionWork)).toBeInTheDocument();
  });

  it('leaves it out when the other parent uses the right', () => {
    renderNotes('other');

    expect(screen.queryByText(kidsPensionWork)).not.toBeInTheDocument();
  });
});

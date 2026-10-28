import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { RescueCompareFaq } from './KidsCompareFaq';
import { contextWith } from './resultContextFixture';

const threeChildren = {
  kidsAdded: true,
  kidsCount: '3',
  kidsBirthYears: ['1990', '1992', '1994'],
};

const renderEt = (node: React.ReactElement) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      {node}
    </IntlProvider>,
  );

const rowNamed = (name: RegExp) => screen.getByRole('row', { name });

describe('rescue allowance or the pension for the children question', () => {
  const withRescue = (changes = {}) =>
    contextWith({
      ...threeChildren,
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
      ...changes,
    });

  it('is a question with a table of each way and the family', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(
      screen.getByText('Ootetoetus või laste eest pension: kumb annab rohkem?'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual([
      expect.stringMatching(/^Mõlemad järjest/),
      expect.stringMatching(/^Laste eest pension/),
      expect.stringMatching(/^Ainult ootetoetus/),
      expect.stringMatching(/^Pere kokku: sina ootetoetusel, teine vanem laste eest varem/),
    ]);
  });

  it('marks the saver’s choice in words, not only in colour', () => {
    renderEt(<RescueCompareFaq context={withRescue({ rescueBasis: 'toetus' })} />);

    expect(screen.getByRole('rowheader', { name: /^Ainult ootetoetus/ })).toHaveTextContent(
      /sinu valik/,
    );
    expect(screen.getByRole('rowheader', { name: /^Mõlemad järjest/ })).not.toHaveTextContent(
      /sinu valik/,
    );
  });

  it('says when the work ends and what is paid until the pension age', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    const mix = within(rowNamed(/^Mõlemad järjest/));
    expect(mix.getByText(/^60\sa$/)).toBeInTheDocument();
    expect(mix.getByText(/^60–\u206063\sa ootetoetus [\d\s]+€\skuus$/)).toBeInTheDocument();
    expect(mix.getByText(/^64\sa pension [\d\s]+€\skuus$/)).toBeInTheDocument();
  });

  it('is not asked without both rights', () => {
    renderEt(<RescueCompareFaq context={contextWith(threeChildren)} />);

    expect(screen.queryByText(/kumb annab rohkem/)).not.toBeInTheDocument();
  });
});

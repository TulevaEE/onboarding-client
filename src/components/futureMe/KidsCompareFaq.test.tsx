import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { RescueCompareFaq, SpecialCompareFaq } from './KidsCompareFaq';
import { initialAge65 } from './age65Answers';
import { contextWith } from './resultContextFixture';
import { initialSpecialPension } from './specialPensionAnswers';

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
    expect(mix.getByText(/^60–\u206063\sa ootetoetus 791\s€\skuus$/)).toBeInTheDocument();
    expect(mix.getByText(/^64\sa pension 923\s€\skuus$/)).toBeInTheDocument();
  });

  it('says from when the saver gets the child supplement, without an amount that the allowance and the pension beside it do not differ by', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(
      within(rowNamed(/^Mõlemad järjest/)).getByText(/^sinul alates 64\sa$/),
    ).toBeInTheDocument();
  });

  it('names the table and lets the keyboard scroll it on a narrow screen', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(screen.getByRole('region', { name: 'Võrdlus: mis aitab valida?' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('table', { name: 'Võrdlus: mis aitab valida?' })).toBeInTheDocument();
  });

  it('marks the ways that give the most until the pension age', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(within(rowNamed(/^Mõlemad järjest/)).getByText('kõige rohkem')).toBeInTheDocument();
    expect(
      within(rowNamed(/^Ainult ootetoetus/)).queryByText('kõige rohkem'),
    ).not.toBeInTheDocument();
  });

  it('marks no way as giving the most when every way gives the same', () => {
    renderEt(
      <RescueCompareFaq
        context={withRescue({
          kidsCount: '5',
          kidsBirthYears: ['1985', '1986', '1987', '1988', '1989'],
          kidsSupUser: 'other',
        })}
      />,
    );

    expect(screen.getAllByRole('rowheader')).toHaveLength(3);
    expect(screen.queryByText('kõige rohkem')).not.toBeInTheDocument();
  });

  it.each(['et', 'en'] as const)(
    'names the You step questions where the parents choose who uses each right, in %s',
    (locale) => {
      render(
        <IntlProvider locale={locale} messages={translations[locale]}>
          <RescueCompareFaq context={withRescue()} />
        </IntlProvider>,
      );

      const messages = translations[locale] as Record<string, string>;
      const [open, close] = locale === 'et' ? ['„', '“'] : ['“', '”'];
      const quoted = (key: string) => `${open}${messages[key]}${close}`;
      const faqText = document.body.textContent;
      expect(faqText).toContain(quoted('futureMe.you.kidsEarlyUser.label'));
      expect(faqText).toContain(quoted('futureMe.you.kidsSupUser.label'));
    },
  );

  it('says one year, not one years, in English', () => {
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <RescueCompareFaq context={withRescue()} />
      </IntlProvider>,
    );

    expect(screen.getByText(/they retire 1\syear earlier for the children/)).toBeInTheDocument();
  });

  it('is not asked without both rights', () => {
    renderEt(<RescueCompareFaq context={contextWith(threeChildren)} />);

    expect(screen.queryByText(/kumb annab rohkem/)).not.toBeInTheDocument();
  });
});

describe('special pension or the pension for the children question', () => {
  const withSpecialPension = (changes = {}, monthly = '900', age65 = {}) =>
    contextWith(
      {
        ...threeChildren,
        workAdded: true,
        hasSpecialPension: true,
        specialPensionStartAge: '55',
        ...changes,
      },
      {
        specialPension: { ...initialSpecialPension(), monthly },
        age65: { ...initialAge65(), ...age65 },
      },
    );

  it('compares staying on the special pension with the old-age pension for the children', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension()} />);

    expect(
      screen.getByText('Eripension või laste eest pension: kumb annab rohkem?'),
    ).toBeInTheDocument();
    expect(rowNamed(/^Jätkan eripensioniga/)).toBeInTheDocument();
    expect(rowNamed(/^Laste eest vanaduspension/)).toBeInTheDocument();
    expect(
      within(rowNamed(/^Jätkan eripensioniga/)).getByText('eripensionile ei lisandu'),
    ).toBeInTheDocument();
  });

  it('says what each pays a month and in total until the pension age, and at it', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension()} />);

    const special = within(rowNamed(/^Jätkan eripensioniga/));
    expect(special.getByText(/^64\sa eripension 900\s€\skuus$/)).toBeInTheDocument();
    expect(special.getByText(/^10\s800\s€$/)).toBeInTheDocument();
    expect(special.getByText(/^900\s€\skuus$/)).toBeInTheDocument();
    const oldAge = within(rowNamed(/^Laste eest vanaduspension/));
    expect(oldAge.getByText(/^64\sa vanaduspension 802\s€\skuus$/)).toBeInTheDocument();
    expect(oldAge.getByText(/^9\s622\s€$/)).toBeInTheDocument();
    expect(oldAge.getByText(/^802\s€\skuus$/)).toBeInTheDocument();
    expect(within(rowNamed(/^Pere kokku/)).getByText(/^21\s123\s€$/)).toBeInTheDocument();
  });

  it('marks the old-age pension as the saver’s choice once the saver picks it', () => {
    renderEt(
      <SpecialCompareFaq
        context={withSpecialPension({}, '900', { firstPillarChoice: 'oldAge' as const })}
      />,
    );

    expect(rowNamed(/^Laste eest vanaduspension/)).toHaveTextContent(/sinu valik/);
    expect(rowNamed(/^Jätkan eripensioniga/)).not.toHaveTextContent(/sinu valik/);
  });

  it('marks the one that gives the most until the pension age', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension()} />);

    expect(within(rowNamed(/^Jätkan eripensioniga/)).getByText('kõige rohkem')).toBeInTheDocument();
    expect(
      within(rowNamed(/^Laste eest vanaduspension/)).queryByText('kõige rohkem'),
    ).not.toBeInTheDocument();
  });

  it('marks neither as giving the most when both give the same in whole euros', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension({}, '801.8')} />);

    expect(screen.getAllByRole('rowheader')).toHaveLength(3);
    expect(screen.queryByText('kõige rohkem')).not.toBeInTheDocument();
  });

  it('is not asked when the other parent uses the right for the children', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension({ kidsEarlyUser: 'other' })} />);

    expect(screen.queryByText(/kumb annab rohkem/)).not.toBeInTheDocument();
  });
});

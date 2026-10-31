import React from 'react';
import { render, screen } from '@testing-library/react';
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

const renderIn = (locale: 'et' | 'en', node: React.ReactElement) =>
  render(
    <IntlProvider locale={locale} messages={translations[locale]}>
      {node}
    </IntlProvider>,
  );

const renderEt = (node: React.ReactElement) => renderIn('et', node);

describe('rescue allowance or the pension for the children question', () => {
  const withRescue = (changes = {}) =>
    contextWith({
      ...threeChildren,
      workAdded: true,
      hasRescue: true,
      rescueYears: '20',
      ...changes,
    });

  it('tells the saver to work out which gives more, without a table', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(
      screen.getByText('Ootetoetus või laste eest pension: kumb annab rohkem?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Arvuta ise, kumb sulle rohkem annab/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('says from which age each way starts and that the allowance carries no children supplement', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(document.body).toHaveTextContent(/Laste eest pension: algab 64-\u2060aastaselt/);
    expect(screen.getByText(/Laste pensionilisa sellele ei lisandu/)).toBeInTheDocument();
  });

  it.each(['et', 'en'] as const)(
    'names the You step questions where the parents choose who uses each right, in %s',
    (locale) => {
      renderIn(locale, <RescueCompareFaq context={withRescue()} />);

      const messages = translations[locale] as Record<string, string>;
      const [open, close] = locale === 'et' ? ['„', '“'] : ['“', '”'];
      const quoted = (key: string) => `${open}${messages[key]}${close}`;
      const faqText = document.body.textContent;
      expect(faqText).toContain(quoted('futureMe.you.kidsEarlyUser.label'));
      expect(faqText).toContain(quoted('futureMe.you.kidsSupUser.label'));
    },
  );

  it('asks a saver raising the children alone to check which gives more, not that one is better', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(
      screen.getByText(/Kui kasvatad lapsi üksi, arvuta ise, kumb annab sulle rohkem/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/olla sulle kasulikum/)).not.toBeInTheDocument();
  });

  it('refers to no table', () => {
    renderEt(<RescueCompareFaq context={withRescue()} />);

    expect(document.body).not.toHaveTextContent(/tabel/i);
  });

  it('says one year, not one years, in English', () => {
    renderIn('en', <RescueCompareFaq context={withRescue()} />);

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

  it('tells the saver to work out which gives more, without a table', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension()} />);

    expect(
      screen.getByText('Eripension või laste eest pension: kumb annab rohkem?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Arvuta ise, kumb sulle rohkem annab/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/tabel/i);
  });

  it('says the children supplement is added to the old-age pension only', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension()} />);

    expect(
      screen.getByText(/Laste pensionilisa lisandub ainult vanaduspensionile, eripensionile mitte/),
    ).toBeInTheDocument();
  });

  it('is not asked when the other parent uses the right for the children', () => {
    renderEt(<SpecialCompareFaq context={withSpecialPension({ kidsEarlyUser: 'other' })} />);

    expect(screen.queryByText(/kumb annab rohkem/)).not.toBeInTheDocument();
  });
});

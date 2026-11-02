import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import translations from '../translations';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-intl', () => jest.requireActual('react-intl'));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const renderYouStep = (locale: 'et' | 'en' = 'et') => {
  mockUseMe.mockReturnValue({ data: mockUser, isLoading: false } as ReturnType<typeof useMe>);
  render(
    <IntlProvider locale={locale} messages={translations[locale]}>
      <FutureMe />
    </IntlProvider>,
  );
};

const faq = () => screen.getByRole('region', { name: 'Korduma kippuvad küsimused' });

const questions = () =>
  within(faq())
    .getAllByText(/\?$/)
    .map((question) => question.textContent);

describe('You step FAQ', () => {
  it('asks the five questions in order', () => {
    renderYouStep();

    expect(questions()).toEqual([
      'Mis on Tulevane Mina ja kellele see on mõeldud?',
      'Mis on riiklik pension ning II ja III sammas?',
      'Mis on pensioniiga ja paindlik pension?',
      'Miks ma pean lapsed märkima?',
      'Mis on tööga seotud erijuhud ja miks need on olulised?',
    ]);
  });

  it('keeps every answer closed until the question is opened', () => {
    renderYouStep();

    expect(within(faq()).queryByText(/riigi tagatud igakuine summa/)).not.toBeVisible();

    userEvent.click(within(faq()).getByText(/Mis on riiklik pension ning II/));

    expect(within(faq()).getByText(/riigi tagatud igakuine summa/)).toBeVisible();
  });

  it('tells which pension is inherited and which is not', () => {
    renderYouStep();

    userEvent.click(within(faq()).getByText(/Mis on riiklik pension ning II/));

    expect(within(faq()).getByText(/Riiklik pension pärandvara ei ole/)).toBeInTheDocument();
  });

  it('does not promise any return', () => {
    renderYouStep();

    userEvent.click(within(faq()).getByText(/Mis on Tulevane Mina/));

    expect(within(faq()).getByText(/mitte lubadus/)).toBeInTheDocument();
  });

  it('links the special cases answer to the Social Insurance Board', () => {
    renderYouStep();

    userEvent.click(within(faq()).getByText(/Mis on tööga seotud erijuhud/));

    expect(within(faq()).getByRole('link', { name: /Sotsiaalkindlustusametist/ })).toHaveAttribute(
      'href',
      'https://sotsiaalkindlustusamet.ee/et',
    );
  });

  it('is written in English too', () => {
    renderYouStep('en');

    expect(screen.getByText('What is Future Me and who is it for?')).toBeInTheDocument();
  });

  it('balances its questions over their lines, so no word is left alone on the last one', () => {
    renderYouStep();

    within(faq())
      .getAllByText(/\?$/)
      .forEach((question) => expect(question).toHaveClass('text-balance'));
  });
});

describe('You step block headings', () => {
  it('balance over their lines, so no word is left alone on the last one', () => {
    renderYouStep();

    [
      'Riiklik pension',
      /^Töö ja II\ssammas$/,
      /^III\ssammas$/,
      'Lapsed',
      'Tööga seotud erijuhud',
    ].forEach((name) => {
      const heading = screen.getByRole('heading', { level: 3, name });
      // eslint-disable-next-line testing-library/no-node-access
      expect(heading.parentElement).toHaveClass('text-balance');
    });
  });
});

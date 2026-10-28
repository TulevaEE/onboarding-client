import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import translations from '../translations';
import { installDialogPolyfill } from './dialogPolyfill';
import { mockUser } from '../../test/backend-responses';

jest.mock('../common/apiHooks', () => ({
  useMe: jest.fn(),
  useContributions: () => ({ data: [], isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useEligibleChildren: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const renderYouStep = () => {
  mockUseMe.mockReturnValue({ data: mockUser, isLoading: false } as ReturnType<typeof useMe>);
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
};

const helpButtonBeside = (element: HTMLElement, container: string, question: RegExp) =>
  // eslint-disable-next-line testing-library/no-node-access
  within(element.closest(container) as HTMLElement).getByRole('button', { name: question });

describe('Sina step help buttons', () => {
  beforeAll(installDialogPolyfill);

  const fieldHelp: [string, () => HTMLElement, RegExp][] = [
    ['sex', () => screen.getByRole('combobox', { name: /Mis on sinu sugu/ }), /Miks küsime sugu$/],
    [
      'pension age',
      () => screen.getByRole('combobox', { name: /Millal on sinu pensioniiga/ }),
      /Kuidas pensioniiga määratakse$/,
    ],
    [
      'state pension',
      () => screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }),
      /Mis on riiklik pension$/,
    ],
    [
      'gross salary',
      () => screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }),
      /Kuidas palk arvutuses muutub$/,
    ],
    [
      'second pillar rate',
      () => screen.getByRole('combobox', { name: /Kui palju maksad II\ssambasse/ }),
      /Mida tähendab II\ssamba sissemakse$/,
    ],
    [
      'second pillar fund',
      () => screen.getByRole('combobox', { name: /tootlust eeldad II\ssambas/ }),
      /Mida tähendab „tootlus pärast inflatsiooni“$/,
    ],
    [
      'third pillar joined',
      () => screen.getByRole('combobox', { name: /Kas oled III\ssambaga liitunud/ }),
      /Miks on oluline, millal III\ssambaga liitusid$/,
    ],
    [
      'third pillar monthly',
      () => screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }),
      /Kuidas III\ssamba sissemakse arvutuses muutub$/,
    ],
  ];

  it.each(fieldHelp)('puts the %s explanation beside the label of its field', (_, field, name) => {
    renderYouStep();

    userEvent.click(helpButtonBeside(field(), '.col-12', name));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('puts the pillars explanation beside the second pillar and work title', () => {
    renderYouStep();
    const heading = screen.getByRole('heading', { name: /^Töö ja II\ssammas$/ });

    userEvent.click(
      helpButtonBeside(heading, '.you-section-head', /Miks küsime sammaste ja töö kohta$/),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tells what the prefilled state pension is and where to check it', () => {
    renderYouStep();
    const stateField = screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ });

    userEvent.click(helpButtonBeside(stateField, '.col-12', /Mis on riiklik pension$/));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(/riikliku pensioni arvutuslikku prognoosi/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/keskmist vanaduspensioni 2026\.\saastal/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: /^Sotsiaalkindlustusameti pensionikalkulaatoris/ }),
    ).toHaveAttribute('href', expect.stringContaining('pension-calculator'));
  });

  it('writes out the Social Insurance Board self-service in the pension age explanation', () => {
    renderYouStep();
    const ageField = screen.getByRole('combobox', { name: /Millal on sinu pensioniiga/ });

    userEvent.click(helpButtonBeside(ageField, '.col-12', /Kuidas pensioniiga määratakse$/));

    expect(
      within(screen.getByRole('dialog')).getByRole('link', {
        name: /^Sotsiaalkindlustusameti iseteenindus/,
      }),
    ).toBeInTheDocument();
  });

  it('leaves the field labels as they were for screen readers', () => {
    renderYouStep();

    expect(screen.getByRole('combobox', { name: /^Mis on sinu sugu\?/ })).toBeInTheDocument();
  });
});

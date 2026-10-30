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
  useFundPensionStatus: () => ({ data: { fundPensions: [] }, isLoading: false }),
  useSourceFunds: () => ({ data: [], isLoading: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  usePendingOnboardings: () => ({ data: [], isLoading: false }),
}));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-intl', () => jest.requireActual('react-intl'));

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const renderYouStep = () => {
  mockUseMe.mockReturnValue({ data: mockUser, isLoading: false } as ReturnType<typeof useMe>);
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
};

const specialCase = (name: RegExp) => screen.getByRole('checkbox', { name });

const addEverything = () => {
  userEvent.click(screen.getByRole('button', { name: 'Lisa lapsed' }));
  userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
  userEvent.click(specialCase(/tervist kahjustaval tööl/));
  userEvent.click(specialCase(/Saan või hakkan saama eripensioni/));
  userEvent.click(specialCase(/Töötasin päästeteenistuses/));
  userEvent.click(specialCase(/ametnik/i));
};

const helpButtonBeside = (element: HTMLElement, container: string, question: RegExp) =>
  // eslint-disable-next-line testing-library/no-node-access
  within(element.closest(container) as HTMLElement).getByRole('button', { name: question });

const openKidsHelp = () => {
  userEvent.click(screen.getByRole('button', { name: 'Lisa lapsed' }));
  userEvent.click(
    helpButtonBeside(
      screen.getByRole('heading', { name: 'Lapsed' }),
      '.you-section-head',
      /Kuidas lapsed pensioni mõjutavad$/,
    ),
  );
  return screen.getByRole('dialog');
};

const openHazardHelp = () => {
  userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
  userEvent.click(specialCase(/tervist kahjustaval tööl/));
  userEvent.click(
    helpButtonBeside(
      screen.getByRole('combobox', { name: /Millise nimekirja tööl töötasid/ }),
      '.col-12',
      /Mis on tervist kahjustav töö$/,
    ),
  );
  return screen.getByRole('dialog');
};

const openRescueHelp = () => {
  userEvent.click(screen.getByRole('button', { name: 'Lisa erijuht' }));
  userEvent.click(specialCase(/Töötasin päästeteenistuses/));
  userEvent.click(
    helpButtonBeside(
      screen.getByRole('spinbutton', { name: /Mitu aastat töötasid päästeteenistuses/ }),
      '.col-12',
      /Mida annab päästeteenistus pensionile$/,
    ),
  );
  return screen.getByRole('dialog');
};

const openEarlyRetirementHelp = () => {
  userEvent.click(
    helpButtonBeside(
      screen.getByRole('combobox', { name: /Mitu aastat varem plaanid pensionile minna/ }),
      '.col-12',
      /Mis juhtub, kui lähed varem pensionile$/,
    ),
  );
  return screen.getByRole('dialog');
};

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
      'second pillar return',
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
    [
      'who raises the kids',
      () => screen.getByRole('combobox', { name: /Kes saab pensionilisa/ }),
      /Keda loetakse lapse kasvatajaks$/,
    ],
    [
      'hazard list',
      () => screen.getByRole('combobox', { name: /Millise nimekirja tööl töötasid/ }),
      /Mis on tervist kahjustav töö$/,
    ],
    [
      'rescue years',
      () => screen.getByRole('spinbutton', { name: /Mitu aastat töötasid päästeteenistuses/ }),
      /Mida annab päästeteenistus pensionile$/,
    ],
    [
      'special pension start',
      () => screen.getByRole('spinbutton', { name: /Mis vanusest eripension algab/ }),
      /Miks on eripensioni algus oluline$/,
    ],
  ];

  it.each(fieldHelp)('puts the %s explanation beside the label of its field', (_, field, name) => {
    renderYouStep();
    addEverything();

    userEvent.click(helpButtonBeside(field(), '.col-12', name));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('explains a zero, a negative and a high return, and that the past promises nothing', () => {
    renderYouStep();
    const returnField = screen.getByRole('combobox', { name: /tootlust eeldad II\ssambas/ });

    userEvent.click(
      helpButtonBeside(returnField, '.col-12', /Mida tähendab „tootlus pärast inflatsiooni“$/),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/0%:.*Alla 0%:.*Üle 0%:/);
    expect(dialog).toHaveTextContent('Varasem tootlus ei taga tulevast tootlust.');
    expect(dialog).not.toHaveTextContent(/Miks kõige rohkem 4%/);
  });

  it('says the III pillar money already saved follows the chosen return, without quoting a default', () => {
    renderYouStep();
    const monthlyField = screen.getByRole('spinbutton', {
      name: /Kui palju maksad III\ssambasse kuus/,
    });

    userEvent.click(
      helpButtonBeside(monthlyField, '.col-12', /Kuidas III\ssamba sissemakse arvutuses muutub$/),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'See puudutab ainult uut sissemakset: sambas oleva raha ostujõud muutub valitud tootluse võrra.',
    );
  });

  it('puts the pillars explanation beside the second pillar and work title', () => {
    renderYouStep();
    const heading = screen.getByRole('heading', { name: /^Töö ja II\ssammas$/ });

    userEvent.click(
      helpButtonBeside(heading, '.you-section-head', /Miks küsime sammaste ja töö kohta$/),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  const checkboxHelp: [string, RegExp, RegExp][] = [
    ['special pension', /Saan või hakkan saama eripensioni/, /Mis on eripension$/],
    ['civil servant', /ametnik/i, /Kes saab ametniku teenistusstaaži eest pensioni suurendust$/],
  ];

  it.each(checkboxHelp)('puts the %s explanation beside its checkbox', (_, label, name) => {
    renderYouStep();
    addEverything();

    userEvent.click(helpButtonBeside(specialCase(label), '.form-check', name));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('offers the civil servant explanation once, beside its checkbox and not again beside the years', () => {
    renderYouStep();
    addEverything();

    expect(
      screen.getAllByRole('button', {
        name: /Kes saab ametniku teenistusstaaži eest pensioni suurendust$/,
      }),
    ).toHaveLength(1);
  });

  const optionalSectionHelp: [string, string, RegExp][] = [
    ['kids', 'Lapsed', /Kuidas lapsed pensioni mõjutavad$/],
    [
      'special cases',
      'Tööga seotud erijuhud',
      /Millised tööga seotud erijuhud pensioni mõjutavad$/,
    ],
  ];

  it.each(optionalSectionHelp)(
    'puts the %s explanation beside the section title',
    (_, title, name) => {
      renderYouStep();
      addEverything();
      const heading = screen.getByRole('heading', { name: title });

      userEvent.click(helpButtonBeside(heading, '.you-section-head', name));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    },
  );

  it('says in the special cases table that Elukaar adds the civil servant increase itself', () => {
    renderYouStep();
    addEverything();
    const heading = screen.getByRole('heading', { name: 'Tööga seotud erijuhud' });

    userEvent.click(
      helpButtonBeside(heading, '.you-section-head', /Millised tööga seotud erijuhud/),
    );
    const civilRow = within(screen.getByRole('dialog')).getByRole('row', {
      name: /^Ametnik enne 2013/,
    });

    expect(civilRow).toHaveTextContent(/Elukaar lisab selle riiklikule pensionile ise/);
    expect(civilRow).not.toHaveTextContent(/Sotsiaalkindlustusameti prognoosi/);
  });

  it('puts the early retirement explanation beside its field', () => {
    renderYouStep();

    const field = screen.getByRole('combobox', {
      name: /Mitu aastat varem plaanid pensionile minna/,
    });
    userEvent.click(helpButtonBeside(field, '.col-12', /Mis juhtub, kui lähed varem pensionile$/));

    expect(
      screen.getByRole('dialog', { name: 'Mis juhtub, kui lähed varem pensionile?' }),
    ).toBeInTheDocument();
  });

  it('tells that the result counts the child supplement', () => {
    renderYouStep();
    addEverything();
    const heading = screen.getByRole('heading', { name: 'Lapsed' });

    userEvent.click(
      helpButtonBeside(heading, '.you-section-head', /Kuidas lapsed pensioni mõjutavad$/),
    );
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText(/^2\. Pensionilisa:$/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/veel ei arvesta/)).not.toBeInTheDocument();
  });

  it('says the prefilled state pension is the average, not a forecast, and where to check it', () => {
    renderYouStep();
    const stateField = screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ });

    userEvent.click(helpButtonBeside(stateField, '.col-12', /Mis on riiklik pension$/));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(/See on keskmine vanaduspension 2026\.\saastal/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/See ei ole sinu riikliku pensioni prognoos/),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/arvutuslikku prognoosi/)).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: /^Sotsiaalkindlustusameti pensionikalkulaatoris/ }),
    ).toHaveAttribute('href', expect.stringContaining('pension-calculator'));
  });

  it('tells every saver, in a step of its own, to check the state pension without the children, since Elukaar adds their supplement', () => {
    renderYouStep();
    const stateField = screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ });

    userEvent.click(helpButtonBeside(stateField, '.col-12', /Mis on riiklik pension$/));
    const dialog = screen.getByRole('dialog');

    const childrenStep = within(dialog).getByText(
      /^Jäta „Pensionilisa“ alla lapsed lisamata: laste pensionilisa lisab Elukaar ise/,
    );
    expect(within(dialog).getAllByRole('listitem')).toContain(childrenStep);
    expect(within(dialog).queryByText(/küsib laste juures üle/)).not.toBeInTheDocument();
  });

  it('tells, in a step of its own, to check the state pension without the civil servant option, since Elukaar adds the increase', () => {
    renderYouStep();
    const stateField = screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ });

    userEvent.click(helpButtonBeside(stateField, '.col-12', /Mis on riiklik pension$/));
    const dialog = screen.getByRole('dialog');

    const civilServantStep = within(dialog).getByText(
      /^Jäta „Olen töötanud vähemalt 10\saastat avalikus teenistuses kuni 31\.03\.2018“ välja lülitatuks: ametniku staaži suurenduse lisab Elukaar ise/,
    );
    expect(within(dialog).getAllByRole('listitem')).toContain(civilServantStep);
    expect(within(dialog).queryByText(/Kui olid ametnik enne 2013/)).not.toBeInTheDocument();
  });

  it('tells that the pension age is projected from Tuleva’s data, not taken from the Social Insurance Board calculator', () => {
    renderYouStep();
    const ageField = screen.getByRole('combobox', { name: /Millal on sinu pensioniiga/ });

    userEvent.click(helpButtonBeside(ageField, '.col-12', /Kuidas pensioniiga määratakse$/));
    const dialog = within(screen.getByRole('dialog'));

    expect(
      dialog.getByText(
        /Pensioniiga on prognoositud Tuleva andmete järgi, mitte Sotsiaalkindlustusameti kalkulaatori järgi/,
      ),
    ).toBeInTheDocument();
    expect(
      dialog.queryByText(/Arvutame nagu Sotsiaalkindlustusameti kalkulaator/),
    ).not.toBeInTheDocument();
    expect(
      dialog.queryByText(/kui Sotsiaalkindlustusameti kalkulaator näitab/),
    ).not.toBeInTheDocument();
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

  it('tells a parent retiring five years early that the II pillar payout is chosen on the pillars step', () => {
    renderYouStep();

    const dialog = openKidsHelp();

    expect(dialog).toHaveTextContent(/5\saastat varem pensionile minnes „60\sa sambad“/);
  });

  it('dates the child supplement from children born in 1991, as the Social Insurance Board does', () => {
    renderYouStep();

    const dialog = openKidsHelp();

    expect(dialog).toHaveTextContent(/1991\.–2012\.\sa sündinud laps: 3,5 aastahinnet/);
    expect(dialog).toHaveTextContent(/enne 1991\.\sa sündinud laps: 1,5 aastahinnet/);
    expect(dialog).not.toHaveTextContent(/1981/);
  });

  it('tells in the hazardous work explanation that too few list years leave out early retirement, as the field hint does', () => {
    renderYouStep();

    const dialog = openHazardHelp();

    expect(dialog).toHaveTextContent(/Elukaar kontrollib ainult nimekirja tööaastaid/);
    expect(dialog).not.toHaveTextContent(/Elukaar tingimusi ei kontrolli/);
  });

  it('tells in the hazardous work explanation that the underground work supplement is not in the calculation', () => {
    renderYouStep();

    const dialog = openHazardHelp();

    expect(dialog).toHaveTextContent(/allmaatöö[^.]*arvutus veel ei arvesta/i);
  });

  const socialInsuranceBoardPages: [string, () => HTMLElement, RegExp, string][] = [
    [
      'hazardous work',
      openHazardHelp,
      /^SKA: soodustingimustel vanaduspension/,
      'https://sotsiaalkindlustusamet.ee/pension-ja-seotud-huvitised/pensioni-liigid/soodustingimustel-vanaduspension',
    ],
    [
      'kids',
      openKidsHelp,
      /^SKA: laste kasvatamine ja pension/,
      'https://sotsiaalkindlustusamet.ee/pension-ja-seotud-huvitised/pensioni-suurus/laste-kasvatamine-ja-pension',
    ],
  ];

  it.each(socialInsuranceBoardPages)(
    'links the %s explanation to the Social Insurance Board page in Estonian',
    (_, openHelp, name, href) => {
      renderYouStep();

      expect(within(openHelp()).getByRole('link', { name })).toHaveAttribute('href', href);
    },
  );

  it('tells a rescuer until which year of retirement the calculation counts the service increase', () => {
    renderYouStep();

    expect(openRescueHelp()).toHaveTextContent(
      /Elukaar arvestab suurendust, kui lähed pensionile hiljemalt 2042\.\saastal/,
    );
  });

  const threeChildrenExample: [string, () => HTMLElement][] = [
    ['kids', openKidsHelp],
    ['early retirement', openEarlyRetirementHelp],
  ];

  it.each(threeChildrenExample)(
    'quotes the same totals for retiring a year early with three children in the %s explanation',
    (_, openHelp) => {
      renderYouStep();

      const dialog = openHelp();

      expect(dialog).toHaveTextContent(/19\saasta[^.]*u 2 700 €/);
      expect(dialog).toHaveTextContent(/10 200 €/);
    },
  );

  it('names the rescue service and links the calculator in the early retirement explanation', () => {
    renderYouStep();

    const dialog = openEarlyRetirementHelp();

    expect(dialog).toHaveTextContent(/Päästeteenistuse staažiga \(vähemalt 15\sa\)/);
    expect(
      within(dialog).getByRole('link', { name: /^Sotsiaalkindlustusameti pensionikalkulaator/ }),
    ).toHaveAttribute('href', expect.stringContaining('pension-calculator'));
  });

  it('leaves the field labels as they were for screen readers', () => {
    renderYouStep();

    expect(screen.getByRole('combobox', { name: /^Mis on sinu sugu\?/ })).toBeInTheDocument();
  });
});

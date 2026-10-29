import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
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
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return { Chart: forwardRef(() => <div data-testid="mock-chart" />) };
});

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

const typeInto = (field: HTMLElement, text: string) => {
  userEvent.clear(field);
  userEvent.type(field, text);
};

const openResultStep = () => {
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <FutureMe />
    </IntlProvider>,
  );
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu riiklik pension/ }), '700');
  typeInto(screen.getByRole('spinbutton', { name: /Kui suur on sinu brutopalk/ }), '2000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on II\ssambas praegu/ }), '10000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju on III\ssambas praegu/ }), '5000');
  typeInto(screen.getByRole('spinbutton', { name: /Kui palju maksad III\ssambasse kuus/ }), '50');
  userEvent.click(
    within(screen.getByRole('navigation', { name: 'Loo etapid' })).getByRole('button', {
      name: /^Tulemus, vaatamata$/,
    }),
  );
};

const markdownButton = () => screen.getByRole('button', { name: 'Laadi alla tekstina (MD-fail)' });
const pdfButton = () => screen.getByRole('button', { name: 'Laadi alla (PDF)' });

const textOf = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

const createObjectURL = jest.fn<string, [Blob]>();
const downloadedFile = async () => {
  const [[blob]] = createObjectURL.mock.calls;
  return textOf(blob);
};

describe('Result step: save the result', () => {
  beforeEach(() => {
    mockUseMe.mockReturnValue({
      data: { ...mockUser, thirdPillarInitDate: '2022-01-01', dateOfBirth: '1962-01-01' },
      isLoading: false,
    } as ReturnType<typeof useMe>);
    createObjectURL.mockReset().mockReturnValue('blob:result');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = jest.fn();
  });

  it('offers the result as a text file and as a PDF', () => {
    openResultStep();

    expect(screen.getByRole('heading', { level: 3, name: 'Salvesta tulemus' })).toBeVisible();
    expect(markdownButton()).toBeVisible();
    expect(pdfButton()).toHaveAccessibleDescription(
      /^PDF: vali printimisaknas „Salvesta\sPDF-\u2060ina“\.$/,
    );
  });

  it('names the text file by the date', () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    openResultStep();

    userEvent.click(markdownButton());

    const link = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(link.download).toMatch(/^tulevane-mina-\d{4}-\d{2}-\d{2}\.md$/);
    expect(link.href).toBe('blob:result');
    click.mockRestore();
  });

  it('writes the answer, the decisions, the assumptions and the rules into the file', async () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    openResultStep();

    userEvent.click(markdownButton());

    const file = await downloadedFile();
    expect(file).toMatch(/^# Tulevane Mina: minu pensionilugu\n\n_Koostatud /);
    expect(file).toContain('## Kas raha jätkub elu lõpuni?');
    expect(file).toContain('### Sinu otsused');
    expect(file).toContain(
      '- 60 a · 2022, avanenud · II sammas 60-aastaselt · Sinu valik: Jätkan kasvatamist',
    );
    expect(file).toContain('### Eeldused');
    expect(file).toContain('### Reeglid ja maksud');
  });

  it('puts the income table and the comparison into the file even when they are closed', async () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    openResultStep();

    userEvent.click(markdownButton());

    const file = await downloadedFile();
    expect(file).toContain('**Sissetulek ja kulud kuus vanuse järgi');
    expect(file).toMatch(/\n\| Vanus \| .+ \| Kulud \|\n\| --- \|/);
    expect(file).toContain('**Väljamakse teede võrdlus**');
    expect(
      screen.queryByRole('table', { name: 'Väljamakse teede võrdlus' }),
    ).not.toBeInTheDocument();
  });

  it('leaves the buttons out of the file', async () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    openResultStep();

    userEvent.click(markdownButton());

    const file = await downloadedFile();
    expect(file).not.toContain('Muuda sammus');
    expect(file).not.toContain('Laadi alla');
  });

  it('leaves the summary tiles out of the file, as the answer above them says the same', async () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    openResultStep();

    userEvent.click(markdownButton());

    const file = await downloadedFile();
    expect(file).toContain('Sinu kulud (791 € kuus) on kaetud kuni 81. eluaastani.');
    expect(file).not.toContain('kulud kaetud kuni');
    expect(file).not.toContain('samba raha lõpeb');
  });

  it('leaves the open choices and editors out of the file, so only the chosen plan is in it', async () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    openResultStep();
    userEvent.click(markdownButton());

    userEvent.click(screen.getByRole('button', { name: /^Muuda II\ssammas 60/ }));
    userEvent.click(screen.getByRole('button', { name: 'Muuda kulupaketti' }));
    userEvent.click(markdownButton());

    const [[closedBlob], [openBlob]] = createObjectURL.mock.calls;
    expect(await textOf(openBlob)).toBe(await textOf(closedBlob));
  });

  const comparisonTable = () => screen.queryByRole('table', { name: 'Väljamakse teede võrdlus' });
  const chartGuide = () => screen.getByText(/^Kihid näitavad, millest sinu kulud/);
  const closePrintWindow = () =>
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });

  it('opens the print window with the comparison shown', () => {
    let isComparisonPrinted = false;
    window.print = jest.fn(() => {
      isComparisonPrinted = comparisonTable() !== null;
    });
    openResultStep();

    userEvent.click(pdfButton());

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(isComparisonPrinted).toBe(true);
  });

  it('gives the printed comparison a caption of its own while the page shows the comparison too', () => {
    let captionIds: string[] = [];
    window.print = jest.fn(() => {
      captionIds = screen
        .getAllByText('Väljamakse teede võrdlus', { selector: 'caption' })
        .map(({ id }) => id);
    });
    openResultStep();
    userEvent.click(screen.getByText('Võrdle kõiki väljamakse teid'));

    userEvent.click(pdfButton());

    expect(captionIds).toHaveLength(2);
    expect(new Set(captionIds).size).toBe(2);
  });

  it('opens every accordion for the print', () => {
    window.print = jest.fn(() => expect(chartGuide()).toBeVisible());
    openResultStep();
    expect(chartGuide()).not.toBeVisible();

    userEvent.click(pdfButton());

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('puts the page back as it was once the print window closes', () => {
    window.print = jest.fn();
    openResultStep();
    userEvent.click(pdfButton());
    expect(comparisonTable()).toBeInTheDocument();

    closePrintWindow();

    expect(comparisonTable()).not.toBeInTheDocument();
    expect(chartGuide()).not.toBeVisible();
  });
});

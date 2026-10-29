import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { FutureMe } from './FutureMe';
import { useMe } from '../common/apiHooks';
import { createTrackedEvent } from '../common/api';
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
jest.mock('../common/api', () => ({ createTrackedEvent: jest.fn() }));
jest.mock('../tracking/actions', () => ({ trackCustomEvent: jest.fn() }));
jest.mock('react-chartjs-2', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { forwardRef } = require('react');
  return { Chart: forwardRef(() => <div data-testid="mock-chart" />) };
});

const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockCreateTrackedEvent = createTrackedEvent as jest.MockedFunction<typeof createTrackedEvent>;

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

const feedbackField = () =>
  screen.getByRole('textbox', { name: 'Mis sulle selgeks sai ja mida sa nüüd teisiti teed?' });
const sendButton = () => screen.getByRole('button', { name: 'Saada tagasiside' });

const isAfter = (earlier: HTMLElement, later: HTMLElement) =>
  earlier.compareDocumentPosition(later) === Node.DOCUMENT_POSITION_FOLLOWING;

describe('Result step: feedback', () => {
  beforeEach(() => {
    mockUseMe.mockReturnValue({
      data: { ...mockUser, thirdPillarInitDate: '2022-01-01', dateOfBirth: '1962-01-01' },
      isLoading: false,
    } as ReturnType<typeof useMe>);
    mockCreateTrackedEvent.mockReset().mockResolvedValue({});
  });

  it('asks for feedback after the save buttons, with a hint on what to write', () => {
    openResultStep();

    expect(feedbackField()).toHaveAccessibleDescription('Kirjuta ka, mis jäi segaseks.');
    expect(isAfter(screen.getByRole('button', { name: 'Laadi alla (PDF)' }), feedbackField())).toBe(
      true,
    );
  });

  it('sends the feedback as a tracked event and thanks the user', async () => {
    window.history.pushState({}, '', '/future-me');
    openResultStep();

    userEvent.type(feedbackField(), 'Sain aru, millal III sammas avaneb.');
    userEvent.click(sendButton());

    expect(await screen.findByText('Aitäh!')).toBeVisible();
    expect(screen.getByText('Loeme kõik vastused läbi.')).toBeVisible();
    expect(mockCreateTrackedEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateTrackedEvent).toHaveBeenCalledWith('CLICK', {
      target: 'future_me_feedback',
      path: '/future-me',
      formVersion: 1,
      comment: 'Sain aru, millal III sammas avaneb.',
    });
    expect(
      screen.queryByRole('textbox', { name: /Mis sulle selgeks sai/ }),
    ).not.toBeInTheDocument();
  });

  it('masks an e-mail address in the feedback before sending it', async () => {
    openResultStep();

    userEvent.type(feedbackField(), 'Kirjuta mulle mari@example.com');
    userEvent.click(sendButton());

    expect(await screen.findByText('Aitäh!')).toBeVisible();
    expect(mockCreateTrackedEvent).toHaveBeenCalledWith(
      'CLICK',
      expect.objectContaining({ comment: 'Kirjuta mulle [email]' }),
    );
  });

  it('treats the field as optional: an empty answer is not sent and shows no error', () => {
    openResultStep();

    userEvent.type(feedbackField(), '   ');
    userEvent.click(sendButton());

    expect(feedbackField()).toBeValid();
    expect(feedbackField()).not.toBeRequired();
    expect(feedbackField()).toHaveAccessibleDescription('Kirjuta ka, mis jäi segaseks.');
    expect(mockCreateTrackedEvent).not.toHaveBeenCalled();
  });

  it('keeps the answer and says so when sending fails', async () => {
    mockCreateTrackedEvent.mockRejectedValue(new Error('network'));
    openResultStep();

    userEvent.type(feedbackField(), 'Väga hea');
    userEvent.click(sendButton());

    expect(
      await screen.findByText('Tagasiside saatmine ei õnnestunud. Proovi uuesti.'),
    ).toBeVisible();
    expect(feedbackField()).toHaveValue('Väga hea');
    expect(screen.queryByText('Aitäh!')).not.toBeInTheDocument();
  });

  it('leaves the feedback box out of the downloaded result', async () => {
    const createObjectURL = jest.fn<string, [Blob]>().mockReturnValue('blob:result');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = jest.fn();
    openResultStep();

    userEvent.click(screen.getByRole('button', { name: 'Laadi alla tekstina (MD-fail)' }));

    const [[blob]] = createObjectURL.mock.calls;
    const file = await new Response(blob).text();
    expect(file).toContain('Kas raha jätkub elu lõpuni?');
    expect(file).not.toContain('Mis sulle selgeks sai');
  });
});

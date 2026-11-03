import { captureException } from '@sentry/browser';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { setupServer } from 'msw/node';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { createDefaultStore, renderWrapped } from '../../../../../test/utils';
import {
  failingTkfDocumentsBackend,
  heldTkfDocumentsBackend,
  missingTkfDocumentsPageBackend,
  nonListTkfDocumentsBackend,
  TKF_DOCUMENT_FIELDS,
  tkfDocumentsBackend,
  unreachableTkfDocumentsBackend,
  unreadableTkfDocumentsBackend,
  unresponsiveTkfDocumentsBackend,
} from '../../../../../test/backend';
import { TermsStep } from './TermsStep';
import { OnboardingFormData, CompanyOnboardingFormData } from '../types';
import translations from '../../../../translations';

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => tkfDocumentsBackend(server));
afterEach(() => {
  server.resetHandlers();
  onlineManager.setOnline(undefined);
  focusManager.setFocused(undefined);
  jest.useRealTimers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

const FUND_DOCUMENTS_PAGE = 'https://tuleva.ee/en/additional-investment-fund-documents/';
const ESTONIAN_FUND_DOCUMENTS_PAGE = 'https://tuleva.ee/tuleva-taiendav-kogumisfond-dokumendid/';

const comeBackToTheWindow = () =>
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });

const watchFundPageReads = () => jest.spyOn(window, 'fetch');

const ignoreTheOutcome = () => undefined;

const fundPageReadFinishingAfterItsCancel = (fields: Record<string, unknown>) => {
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const read = jest.spyOn(window, 'fetch').mockImplementationOnce(async () => {
    await finished;
    return { ok: true, json: async () => [{ acf: fields }] } as Response;
  });
  return { finish, done: () => read.mock.results[0].value };
};

const letTheReadFinish = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const TermsStepWrapper = ({
  showError = false,
  language = 'en',
  onTermsStep = true,
}: {
  showError?: boolean;
  language?: 'en' | 'et';
  onTermsStep?: boolean;
}) => {
  const { control, trigger } = useForm<OnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      citizenship: [],
      address: {
        countryCode: 'EE',
        street: '',
        city: '',
        postalCode: '',
      },
      email: '',
      phoneNumber: '',
      pepSelfDeclaration: null,
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale={language} messages={translations[language]}>
      <form>
        {onTermsStep && <TermsStep control={control} showError={showError} />}
        <button type="button" onClick={() => trigger('termsAccepted')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

const CompanyTermsStepWrapper = () => {
  const { control, trigger } = useForm<CompanyOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      registryLookup: undefined,
      companyValidatedData: undefined,
      companyAddress: { reuseBackendAddress: true },
      investmentGoals: null,
      investableAssets: null,
      sourceOfCompanyIncome: {
        ONLY_ACTIVE_IN_ESTONIA: false,
        NOT_SANCTIONED_NOT_PROFITING_FROM_SANCTIONED_COUNTRIES: false,
        NOT_IN_CRYPTO: false,
      },
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <TermsStep control={control} />
        <button type="button" onClick={() => trigger('termsAccepted')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

describe('TermsStep', () => {
  test('renders the title', () => {
    renderWrapped(<TermsStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Review the fund’s key information',
    );
  });

  test('renders the fund summary bullets with icons', () => {
    renderWrapped(<TermsStepWrapper />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    expect(screen.getByText('Fund fee 0.28% per year')).toBeInTheDocument();
    expect(screen.getByText('A globally diversified stock index fund')).toBeInTheDocument();
    expect(screen.getByText('Flexible withdrawals within three business days')).toBeInTheDocument();

    expect(
      screen.queryByText(
        'The value can fluctuate from year to year, so it is best suited for long-term investing',
      ),
    ).not.toBeInTheDocument();
  });

  test('links the current terms, prospectus and key information from the fund page', async () => {
    renderWrapped(<TermsStepWrapper />);

    const termsLink = await screen.findByRole('link', { name: /^Terms/ });
    expect(termsLink).toHaveAttribute('href', TKF_DOCUMENT_FIELDS.terms_file);
    expect(termsLink).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /^Prospectus/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.prospectus_file,
    );
    expect(screen.getByRole('link', { name: /^Key information/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.key_investor_info_file,
    );
    expect(screen.queryByRole('link', { name: /^All fund documents/ })).not.toBeInTheDocument();
  });

  test('does not link documents that are not yet in force', async () => {
    const upcomingProspectus =
      'https://tuleva.ee/wp-content/uploads/2026/12/TKF100-Prospekt-kehtib-alates-01.01.2027.pdf';
    tkfDocumentsBackend(server, {
      ...TKF_DOCUMENT_FIELDS,
      prospectus_upcoming_file: upcomingProspectus,
      terms_upcoming_file:
        'https://tuleva.ee/wp-content/uploads/2026/12/TKF100-Tingimused-kehtivad-alates-01.01.2027.pdf',
    });

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^Prospectus/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.prospectus_file,
    );
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  test('adds the fund documents page when the fund page lacks a document in force', async () => {
    tkfDocumentsBackend(server, { ...TKF_DOCUMENT_FIELDS, key_investor_info_file: false });

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toHaveAttribute(
      'href',
      FUND_DOCUMENTS_PAGE,
    );
    expect(screen.getByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Key information/ })).not.toBeInTheDocument();
  });

  test('treats a document address that is not https as missing', async () => {
    tkfDocumentsBackend(server, {
      ...TKF_DOCUMENT_FIELDS,
      prospectus_file:
        'http://tuleva.ee/wp-content/uploads/2026/09/TKF100-Prospekt-alates-29.10.2026.pdf',
    });

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Prospectus/ })).not.toBeInTheDocument();
  });

  test('treats a document hosted outside tuleva.ee as missing', async () => {
    tkfDocumentsBackend(server, {
      ...TKF_DOCUMENT_FIELDS,
      terms_file: 'https://example.com/TKF100-Tingimused.pdf',
    });

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Terms/ })).not.toBeInTheDocument();
  });

  test('links only the fund documents page when the fund page has no document fields', async () => {
    tkfDocumentsBackend(server, false);

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toHaveAttribute(
      'href',
      FUND_DOCUMENTS_PAGE,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  test('links only the fund documents page when the fund page cannot be read', async () => {
    failingTkfDocumentsBackend(server);

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toHaveAttribute(
      'href',
      FUND_DOCUMENTS_PAGE,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  test('links the Estonian fund documents page in Estonian', async () => {
    failingTkfDocumentsBackend(server);

    renderWrapped(<TermsStepWrapper language="et" />);

    expect(await screen.findByRole('link', { name: /^Kõik fondi dokumendid/ })).toHaveAttribute(
      'href',
      ESTONIAN_FUND_DOCUMENTS_PAGE,
    );
  });

  test('keeps the links without reading the fund page again when the person comes back from a document', async () => {
    renderWrapped(<TermsStepWrapper />);
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    const fundPageReads = watchFundPageReads();

    comeBackToTheWindow();

    expect(fundPageReads).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /^Terms/ })).toBeInTheDocument();
  });

  test('keeps the links without reading the fund page again when the step opens again', async () => {
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    const { unmount } = renderWrapped(
      <TermsStepWrapper />,
      history,
      createDefaultStore(history),
      queryClient,
    );
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();

    unmount();
    const fundPageReads = watchFundPageReads();
    renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);

    expect(fundPageReads).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /^Terms/ })).toBeInTheDocument();
  });

  test('reads the fund page again when the person comes back after it could not be read', async () => {
    failingTkfDocumentsBackend(server);
    renderWrapped(<TermsStepWrapper />);
    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();

    tkfDocumentsBackend(server);
    comeBackToTheWindow();

    expect(await screen.findByRole('link', { name: /^Terms/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.terms_file,
    );
    expect(screen.queryByRole('link', { name: /^All fund documents/ })).not.toBeInTheDocument();
  });

  test('asks for the confirmation again when the links change after it was given', async () => {
    failingTkfDocumentsBackend(server);
    renderWrapped(<TermsStepWrapper />);
    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();
    const termsCheckbox = screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ });
    userEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    tkfDocumentsBackend(server);
    comeBackToTheWindow();

    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    expect(termsCheckbox).not.toBeChecked();
  });

  test('keeps the confirmation when the person goes back and returns to the same links', async () => {
    const { rerender } = renderWrapped(<TermsStepWrapper />);
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ }));

    rerender(<TermsStepWrapper onTermsStep={false} />);
    rerender(<TermsStepWrapper />);

    expect(screen.getByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ })).toBeChecked();
  });

  test('asks for the confirmation again when the links changed while the person was away from the step', async () => {
    failingTkfDocumentsBackend(server);
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    const { rerender } = renderWrapped(
      <TermsStepWrapper />,
      history,
      createDefaultStore(history),
      queryClient,
    );
    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ }));

    rerender(<TermsStepWrapper onTermsStep={false} />);
    act(() => {
      queryClient.setQueryData(['tkfDocuments'], TKF_DOCUMENT_FIELDS);
    });
    rerender(<TermsStepWrapper />);

    expect(screen.getByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ }),
    ).not.toBeChecked();
  });

  test('asks for the confirmation again when the links reload while the person was away from the step', async () => {
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    const { rerender } = renderWrapped(
      <TermsStepWrapper />,
      history,
      createDefaultStore(history),
      queryClient,
    );
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ }));

    rerender(<TermsStepWrapper onTermsStep={false} />);
    jest.useFakeTimers();
    unresponsiveTkfDocumentsBackend(server);
    await act(async () => {
      queryClient.resetQueries();
      await Promise.resolve();
    });
    rerender(<TermsStepWrapper />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ }),
    ).not.toBeChecked();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  test('adds the fund documents page when a later reload of the fund page fails', async () => {
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();

    failingTkfDocumentsBackend(server);
    await act(() => queryClient.refetchQueries());

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toHaveAttribute(
      'href',
      FUND_DOCUMENTS_PAGE,
    );
    expect(screen.getByRole('link', { name: /^Terms/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.terms_file,
    );
  });

  test('keeps the fund documents page link while it tries the fund page again', async () => {
    failingTkfDocumentsBackend(server);
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);
    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();

    jest.useFakeTimers();
    unresponsiveTkfDocumentsBackend(server);
    await act(async () => {
      queryClient.refetchQueries();
      await Promise.resolve();
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByRole('link', { name: /^All fund documents/ })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  test('shows the links at once when the step opens again long after it was left', async () => {
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    const { unmount } = renderWrapped(
      <TermsStepWrapper />,
      history,
      createDefaultStore(history),
      queryClient,
    );
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();

    jest.useFakeTimers();
    unmount();
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });
    unresponsiveTkfDocumentsBackend(server);
    renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);

    expect(screen.getByRole('link', { name: /^Terms/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.terms_file,
    );
    expect(screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ })).toBeEnabled();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  test('clears the confirmation when the links have to load again', async () => {
    const queryClient = new QueryClient();
    const history = createMemoryHistory();
    renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    const termsCheckbox = screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ });
    userEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    jest.useFakeTimers();
    unresponsiveTkfDocumentsBackend(server);
    await act(async () => {
      queryClient.resetQueries();
      await Promise.resolve();
      jest.advanceTimersByTime(0);
    });

    expect(screen.queryByRole('link', { name: /^Terms/ })).not.toBeInTheDocument();
    expect(termsCheckbox).not.toBeChecked();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  test('links the fund documents page when the fund page does not answer within 5 seconds', async () => {
    jest.useFakeTimers();
    unresponsiveTkfDocumentsBackend(server);

    renderWrapped(<TermsStepWrapper />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(await screen.findByRole('link', { name: /^All fund documents/ })).toHaveAttribute(
      'href',
      FUND_DOCUMENTS_PAGE,
    );
  });

  test('loads the documents even when the browser reports being offline', async () => {
    onlineManager.setOnline(false);

    renderWrapped(<TermsStepWrapper />);

    expect(await screen.findByRole('link', { name: /^Terms/ })).toHaveAttribute(
      'href',
      TKF_DOCUMENT_FIELDS.terms_file,
    );
  });

  test('renders the terms checkbox', () => {
    renderWrapped(<TermsStepWrapper />);

    expect(
      screen.getByRole('checkbox', {
        name: 'I confirm that I have reviewed the documents and understand that the investment may increase or decrease in value over time',
      }),
    ).toBeInTheDocument();
  });

  test('holds a card for each document while the links load', async () => {
    renderWrapped(<TermsStepWrapper />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getAllByTestId('document-placeholder')).toHaveLength(3);

    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    expect(screen.queryByTestId('document-placeholder')).not.toBeInTheDocument();
  });

  test('lets the terms be accepted only once the document links are shown', async () => {
    renderWrapped(<TermsStepWrapper />);
    const termsCheckbox = screen.getByRole('checkbox', { name: /^I confirm that I have reviewed/ });
    expect(termsCheckbox).toBeDisabled();

    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
    expect(termsCheckbox).toBeEnabled();
  });

  test('shows validation error when checkbox is not checked and validation is triggered', async () => {
    renderWrapped(<TermsStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'You must review the documents to continue.',
      );
    });
  });

  test('shows error when showError prop is true', () => {
    renderWrapped(<TermsStepWrapper showError />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You must review the documents to continue.',
    );
  });

  test('works with CompanyOnboardingFormData', () => {
    renderWrapped(<CompanyTermsStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Review the fund’s key information',
    );
  });

  test('does not show validation error when checkbox is checked', async () => {
    renderWrapped(<TermsStepWrapper />);
    expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();

    const termsCheckbox = screen.getByRole('checkbox', {
      name: 'I confirm that I have reviewed the documents and understand that the investment may increase or decrease in value over time',
    });
    userEvent.click(termsCheckbox);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('reporting a fallback to the fund documents page', () => {
    const expectOneFallbackReported = (reason: string) => {
      const message = `TKF100 document links fell back to the documents page: reason=${reason}`;
      expect(captureException).toHaveBeenCalledTimes(1);
      expect(captureException).toHaveBeenCalledWith(new Error(message), { fingerprint: [message] });
    };

    const fundDocumentsPageLink = () => screen.findByRole('link', { name: /^All fund documents/ });

    test('reports nothing when the fund page links every document in force', async () => {
      renderWrapped(<TermsStepWrapper />);

      expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
      expect(captureException).not.toHaveBeenCalled();
    });

    test('reports the field when the fund page lacks a document in force', async () => {
      tkfDocumentsBackend(server, { ...TKF_DOCUMENT_FIELDS, key_investor_info_file: false });

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('missing:key_investor_info_file');
    });

    test('reports a document hosted outside tuleva.ee as missing', async () => {
      tkfDocumentsBackend(server, {
        ...TKF_DOCUMENT_FIELDS,
        terms_file: 'https://example.com/TKF100-Tingimused.pdf',
      });

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('missing:terms_file');
    });

    test('reports every field when the fund page leaves all three documents empty', async () => {
      tkfDocumentsBackend(server, {
        terms_file: false,
        prospectus_file: false,
        key_investor_info_file: false,
      });

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('missing:terms_file,prospectus_file,key_investor_info_file');
    });

    test.each([
      ['false', false],
      ['an empty list', []],
      ['text', 'none'],
    ] as const)(
      'reports no fields when the fund page answers %s for its document fields',
      async (_, fields) => {
        tkfDocumentsBackend(server, fields);

        renderWrapped(<TermsStepWrapper />);

        expect(await fundDocumentsPageLink()).toBeInTheDocument();
        expectOneFallbackReported('no-fields');
      },
    );

    test('reports the status when the fund page answers with an error', async () => {
      failingTkfDocumentsBackend(server);

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('http-500');
    });

    test('reports a missing page when no page has the fund page address', async () => {
      missingTkfDocumentsPageBackend(server);

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('no-page');
    });

    test('reports an unreadable answer when the fund page does not answer a list of pages', async () => {
      nonListTkfDocumentsBackend(server);

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('unreadable-answer');
    });

    test('reports nothing for a read the person left before it finished, and reads again on return', async () => {
      const fundPageReads = watchFundPageReads();
      const leftRead = heldTkfDocumentsBackend(server, {});
      const queryClient = new QueryClient();
      const history = createMemoryHistory();
      const { unmount } = renderWrapped(
        <TermsStepWrapper />,
        history,
        createDefaultStore(history),
        queryClient,
      );
      await act(() => leftRead.arrived);

      unmount();
      leftRead.answer();
      await act(() => fundPageReads.mock.results[0].value.then(ignoreTheOutcome, ignoreTheOutcome));
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

      expect(captureException).not.toHaveBeenCalled();

      tkfDocumentsBackend(server);
      renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);

      expect(await screen.findByRole('link', { name: /^Terms/ })).toHaveAttribute(
        'href',
        TKF_DOCUMENT_FIELDS.terms_file,
      );
    });

    test('reports nothing for a read that finished after the person left the step', async () => {
      const lateRead = fundPageReadFinishingAfterItsCancel({});
      const { unmount } = renderWrapped(<TermsStepWrapper />);

      unmount();
      lateRead.finish();
      await act(() => lateRead.done());
      await letTheReadFinish();

      expect(captureException).not.toHaveBeenCalled();
    });

    test('reports nothing for a read that finished after a reload replaced it', async () => {
      const lateRead = fundPageReadFinishingAfterItsCancel({});
      const queryClient = new QueryClient();
      const history = createMemoryHistory();
      renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);

      act(() => {
        queryClient.resetQueries();
      });
      expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();
      lateRead.finish();
      await act(() => lateRead.done());
      await letTheReadFinish();

      expect(captureException).not.toHaveBeenCalled();
    });

    test('reports nothing for a read that a reload replaced', async () => {
      const fundPageReads = watchFundPageReads();
      const replacedRead = heldTkfDocumentsBackend(server, {});
      const queryClient = new QueryClient();
      const history = createMemoryHistory();
      renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);
      await act(() => replacedRead.arrived);

      tkfDocumentsBackend(server);
      act(() => {
        queryClient.resetQueries();
      });
      expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();

      replacedRead.answer();
      await act(() => fundPageReads.mock.results[0].value.then(ignoreTheOutcome, ignoreTheOutcome));
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

      expect(captureException).not.toHaveBeenCalled();
    });

    test('reports an unreadable answer when the fund page does not answer JSON', async () => {
      unreadableTkfDocumentsBackend(server);

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('unreadable-answer');
    });

    test('reports a network failure when the fund page cannot be reached', async () => {
      unreachableTkfDocumentsBackend(server);

      renderWrapped(<TermsStepWrapper />);

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('network');
    });

    test('reports a timeout when the fund page does not answer within 5 seconds', async () => {
      jest.useFakeTimers();
      unresponsiveTkfDocumentsBackend(server);

      renderWrapped(<TermsStepWrapper />);
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expectOneFallbackReported('timeout');
    });

    test('reports a failed reload while the earlier links stay shown', async () => {
      const queryClient = new QueryClient();
      const history = createMemoryHistory();
      renderWrapped(<TermsStepWrapper />, history, createDefaultStore(history), queryClient);
      expect(await screen.findByRole('link', { name: /^Terms/ })).toBeInTheDocument();

      failingTkfDocumentsBackend(server);
      await act(() => queryClient.refetchQueries());

      expect(await fundDocumentsPageLink()).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^Terms/ })).toBeInTheDocument();
      expectOneFallbackReported('http-500');
    });
  });
});

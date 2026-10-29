import { onlineManager, QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { setupServer } from 'msw/node';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { createDefaultStore, renderWrapped } from '../../../../../test/utils';
import {
  failingTkfDocumentsBackend,
  TKF_DOCUMENT_FIELDS,
  tkfDocumentsBackend,
  unresponsiveTkfDocumentsBackend,
} from '../../../../../test/backend';
import { TermsStep } from './TermsStep';
import { OnboardingFormData, CompanyOnboardingFormData } from '../types';
import translations from '../../../../translations';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => tkfDocumentsBackend(server));
afterEach(() => {
  server.resetHandlers();
  onlineManager.setOnline(undefined);
  jest.useRealTimers();
});
afterAll(() => server.close());

const FUND_DOCUMENTS_PAGE = 'https://tuleva.ee/tuleva-taiendav-kogumisfond-dokumendid/';

const TermsStepWrapper = ({ showError = false }: { showError?: boolean }) => {
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
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <TermsStep control={control} showError={showError} />
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
});

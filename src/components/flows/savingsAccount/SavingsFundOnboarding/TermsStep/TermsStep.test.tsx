import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { TermsStep } from './TermsStep';
import { OnboardingFormData, CompanyOnboardingFormData } from '../types';
import translations, { TranslationKey } from '../../../../translations';

const DOCUMENTS: { href: string; labelId: TranslationKey }[] = [
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Tingimused.-12.01.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Prospekt.-12.01.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
  },
  {
    href: 'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Pohiteabedokument.-12.01.2026.pdf',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
  },
];

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
      investmentGoals: null,
      investableAssets: null,
      sourceOfIncome: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <TermsStep control={control} documents={DOCUMENTS} showError={showError} />
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
        <TermsStep control={control} documents={DOCUMENTS} />
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

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Review fund documents');
  });

  test('renders links to all fund documents', () => {
    renderWrapped(<TermsStepWrapper />);

    const termsLink = screen.getByRole('link', { name: /Terms/i });
    expect(termsLink).toHaveAttribute(
      'href',
      'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Tingimused.-12.01.2026.pdf',
    );
    expect(termsLink).toHaveAttribute('target', '_blank');

    const prospectusLink = screen.getByRole('link', { name: /Prospectus/i });
    expect(prospectusLink).toHaveAttribute(
      'href',
      'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Prospekt.-12.01.2026.pdf',
    );

    const keyInfoLink = screen.getByRole('link', { name: /Key information/i });
    expect(keyInfoLink).toHaveAttribute(
      'href',
      'https://tuleva.ee/wp-content/uploads/2026/01/Tuleva-Taiendav-Kogumisfond.-Pohiteabedokument.-12.01.2026.pdf',
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

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Review fund documents');
  });

  test('does not show validation error when checkbox is checked', async () => {
    renderWrapped(<TermsStepWrapper />);

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

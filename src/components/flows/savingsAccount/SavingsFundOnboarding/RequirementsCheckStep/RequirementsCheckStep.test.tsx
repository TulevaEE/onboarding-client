import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useForm } from 'react-hook-form';
import { companyValidationBackend } from '../../../../../test/backend';
import { mockValidatedCompany } from '../../../../../test/backend-responses';
import { ValidationError } from '../../../../common/apiModels/company-onboarding';
import { initializeConfiguration } from '../../../../config/config';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyOnboardingFormData } from '../types';
import { RequirementsCheckStep } from './RequirementsCheckStep';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  companyValidationBackend(server);
});

// The backend marks unverified connected people with dedicated codes on the
// relatedPersons field: USER_KYC means the logged-in user is one of them,
// OTHER_RELATED_PERSONS_KYC means someone else is. It does not expose which
// specific person via the code.
const USER_KYC_ERROR: ValidationError = {
  code: 'USER_KYC',
  message: 'Sinu isikusamasuse tuvastamine on lõpetamata',
};
const OTHER_PERSONS_KYC_ERROR: ValidationError = {
  code: 'OTHER_RELATED_PERSONS_KYC',
  message: 'Isikusamasuse tuvastamine on lõpetamata: Person McPerson',
};
const relatedPersonsError = (...errors: ValidationError[]) =>
  rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
    res(
      ctx.json({
        ...mockValidatedCompany,
        relatedPersons: {
          value: mockValidatedCompany.relatedPersons.value,
          errors,
        },
      }),
    ),
  );
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const RequirementsCheckStepWrapper = ({
  defaultValues,
}: {
  defaultValues?: CompanyOnboardingFormData['registryLookup'];
}) => {
  const { control } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: { registryLookup: defaultValues },
  });

  return <RequirementsCheckStep control={control} />;
};

describe('RequirementsCheckStep', () => {
  it('renders title', () => {
    renderWrapped(<RequirementsCheckStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company details');
  });

  it('renders description', () => {
    renderWrapped(<RequirementsCheckStepWrapper />);

    expect(
      screen.getByText(
        'If the information here is incorrect, the data must be updated in the business registry.',
      ),
    ).toBeInTheDocument();
  });

  it('renders business registry label and code', () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '14118923', registryName: 'Test Company' }}
      />,
    );

    expect(screen.getByText('Registry code')).toBeInTheDocument();
    expect(screen.getByText('14118923')).toBeInTheDocument();
  });

  it('renders company address from business registry validation', async () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test Company' }}
      />,
    );

    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();
  });

  it('renders company data from a different registry code', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            name: { value: 'Another OÜ', errors: [] },
            address: {
              value: {
                fullAddress: 'Riia 1, Tartu, Tartu maakond',
                street: 'Riia 1',
                city: 'Tartu, Tartu maakond',
                postalCode: '51004',
                countryCode: 'EE',
              },
              errors: [],
            },
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '99887766', registryName: 'Another OÜ' }}
      />,
    );

    expect(await screen.findByText('Riia 1, Tartu, Tartu maakond')).toBeInTheDocument();
  });

  it('renders company name from the previous step', () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(screen.getByText('Company name')).toBeInTheDocument();
    expect(screen.getByText('Test OÜ')).toBeInTheDocument();
  });

  it('renders business activity from business registry validation', async () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(await screen.findByText('Arvutialased konsultatsioonid (62.02)')).toBeInTheDocument();
  });

  it('renders founding date from business registry validation', async () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(await screen.findByText('February 15, 2026')).toBeInTheDocument();
  });

  it('fails validation when backend returns errors', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            status: {
              value: 'INVALID',
              errors: [{ code: 'COMPANY_ACTIVE', message: 'Company status is invalid' }],
            },
          }),
        ),
      ),
    );

    const ValidationWrapper = () => {
      const { control, trigger } = useForm<CompanyOnboardingFormData>({
        mode: 'onChange',
        defaultValues: {
          registryLookup: { registryNumber: '11223344', registryName: 'Test OÜ' },
          companyValidatedData: undefined,
        },
      });

      return (
        <>
          <RequirementsCheckStep control={control} />
          <button
            type="button"
            onClick={async () => {
              const valid = await trigger('companyValidatedData');
              document.title = valid ? 'valid' : 'invalid';
            }}
          >
            Validate
          </button>
        </>
      );
    };

    renderWrapped(<ValidationWrapper />);
    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(document.title).toBe('invalid');
    });
  });

  it('passes validation when backend returns no errors', async () => {
    const ValidationWrapper = () => {
      const { control, trigger } = useForm<CompanyOnboardingFormData>({
        mode: 'onChange',
        defaultValues: {
          registryLookup: { registryNumber: '11223344', registryName: 'Test OÜ' },
          companyValidatedData: undefined,
        },
      });

      return (
        <>
          <RequirementsCheckStep control={control} />
          <button
            type="button"
            onClick={async () => {
              const valid = await trigger('companyValidatedData');
              document.title = valid ? 'valid' : 'invalid';
            }}
          >
            Validate
          </button>
        </>
      );
    };

    renderWrapped(<ValidationWrapper />);
    expect(await screen.findByText('Telliskivi 60/1, 10412 Tallinn')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(document.title).toBe('valid');
    });
  });

  it('displays error when backend returns 403 NOT_BOARD_MEMBER', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.status(403),
          ctx.json({
            error: 'NOT_BOARD_MEMBER',
            error_description:
              'Person is not a board member of the company: registryCode=11223344, personalCode=40404049996',
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText(
        'You are not a board member of this company. Only board members can proceed with onboarding.',
      ),
    ).toBeInTheDocument();
  });

  it('fails validation when backend returns 403 NOT_BOARD_MEMBER', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.status(403),
          ctx.json({
            error: 'NOT_BOARD_MEMBER',
            error_description: 'Person is not a board member of the company',
          }),
        ),
      ),
    );

    const ValidationWrapper = () => {
      const { control, trigger } = useForm<CompanyOnboardingFormData>({
        mode: 'onChange',
        defaultValues: {
          registryLookup: { registryNumber: '11223344', registryName: 'Test OÜ' },
          companyValidatedData: undefined,
        },
      });

      return (
        <>
          <RequirementsCheckStep control={control} />
          <button
            type="button"
            onClick={async () => {
              const valid = await trigger('companyValidatedData');
              document.title = valid ? 'valid' : 'invalid';
            }}
          >
            Validate
          </button>
        </>
      );
    };

    renderWrapped(<ValidationWrapper />);

    expect(
      await screen.findByText(
        'You are not a board member of this company. Only board members can proceed with onboarding.',
      ),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(document.title).toBe('invalid');
    });
  });

  it('hides data rows when backend returns 403 NOT_BOARD_MEMBER', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.status(403),
          ctx.json({
            error: 'NOT_BOARD_MEMBER',
            error_description: 'Person is not a board member of the company',
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    expect(screen.queryByText('Founding date')).not.toBeInTheDocument();
    expect(screen.queryByText('Company address')).not.toBeInTheDocument();
    expect(screen.queryByText('Primary company activity area')).not.toBeInTheDocument();
  });

  it('displays validation errors from backend', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...mockValidatedCompany,
            status: {
              value: 'INVALID',
              errors: [{ code: 'COMPANY_ACTIVE', message: 'Company status is invalid' }],
            },
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(await screen.findByText('Company status is invalid')).toBeInTheDocument();
  });

  it('renders related persons from business registry validation', async () => {
    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(await screen.findByText('Person McPerson')).toBeInTheDocument();
    expect(screen.getByText('40404049996')).toBeInTheDocument();
  });

  it('shows an identity-verification dead-end when a connected person is unverified', async () => {
    server.use(relatedPersonsError(OTHER_PERSONS_KYC_ERROR));

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText(/everyone connected to it must open a personal Tuleva account/i),
    ).toBeInTheDocument();
    // The raw backend KYC message must not leak into the UI as a bullet.
    expect(screen.queryByText(/Isikusamasuse tuvastamine on lõpetamata/)).not.toBeInTheDocument();
  });

  it('shows an under-review notice without any call to action when the logged-in user is unverified (USER_KYC)', async () => {
    server.use(relatedPersonsError(USER_KYC_ERROR));

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText('Your identity verification is under review'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/will review your details within a week and notify you/i),
    ).toBeInTheDocument();
    // The flow already collected identity, so re-doing the form cannot change the
    // outcome — there must be no self-service identity link, only "Check again".
    expect(
      screen.queryByRole('link', { name: 'Complete my identity verification' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Share this link/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check again' })).toBeInTheDocument();
  });

  it('shows only the shareable link (opening in a new tab), no under-review notice, when only other people are unverified (OTHER_RELATED_PERSONS_KYC)', async () => {
    server.use(relatedPersonsError(OTHER_PERSONS_KYC_ERROR));

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText(/Share this link with the connected people above/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'http://localhost/savings-fund/onboarding' }),
    ).toHaveAttribute('target', '_blank');
    expect(
      screen.queryByText('Your identity verification is under review'),
    ).not.toBeInTheDocument();
  });

  it('shows both the under-review notice and the shareable link when the user and other people are unverified', async () => {
    server.use(relatedPersonsError(USER_KYC_ERROR, OTHER_PERSONS_KYC_ERROR));

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText('Your identity verification is under review'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Share this link with the connected people above/i),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Check again' })).toHaveLength(1);
  });

  it('treats a non-identity relatedPersons error as a generic requirement failure, not an identity dead-end', async () => {
    server.use(
      relatedPersonsError({
        code: 'COMPANY_STRUCTURE',
        message: 'Ettevõtte omandistruktuur ei ole toetatud',
      }),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText('Ettevõtte omandistruktuur ei ole toetatud'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/everyone connected to it must open a personal Tuleva account/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Your identity verification is under review'),
    ).not.toBeInTheDocument();
  });

  it('displays error when backend returns 501 UNEXPECTED_ERROR', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.status(501),
          ctx.json({
            error: 'UNEXPECTED_ERROR',
            error_description: 'An unexpected error occurred',
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(
      await screen.findByText('An unexpected error occurred. Please try again later.'),
    ).toBeInTheDocument();
  });

  it('fails validation when backend returns 501 UNEXPECTED_ERROR', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.status(501),
          ctx.json({
            error: 'UNEXPECTED_ERROR',
            error_description: 'An unexpected error occurred',
          }),
        ),
      ),
    );

    const ValidationWrapper = () => {
      const { control, trigger } = useForm<CompanyOnboardingFormData>({
        mode: 'onChange',
        defaultValues: {
          registryLookup: { registryNumber: '11223344', registryName: 'Test OÜ' },
          companyValidatedData: undefined,
        },
      });

      return (
        <>
          <RequirementsCheckStep control={control} />
          <button
            type="button"
            onClick={async () => {
              const valid = await trigger('companyValidatedData');
              document.title = valid ? 'valid' : 'invalid';
            }}
          >
            Validate
          </button>
        </>
      );
    };

    renderWrapped(<ValidationWrapper />);

    expect(
      await screen.findByText('An unexpected error occurred. Please try again later.'),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(document.title).toBe('invalid');
    });
  });

  it('hides data rows when backend returns 501 UNEXPECTED_ERROR', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.status(501),
          ctx.json({
            error: 'UNEXPECTED_ERROR',
            error_description: 'An unexpected error occurred',
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    expect(screen.queryByText('Founding date')).not.toBeInTheDocument();
    expect(screen.queryByText('Company address')).not.toBeInTheDocument();
    expect(screen.queryByText('Primary company activity area')).not.toBeInTheDocument();
  });

  it('renders shimmer while loading backend data', () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(ctx.delay(1000)),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '11223344', registryName: 'Test OÜ' }}
      />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelectorAll('.shimmerDefault')).toHaveLength(4);
  });
});

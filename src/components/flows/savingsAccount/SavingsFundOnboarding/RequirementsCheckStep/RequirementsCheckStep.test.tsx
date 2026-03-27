import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useForm } from 'react-hook-form';
import { companyValidationBackend } from '../../../../../test/backend';
import { mockValidatedCompany } from '../../../../../test/backend-responses';
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

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Company data');
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
                countryCode: 'EST',
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
            status: { value: 'INVALID', errors: ['INVALID_STATUS'] },
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
            status: { value: 'INVALID', errors: ['Company status is invalid'] },
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

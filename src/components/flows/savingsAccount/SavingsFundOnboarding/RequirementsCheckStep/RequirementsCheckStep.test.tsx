import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useForm } from 'react-hook-form';
import { BusinessRegistryValidatedData } from '../../../../common/apiModels/savings-fund';
import { initializeConfiguration } from '../../../../config/config';
import { renderWrapped } from '../../../../../test/utils';
import { CompanyOnboardingFormData } from '../types';
import { RequirementsCheckStep } from './RequirementsCheckStep';

const validatedCompany: BusinessRegistryValidatedData = {
  name: { value: 'Test OÜ', errors: [] },
  registryCode: { value: '11223344', errors: [] },
  status: { value: 'R', errors: [] },
  address: { value: 'Tallinn, Harju maakond', errors: [] },
  businessActivity: { value: '62.01', errors: [] },
  relatedPersons: {
    value: [
      {
        personalCode: '38501010002',
        name: 'Jaan Tamm',
        boardMember: true,
        shareholder: true,
        beneficialOwner: true,
        ownershipPercent: 100.0,
        kycStatus: 'COMPLETED',
      },
    ],
    errors: [],
  },
};

const server = setupServer(
  rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
    res(ctx.json(validatedCompany)),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => initializeConfiguration());
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

    expect(await screen.findByText('Tallinn, Harju maakond')).toBeInTheDocument();
  });

  it('renders company data from a different registry code', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...validatedCompany,
            name: { value: 'Another OÜ', errors: [] },
            address: { value: 'Tartu, Tartu maakond', errors: [] },
          }),
        ),
      ),
    );

    renderWrapped(
      <RequirementsCheckStepWrapper
        defaultValues={{ registryNumber: '99887766', registryName: 'Another OÜ' }}
      />,
    );

    expect(await screen.findByText('Tartu, Tartu maakond')).toBeInTheDocument();
  });
});

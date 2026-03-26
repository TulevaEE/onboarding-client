import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { BusinessRegistryValidatedData } from '../../../common/apiModels/savings-fund';
import { initializeConfiguration } from '../../../config/config';
import { renderWrapped } from '../../../../test/utils';
import { SavingsFundCompanyOnboarding } from './SavingsFundCompanyOnboarding';

const BUSINESS_REGISTRY_URL = 'https://ariregister.rik.ee/est/api/autocomplete';

const validatedCompany: BusinessRegistryValidatedData = {
  name: { value: 'Acme Corp', errors: [] },
  registryCode: { value: '12345678', errors: [] },
  legalForm: { value: 'OÜ', errors: [] },
  status: { value: 'REGISTERED', errors: [] },
  address: {
    value: {
      fullAddress: 'Telliskivi 60/1, 10412 Tallinn',
      street: 'Telliskivi 60/1',
      city: 'Tallinn',
      postalCode: '10412',
      countryCode: 'EST',
    },
    errors: [],
  },
  businessActivity: { value: 'Arvutialased konsultatsioonid', errors: [] },
  naceCode: { value: '62.02', errors: [] },
  foundingDate: { value: '2026-02-15', errors: [] },
  relatedPersons: {
    value: [
      {
        personalCode: '40404049996',
        name: 'Person McPerson',
        boardMember: false,
        shareholder: false,
        beneficialOwner: false,
        ownershipPercent: null,
        kycStatus: 'UNKNOWN',
      },
    ],
    errors: [],
  },
};

const server = setupServer(
  rest.get(BUSINESS_REGISTRY_URL, (_req, res, ctx) =>
    res(ctx.json({ data: [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }] })),
  ),
  rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
    res(ctx.json(validatedCompany)),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => initializeConfiguration());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const navigateToStep2 = async () => {
  renderWrapped(<SavingsFundCompanyOnboarding />);

  const input = screen.getByPlaceholderText('Search...');
  userEvent.type(input, 'Acme');
  const option = await screen.findByRole('option', { name: /Acme Corp/ });

  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    userEvent.click(option);
  });

  userEvent.click(screen.getByRole('button', { name: /continue/i }));

  await waitFor(() => {
    expect(screen.getByText('2/7')).toBeInTheDocument();
  });
};

describe('SavingsFundCompanyOnboarding', () => {
  it('renders the business registry step with progress showing 1/7', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('has Continue and Back buttons', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('does not advance past step 1 when no company is selected', async () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('1/7')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
  });

  it('stays on step 1 when Back is clicked on the first step', () => {
    renderWrapped(<SavingsFundCompanyOnboarding />);

    userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('does not advance past step 2 when backend validation fails', async () => {
    server.use(
      rest.get('http://localhost/v1/kyb/surveys/initial-validation', (_req, res, ctx) =>
        res(
          ctx.json({
            ...validatedCompany,
            status: { value: 'INVALID', errors: ['INVALID_STATUS'] },
          }),
        ),
      ),
    );

    await navigateToStep2();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: /continue/i }));
    });

    expect(screen.getByText('2/7')).toBeInTheDocument();
  });
});

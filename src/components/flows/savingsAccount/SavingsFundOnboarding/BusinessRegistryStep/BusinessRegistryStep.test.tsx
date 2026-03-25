import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useForm } from 'react-hook-form';
import { renderWrapped } from '../../../../../test/utils';
import { BusinessRegistryStep } from './BusinessRegistryStep';
import { CompanyOnboardingFormData } from '../types';

const onSubmitSpy = jest.fn();

const BUSINESS_REGISTRY_URL = 'https://ariregister.rik.ee/est/api/autocomplete';

const BusinessRegistryStepWrapper = ({
  defaultValues,
}: {
  defaultValues?: CompanyOnboardingFormData['registryLookup'];
}) => {
  const { control, trigger, getValues } = useForm<CompanyOnboardingFormData>({
    mode: 'onChange',
    defaultValues: { registryLookup: defaultValues },
  });

  return (
    <form>
      <BusinessRegistryStep control={control} />
      <button type="button" onClick={() => trigger('registryLookup')}>
        Validate
      </button>
      <button type="button" onClick={() => onSubmitSpy(getValues())}>
        Submit
      </button>
    </form>
  );
};

const server = setupServer(
  rest.get(BUSINESS_REGISTRY_URL, (_req, res, ctx) => res(ctx.json({ data: [] }))),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('BusinessRegistryStep', () => {
  it('renders title and description', () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "What is your company's registry code?",
    );
    expect(screen.getByText('Or company name')).toBeInTheDocument();
  });

  it('renders placeholder in the autocomplete input', () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('does not show validation error initially', () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows validation error when no company is selected', async () => {
    renderWrapped(<BusinessRegistryStepWrapper />);

    const validateButton = screen.getByRole('button', { name: 'Validate' });
    userEvent.click(validateButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Select a company to continue.');
  });

  describe('fetch behavior', () => {
    it('fetches from business registry API when input is longer than 3 characters', async () => {
      const requestSpy = jest.fn();
      server.use(
        rest.get(BUSINESS_REGISTRY_URL, (req, res, ctx) => {
          requestSpy(req.url.searchParams.get('q'));
          return res(ctx.json({ data: [] }));
        }),
      );

      renderWrapped(<BusinessRegistryStepWrapper />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme');

      await waitFor(() => expect(requestSpy).toHaveBeenCalledWith('Acme'));
    });

    it('URL-encodes special characters in the query', async () => {
      const requestSpy = jest.fn();
      server.use(
        rest.get(BUSINESS_REGISTRY_URL, (req, res, ctx) => {
          requestSpy(req.url.searchParams.get('q'));
          return res(ctx.json({ data: [] }));
        }),
      );

      renderWrapped(<BusinessRegistryStepWrapper />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme & Co');

      await waitFor(() => expect(requestSpy).toHaveBeenCalledWith('Acme  Co'));
    });

    it('maps selected option to registryLookup form shape', async () => {
      server.use(
        rest.get(BUSINESS_REGISTRY_URL, (_req, res, ctx) =>
          res(
            ctx.json({
              data: [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }],
            }),
          ),
        ),
      );

      renderWrapped(<BusinessRegistryStepWrapper />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme');
      const option = await screen.findByRole('option', { name: /Acme Corp/ });

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        userEvent.click(option);
      });

      userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(onSubmitSpy).toHaveBeenCalledWith({
        registryLookup: { registryNumber: '12345678', registryName: 'Acme Corp' },
      });
    });

    it('displays API results as formatted options', async () => {
      server.use(
        rest.get(BUSINESS_REGISTRY_URL, (_req, res, ctx) =>
          res(
            ctx.json({
              data: [{ company_id: 123, name: 'Acme Corp', reg_code: '12345678' }],
            }),
          ),
        ),
      );

      renderWrapped(<BusinessRegistryStepWrapper />);

      const input = screen.getByPlaceholderText('Search...');
      userEvent.type(input, 'Acme');

      expect(
        await screen.findByRole('option', { name: /Acme Corp \(12345678\)/ }),
      ).toBeInTheDocument();
    });
  });

  it('displays previously selected company when form has a saved value', () => {
    renderWrapped(
      <BusinessRegistryStepWrapper
        defaultValues={{ registryNumber: '12345678', registryName: 'Acme Corp' }}
      />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const selectElement = document.querySelector('select') as any;
    expect(selectElement.tomselect.items).toContain('12345678');
  });
});

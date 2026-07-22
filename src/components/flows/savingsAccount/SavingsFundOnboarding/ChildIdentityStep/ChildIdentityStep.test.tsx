import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { renderWrapped } from '../../../../../test/utils';
import { eligibleChildrenBackend, pendingOnboardingsBackend } from '../../../../../test/backend';
import { initializeConfiguration } from '../../../../config/config';
import { ChildIdentityStep } from './ChildIdentityStep';
import { ChildOnboardingFormData } from '../types';
import translations from '../../../../translations';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  initializeConfiguration();
  eligibleChildrenBackend(server);
  pendingOnboardingsBackend(server);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const Wrapper = ({ defaultCode = '' }: { defaultCode?: string }) => {
  const { control, trigger } = useForm<ChildOnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      childPersonalCode: defaultCode,
      citizenship: [],
      address: { countryCode: 'EE', street: '', city: '', postalCode: '' },
      email: '',
      phoneNumber: '',
      pepSelfDeclaration: null,
      investmentGoals: [],
      plannedContribution: null,
      fundingSources: [],
      termsAccepted: false,
    },
  });

  return (
    <IntlProvider locale="en" messages={translations.en}>
      <form>
        <ChildIdentityStep control={control} />
        <button type="button" onClick={() => trigger('childPersonalCode')}>
          Validate
        </button>
      </form>
    </IntlProvider>
  );
};

const manualInput = async () => {
  const input = await screen.findByLabelText(/personal ID code/i);
  await waitFor(() => expect(input).toBeEnabled());
  return input;
};

describe('ChildIdentityStep', () => {
  test('asks for the child personal ID code', () => {
    renderWrapped(<Wrapper />);

    expect(screen.getByLabelText(/personal ID code/i)).toBeInTheDocument();
  });

  test('requires a code', async () => {
    renderWrapped(<Wrapper />);

    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Enter your child/i);
    });
  });

  test('rejects a code with too few digits', async () => {
    renderWrapped(<Wrapper />);

    userEvent.type(await manualInput(), '123');
    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/check the personal ID code/i);
    });
  });

  test('rejects an 11-digit code with an invalid checksum', async () => {
    renderWrapped(<Wrapper />);

    userEvent.type(await manualInput(), '61509070000');
    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/check the personal ID code/i);
    });
  });

  test('accepts a valid personal ID code', async () => {
    renderWrapped(<Wrapper />);

    userEvent.type(await manualInput(), '61506150006');
    userEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('keeps the field disabled until the children lookup settles, so focus is never stolen', async () => {
    server.use(
      rest.get('http://localhost/v1/me/children', (req, res, ctx) =>
        res(ctx.delay(100), ctx.json([{ personalCode: '61506150006' }])),
      ),
    );
    renderWrapped(<Wrapper />);

    expect(screen.getByLabelText(/personal ID code/i)).toBeDisabled();

    expect(await screen.findByRole('combobox', { name: /personal ID code/i })).toBeInTheDocument();
  });

  test('lets the user switch to manual entry while the lookup is still pending', () => {
    server.use(
      rest.get('http://localhost/v1/me/children', (req, res, ctx) =>
        res(ctx.delay('infinite'), ctx.json([])),
      ),
    );
    renderWrapped(<Wrapper />);
    expect(screen.getByLabelText(/personal ID code/i)).toBeDisabled();

    userEvent.click(screen.getByRole('button', { name: /manually/i }));

    const input = screen.getByLabelText(/personal ID code/i);
    expect(input).toBeEnabled();
    userEvent.type(input, '61506150006');
    expect(input).toHaveValue('61506150006');
  });

  test('shows manual entry when the children lookup fails', async () => {
    server.use(
      rest.get('http://localhost/v1/me/children', (req, res, ctx) => res(ctx.status(500))),
    );
    renderWrapped(<Wrapper />);

    expect(await screen.findByRole('textbox', { name: /personal ID code/i })).toBeInTheDocument();
  });

  describe('with children from the register', () => {
    beforeEach(() => {
      eligibleChildrenBackend(server, [
        { personalCode: '61506150006', firstName: 'Mari', lastName: 'Maasikas' },
        { personalCode: '61001010000' },
      ]);
    });

    test('offers the children by name, falling back to the code when the register has none', async () => {
      renderWrapped(<Wrapper />);

      expect(
        await screen.findByRole('combobox', { name: /personal ID code/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Mari Maasikas (61506150006)' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '61001010000' })).toBeInTheDocument();
    });

    test('accepts a child selected from the dropdown', async () => {
      renderWrapped(<Wrapper />);

      userEvent.selectOptions(
        await screen.findByRole('combobox', { name: /personal ID code/i }),
        '61506150006',
      );
      userEvent.click(screen.getByRole('button', { name: 'Validate' }));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    test('preselects the dropdown when the form already holds a listed code', async () => {
      renderWrapped(<Wrapper defaultCode="61506150006" />);

      expect(await screen.findByRole('combobox', { name: /personal ID code/i })).toHaveValue(
        '61506150006',
      );
    });

    test('stays in manual entry when the form holds a code that is not in the list', async () => {
      const queryClient = new QueryClient();
      renderWrapped(<Wrapper defaultCode="61509070000" />, undefined, undefined, queryClient);

      await waitFor(() => {
        expect(queryClient.getQueryData(['eligibleChildren'])).toBeDefined();
      });

      expect(screen.getByRole('textbox', { name: /personal ID code/i })).toHaveValue('61509070000');
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    test('marks an already onboarded child and prevents selecting them again', async () => {
      eligibleChildrenBackend(server, [
        {
          personalCode: '61506150006',
          firstName: 'Mari',
          lastName: 'Maasikas',
          hasBeenOnboarded: true,
        },
        { personalCode: '61001010000' },
      ]);
      renderWrapped(<Wrapper />);

      const onboardedOption = await screen.findByRole('option', {
        name: 'Mari Maasikas (61506150006) · account already opened',
      });
      expect(onboardedOption).toBeDisabled();
      expect(screen.getByRole('option', { name: '61001010000' })).toBeEnabled();
    });

    test('keeps an already onboarded child selectable when this user has a pending onboarding for them', async () => {
      eligibleChildrenBackend(server, [
        {
          personalCode: '61506150006',
          firstName: 'Mari',
          lastName: 'Maasikas',
          hasBeenOnboarded: true,
        },
      ]);
      pendingOnboardingsBackend(server, [
        { type: 'PERSON', code: '61506150006', name: 'Mari Maasikas' },
      ]);
      renderWrapped(<Wrapper />);

      const option = await screen.findByRole('option', { name: 'Mari Maasikas (61506150006)' });
      expect(option).toBeEnabled();
    });

    test('falls back to manual entry when the child is not listed', async () => {
      renderWrapped(<Wrapper />);

      expect(
        await screen.findByRole('combobox', { name: /personal ID code/i }),
      ).toBeInTheDocument();
      userEvent.click(screen.getByRole('button', { name: /manually/i }));

      expect(screen.getByRole('textbox', { name: /personal ID code/i })).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });
});

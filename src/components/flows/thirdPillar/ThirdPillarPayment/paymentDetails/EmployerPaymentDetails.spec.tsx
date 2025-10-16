import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../../../test/utils';
import { initializeConfiguration } from '../../../../config/config';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  paymentLinkBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  userBackend,
  userConversionBackend,
} from '../../../../../test/backend';
import LoggedInApp from '../../../../LoggedInApp';

describe('When a user is setting up third pillar payments via employer', () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);

    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(async () => {
    initializeConfiguration();

    userConversionBackend(server);
    userBackend(server);
    amlChecksBackend(server);
    pensionAccountStatementBackend(server);
    fundsBackend(server);
    paymentLinkBackend(server);
    applicationsBackend(server);
    returnsBackend(server);

    initializeComponent();

    history.push('/3rd-pillar-employer');
  });

  test('can switch between private and public employer', async () => {
    expect(
      await screen.findByText(
        'Application to the employer to pay directly from the salary to III pillar',
      ),
    ).toBeInTheDocument();

    const publicOption = await publicSectorOption();
    const privateOption = await privateSectorOption();

    userEvent.click(publicOption);
    expect(await publicSectorOption()).toBeChecked();
    expect(await navigateToRtkFormButton()).toBeVisible();

    userEvent.click(privateOption);
    expect(await privateSectorOption()).toBeChecked();
    expect(await saveApplicationFormButton()).toBeVisible();
  });

  describe('private sector employer', () => {
    test('private sector employer guide is shown by default', async () => {
      expect(
        await screen.findByText(
          'Application to the employer to pay directly from the salary to III pillar',
        ),
      ).toBeInTheDocument();

      expect(await privateSectorOption()).toBeChecked();
      expect(await publicSectorOption()).not.toBeChecked();

      expect(await saveApplicationFormButton()).toBeVisible();

      expect(
        await screen.findByText(
          'Digitally sign the application and e-mail it to your employer’s accountant.',
        ),
      );

      const [, setupInfoName] = await screen.findAllByText('John Doe');

      expect(setupInfoName).toBeVisible();
      expect(await screen.findByText('9876543210')).toBeVisible();
    });

    test('private sector employer button navigates to form template', async () => {
      expect(
        await screen.findByText(
          'Application to the employer to pay directly from the salary to III pillar',
        ),
      ).toBeInTheDocument();

      const saveFormButton = await saveApplicationFormButton();

      expect(saveFormButton).toBeVisible();
      expect(saveFormButton).toHaveAttribute(
        'href',
        'https://docs.google.com/document/d/1ZnF9CBxnXWzCjDz-wk1H84pz_yD3EIcD3WPBYt5RuDA/edit',
      );
    });
  });

  describe('public sector employer', () => {
    test('can switch to public sector employer and navigate to government portal', async () => {
      expect(
        await screen.findByText(
          'Application to the employer to pay directly from the salary to III pillar',
        ),
      ).toBeInTheDocument();

      const publicOption = await publicSectorOption();

      userEvent.click(publicOption);
      expect(await publicSectorOption()).toBeChecked();

      expect(await screen.findByText('Digitally sign the application in RTK.'));
      const navigateToRtkButton = await navigateToRtkFormButton();

      expect(navigateToRtkButton).toBeVisible();
      expect(navigateToRtkButton).toHaveAttribute(
        'href',
        'https://www.riigitootaja.ee/rtip-client/login',
      );
    });
  });

  const privateSectorOption = async () => screen.findByLabelText('I’m a private sector employee');
  const publicSectorOption = async () => screen.findByLabelText('I’m a public sector employee');

  const saveApplicationFormButton = async () =>
    screen.queryByRole('link', { name: 'Save the application form' });
  const navigateToRtkFormButton = async () =>
    screen.queryByRole('link', { name: 'Sign in to RTK self service' });
});

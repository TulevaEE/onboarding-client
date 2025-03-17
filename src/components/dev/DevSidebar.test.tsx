import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { createMemoryHistory, MemoryHistory } from 'history';
import { createDefaultMockStore, renderWrapped } from '../../test/utils';
import { GET_USER_CONVERSION_SUCCESS, GET_USER_SUCCESS } from '../login/constants';
import DevSidebar from './DevSidebar';

describe('DevSidebar', () => {
  const server = setupServer();
  let history: MemoryHistory<unknown> = createMemoryHistory();

  const initialState = {
    login: {
      userConversion: {
        exampleConversionField: 123,
        exampleBooleanField: false,
      },
      user: {
        exampleUserField: 123,
      },
    },
    router: {
      location: history.location,
      action: history.action,
    },
  };
  let store = createDefaultMockStore(history, initialState);

  function initializeComponent() {
    history = createMemoryHistory();
    store = createDefaultMockStore(history, initialState);
    renderWrapped(<DevSidebar />, history, store);
  }
  beforeEach(() => {
    initializeComponent();
  });

  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('renders user conversion and user data correctly', async () => {
    await waitFor(() => {
      expect(screen.getByText('Conversion data')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('User data')).toBeInTheDocument();
    });
  });

  test('updates user conversion data', async () => {
    const updatedValue = 'New Value';
    const input = await screen.findByTestId('userConversion.exampleConversionField-input');
    userEvent.clear(input);
    userEvent.type(input, updatedValue);

    const updateButton = screen.getByRole('button', { name: 'Update conversion' });
    userEvent.click(updateButton);

    await waitFor(() => {
      expect(store.getActions()).toContainEqual({
        type: GET_USER_CONVERSION_SUCCESS,
        userConversion: {
          ...initialState.login.userConversion,
          exampleConversionField: updatedValue,
        },
      });
    });
  });

  test('imports state from a file and updates state accordingly', async () => {
    const state = {
      userConversion: {
        exampleConversionField: 'Imported conversion value',
        exampleBooleanField: true,
      },
      user: {
        exampleUserField: 'Imported user info',
      },
    };
    const fileContent = JSON.stringify(state);

    const file = new File([fileContent], 'state.json', { type: 'application/json' });

    const fileInput = screen.getByLabelText('Import state');
    userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId('user.exampleUserField-input')).toHaveValue(
        state.user.exampleUserField,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('userConversion.exampleConversionField-input')).toHaveValue(
        state.userConversion.exampleConversionField,
      );
    });

    await waitFor(() => {
      const radioFalse = screen.getByTestId('userConversion.exampleBooleanField-false');
      expect(radioFalse).not.toBeChecked();
    });

    await waitFor(() => {
      const radioTrue = screen.getByTestId('userConversion.exampleBooleanField-true');
      expect(radioTrue).toBeChecked();
    });

    const expectedActions = [
      {
        type: GET_USER_CONVERSION_SUCCESS,
        userConversion: {
          exampleConversionField: state.userConversion.exampleConversionField,
          exampleBooleanField: state.userConversion.exampleBooleanField,
        },
      },
      {
        type: GET_USER_SUCCESS,
        user: {
          exampleUserField: state.user.exampleUserField,
        },
      },
    ];

    expectedActions.forEach((action) => {
      expect(store.getActions()).toContainEqual(action);
    });
  });

  test('exports state to a file', async () => {
    global.URL.createObjectURL = jest.fn();
    const exportButton = screen.getByRole('button', { name: 'Export state' });
    userEvent.click(exportButton);

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  test('updates user data and dispatches GET_USER_SUCCESS', async () => {
    const updatedUserInfo = 'Updated user info';
    const userInput = await screen.findByTestId('user.exampleUserField-input');
    userEvent.clear(userInput);
    userEvent.type(userInput, updatedUserInfo);

    const updateUserButton = screen.getByRole('button', { name: 'Update user' });
    userEvent.click(updateUserButton);

    await waitFor(() => {
      expect(store.getActions()).toContainEqual({
        type: GET_USER_SUCCESS,
        user: {
          ...initialState.login.user,
          exampleUserField: updatedUserInfo,
        },
      });
    });
  });

  test('toggles boolean field and dispatches GET_USER_CONVERSION_SUCCESS update', async () => {
    const radioTrue = await screen.findByTestId('userConversion.exampleBooleanField-true');
    userEvent.click(radioTrue);

    await waitFor(() => {
      expect(radioTrue).toBeChecked();
    });

    const updateConversionButton = screen.getByRole('button', { name: 'Update conversion' });
    userEvent.click(updateConversionButton);

    await waitFor(() => {
      expect(store.getActions()).toContainEqual({
        type: GET_USER_CONVERSION_SUCCESS,
        userConversion: {
          ...initialState.login.userConversion,
          exampleBooleanField: true,
        },
      });
    });
  });
});

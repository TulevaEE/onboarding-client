import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { renderWrapped, createDefaultStore } from '../../../test/utils';
import PepAgreement from './PoliticallyExposedPersonAgreement';

describe('PoliticallyExposedPersonAgreement', () => {
  test('no radio is selected by default', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<PepAgreement />, history, store);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    radios.forEach((radio) => expect(radio).not.toBeChecked());
    expect(store.getState().aml.isPoliticallyExposed).toBeNull();
  });

  test('user can select "I am a PEP"', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<PepAgreement />, history, store);

    userEvent.click(screen.getByRole('radio', { name: /I am a politically exposed person/i }));

    expect(screen.getByRole('radio', { name: /I am a politically exposed person/i })).toBeChecked();
    expect(store.getState().aml.isPoliticallyExposed).toBe(true);
  });

  test('user can select "I am not a PEP"', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<PepAgreement />, history, store);

    userEvent.click(screen.getByRole('radio', { name: /I am not a politically exposed person/i }));

    expect(
      screen.getByRole('radio', { name: /I am not a politically exposed person/i }),
    ).toBeChecked();
    expect(store.getState().aml.isPoliticallyExposed).toBe(false);
  });

  test('user can change selection from yes to no', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<PepAgreement />, history, store);

    userEvent.click(screen.getByRole('radio', { name: /I am a politically exposed person/i }));
    expect(store.getState().aml.isPoliticallyExposed).toBe(true);

    userEvent.click(screen.getByRole('radio', { name: /I am not a politically exposed person/i }));
    expect(
      screen.getByRole('radio', { name: /I am not a politically exposed person/i }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /I am a politically exposed person/i }),
    ).not.toBeChecked();
    expect(store.getState().aml.isPoliticallyExposed).toBe(false);
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { reduxForm } from 'redux-form';
import { renderWrapped, createDefaultStore } from '../../../test/utils';
import PepAgreement from './PoliticallyExposedPersonAgreement';

const FormWrapper = reduxForm({ form: 'testForm' })(() => (
  <form>
    <PepAgreement />
  </form>
));

describe('PoliticallyExposedPersonAgreement', () => {
  test('checkbox starts unchecked (user is considered a PEP by default)', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<FormWrapper />, history, store);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    expect(store.getState().aml.isPoliticallyExposed).toBe(true);
  });

  test('user can check the box to declare they are NOT a PEP', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<FormWrapper />, history, store);

    const checkbox = screen.getByRole('checkbox');
    userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(store.getState().aml.isPoliticallyExposed).toBe(false);
  });

  test('user can uncheck the box to declare they ARE a PEP', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<FormWrapper />, history, store);

    const checkbox = screen.getByRole('checkbox');

    userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(store.getState().aml.isPoliticallyExposed).toBe(true);
  });

  test('displays PEP explanation label', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);

    renderWrapped(<FormWrapper />, history, store);

    expect(
      screen.getByText(/I confirm that I am not a politically exposed person/i),
    ).toBeInTheDocument();
  });
});

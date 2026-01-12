import { screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { reduxForm } from 'redux-form';
import { renderWrapped, createDefaultStore } from '../../../../test/utils';
import { ConfirmThirdPillarMandate } from './ConfirmThirdPillarMandate';

const defaultProps = {
  hasAddress: true,
  hasContactDetailsAmlCheck: true,
  selectedFutureContributionsFund: { isin: 'EE123', name: 'Test Fund' },
  agreedToTerms: true,
  isResident: true,
  isPoliticallyExposed: true,
  occupation: 'PRIVATE_SECTOR',
};

const createWrappedComponent = (overrideProps = {}) => {
  const props = { ...defaultProps, ...overrideProps };
  // Wrap in reduxForm to provide context for child Field components
  return reduxForm({ form: 'testForm' })(() => <ConfirmThirdPillarMandate {...props} />);
};

describe('ConfirmThirdPillarMandate', () => {
  test('sign button is enabled when all required fields are filled (PEP checkbox not required)', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    const WrappedComponent = createWrappedComponent();

    renderWrapped(<WrappedComponent />, history, store);

    const signButton = screen.getByRole('button', { name: /sign/i });
    expect(signButton).toBeEnabled();
  });

  test('sign button is disabled when terms not agreed', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    const WrappedComponent = createWrappedComponent({ agreedToTerms: false });

    renderWrapped(<WrappedComponent />, history, store);

    const signButton = screen.getByRole('button', { name: /sign/i });
    expect(signButton).toBeDisabled();
  });

  test('sign button is disabled when residency not confirmed', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    const WrappedComponent = createWrappedComponent({ isResident: false });

    renderWrapped(<WrappedComponent />, history, store);

    const signButton = screen.getByRole('button', { name: /sign/i });
    expect(signButton).toBeDisabled();
  });

  test('sign button is disabled when occupation not selected', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    const WrappedComponent = createWrappedComponent({ occupation: undefined });

    renderWrapped(<WrappedComponent />, history, store);

    const signButton = screen.getByRole('button', { name: /sign/i });
    expect(signButton).toBeDisabled();
  });

  test('sign button stays enabled regardless of PEP checkbox state', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    const WrappedComponent = createWrappedComponent({ isPoliticallyExposed: true });

    renderWrapped(<WrappedComponent />, history, store);

    expect(screen.getByRole('button', { name: /sign/i })).toBeEnabled();
  });

  test('sign button is enabled when user is not a PEP', () => {
    const history = createMemoryHistory();
    const store = createDefaultStore(history);
    const WrappedComponent = createWrappedComponent({ isPoliticallyExposed: false });

    renderWrapped(<WrappedComponent />, history, store);

    expect(screen.getByRole('button', { name: /sign/i })).toBeEnabled();
  });
});

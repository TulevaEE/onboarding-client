import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSigning } from './useSigning';
import { SigningCancelledByUser } from './signingCancelledByUser';

const mockSignWithIdCard = jest.fn();
const mockPersistIdCardSignature = jest.fn();
const mockGetIdCardSignatureStatus = jest.fn();
const mockGetAuthentication = jest.fn();
const mockStartSigningWithChallengeCode = jest.fn();
const mockPollForSignatureStatus = jest.fn();

jest.mock('./signWithIdCard', () => ({
  signWithIdCard: (...args: unknown[]) => mockSignWithIdCard(...args),
}));
jest.mock('../api', () => ({
  persistIdCardSignature: (...args: unknown[]) => mockPersistIdCardSignature(...args),
  getIdCardSignatureStatus: (...args: unknown[]) => mockGetIdCardSignatureStatus(...args),
}));
jest.mock('../authenticationManager', () => ({
  getAuthentication: () => mockGetAuthentication(),
}));
jest.mock('./signWithChallengeCode', () => ({
  startSigningWithChallengeCode: (...args: unknown[]) => mockStartSigningWithChallengeCode(...args),
  pollForSignatureStatus: (...args: unknown[]) => mockPollForSignatureStatus(...args),
}));

const describeStatus = (signed: boolean, loading: boolean) => {
  if (signed) {
    return 'signed';
  }
  return loading ? 'signing' : 'idle';
};

const SigningHarness = () => {
  const { startSigning, cancelSigning, signed, loading, error } = useSigning<{ id: number }>(
    'MANDATE_BATCH',
  );
  const [outcome, setOutcome] = useState('');
  const status = describeStatus(signed, loading);
  const sign = () =>
    startSigning({ id: 7 }).then(
      () => setOutcome('start resolved'),
      () => setOutcome('start rejected'),
    );
  return (
    <>
      <button type="button" onClick={sign}>
        sign
      </button>
      <button type="button" onClick={cancelSigning}>
        close
      </button>
      <output>{status}</output>
      <span>{outcome}</span>
      {error && <p>{error.body.errors[0].code}</p>}
    </>
  );
};

describe('useSigning with an ID card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetAuthentication.mockReturnValue({ signingMethod: 'ID_CARD' });
    mockSignWithIdCard.mockResolvedValue({
      signature: 'signature',
      entityId: 7,
      entityType: 'MANDATE_BATCH',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is signed as soon as persisting the signature reports the entity processed', async () => {
    mockPersistIdCardSignature.mockResolvedValue('SIGNATURE');
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signed')).toBeInTheDocument();
    expect(mockSignWithIdCard).toHaveBeenCalledWith({ id: 7 }, 'MANDATE_BATCH');
    expect(mockPersistIdCardSignature).toHaveBeenCalledWith({
      entityId: '7',
      type: 'MANDATE_BATCH',
      signature: 'signature',
    });
    expect(mockGetIdCardSignatureStatus).not.toHaveBeenCalled();
  });

  it('polls the status until the entity is processed', async () => {
    mockPersistIdCardSignature.mockResolvedValue('OUTSTANDING_TRANSACTION');
    mockGetIdCardSignatureStatus
      .mockResolvedValueOnce('OUTSTANDING_TRANSACTION')
      .mockResolvedValueOnce('SIGNATURE');
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signed')).toBeInTheDocument();
    expect(mockGetIdCardSignatureStatus).toHaveBeenCalledTimes(2);
    expect(mockGetIdCardSignatureStatus).toHaveBeenCalledWith({
      entityId: '7',
      type: 'MANDATE_BATCH',
    });
  });

  it('surfaces the signing error and stops', async () => {
    mockSignWithIdCard.mockRejectedValue({
      body: { errors: [{ code: 'id.card.signing.certificate.mismatch' }] },
    });
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('id.card.signing.certificate.mismatch')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();
    expect(mockPersistIdCardSignature).not.toHaveBeenCalled();
  });

  it('closes the error so the user can sign again', async () => {
    mockSignWithIdCard.mockRejectedValue({
      body: { errors: [{ code: 'id.card.signing.error' }] },
    });
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));
    expect(await screen.findByText('id.card.signing.error')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(screen.queryByText('id.card.signing.error')).not.toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('goes back to idle without an error when the user cancels the PIN dialog', async () => {
    mockSignWithIdCard.mockRejectedValue(new SigningCancelledByUser());
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('start resolved')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.queryByText(/error|cancel/)).not.toBeInTheDocument();
    expect(mockPersistIdCardSignature).not.toHaveBeenCalled();
  });

  it('surfaces a generic error when signing fails without an error response', async () => {
    mockSignWithIdCard.mockRejectedValue(new Error('boom'));
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.error.unknown')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();
  });

  it('keeps a failure in state instead of rejecting the caller', async () => {
    mockSignWithIdCard.mockRejectedValue(new Error('boom'));
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.error.unknown')).toBeInTheDocument();
    expect(await screen.findByText('start resolved')).toBeInTheDocument();
  });

  it('surfaces a generic error when the status poll rejects without an error response', async () => {
    mockPersistIdCardSignature.mockResolvedValue('OUTSTANDING_TRANSACTION');
    mockGetIdCardSignatureStatus.mockRejectedValue(new Error('network down'));
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.error.unknown')).toBeInTheDocument();
  });

  it('names the mandate batch when the backend says it has not been signed yet', async () => {
    mockPersistIdCardSignature.mockResolvedValue('OUTSTANDING_TRANSACTION');
    mockGetIdCardSignatureStatus.mockRejectedValue({
      body: { errors: [{ code: 'signature.not.signed' }] },
    });
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.not.signed.mandateBatch')).toBeInTheDocument();
  });

  it('clears loading when the backend rejects with the same error object twice in a row', async () => {
    const sessionExpired = { body: { errors: [{ code: 'id.card.signature.session.not.found' }] } };
    mockSignWithIdCard.mockRejectedValue(sessionExpired);
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));
    expect(await screen.findByText('idle')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'sign' }));
    expect(await screen.findByText('signing')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();
  });

  it('clears loading when the same unknown error happens twice in a row', async () => {
    mockSignWithIdCard.mockRejectedValue(new Error('boom'));
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));
    expect(await screen.findByText('signature.error.unknown')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'sign' }));
    expect(await screen.findByText('signing')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();
  });
});

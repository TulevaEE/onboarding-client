import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSigning } from './useSigning';

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
  const { startSigning, signed, loading, error } = useSigning<{ id: number }>('MANDATE_BATCH');
  const status = describeStatus(signed, loading);
  return (
    <>
      <button type="button" onClick={() => startSigning({ id: 7 }).catch(() => undefined)}>
        sign
      </button>
      <output>{status}</output>
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
      body: { errors: [{ code: 'id.card.signing.cancelled' }] },
    });
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('id.card.signing.cancelled')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();
    expect(mockPersistIdCardSignature).not.toHaveBeenCalled();
  });

  it('stops with an error when persisting reports an unexpected status', async () => {
    mockPersistIdCardSignature.mockResolvedValue('SOMETHING_ELSE');
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.status.unexpected')).toBeInTheDocument();
    expect(await screen.findByText('idle')).toBeInTheDocument();
    expect(mockGetIdCardSignatureStatus).not.toHaveBeenCalled();
  });

  it('stops with an error when the status poll reports an unexpected status', async () => {
    mockPersistIdCardSignature.mockResolvedValue('OUTSTANDING_TRANSACTION');
    mockGetIdCardSignatureStatus.mockResolvedValue('SOMETHING_ELSE');
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.status.unexpected')).toBeInTheDocument();
    expect(mockGetIdCardSignatureStatus).toHaveBeenCalledTimes(1);
  });

  it('stops with an error when the challenge code poll reports an unexpected status', async () => {
    mockGetAuthentication.mockReturnValue({ signingMethod: 'SMART_ID' });
    mockStartSigningWithChallengeCode.mockResolvedValue('1234');
    mockPollForSignatureStatus.mockResolvedValue({
      statusCode: 'SOMETHING_ELSE',
      challengeCode: '1234',
    });
    render(<SigningHarness />);

    userEvent.click(screen.getByRole('button', { name: 'sign' }));

    expect(await screen.findByText('signature.status.unexpected')).toBeInTheDocument();
    expect(mockPollForSignatureStatus).toHaveBeenCalledTimes(1);
  });
});

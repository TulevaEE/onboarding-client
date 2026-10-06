import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { useRememberedMobileIdNumber } from './useRememberedMobileIdNumber';
import { KnownMobileIdNumbers } from './knownMobileIdNumbers';

const mockIsMobileIdNumberRemembered = jest.fn();

jest.mock('../../common/api', () => ({
  isMobileIdNumberRemembered: (...args: unknown[]) => mockIsMobileIdNumberRemembered(...args),
}));

const REMEMBERED_CODE = '38001085718';
const OTHER_VALID_CODE = '61506150006';

type Props = { personalCode: string; phoneNumberNeeded: boolean };

const Lookup = ({ personalCode, phoneNumberNeeded }: Props) => (
  <output>{String(useRememberedMobileIdNumber(personalCode, phoneNumberNeeded))}</output>
);

const renderLookup = (initialProps: Props) => {
  const { rerender } = render(<Lookup {...initialProps} />);
  return {
    result: {
      get current() {
        return screen.getByRole('status').textContent === 'true';
      },
    },
    rerender: (props: Props) => rerender(<Lookup {...props} />),
  };
};

const settle = async (milliseconds = 1000) => {
  await act(async () => {
    jest.advanceTimersByTime(milliseconds);
  });
};

describe('useRememberedMobileIdNumber', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIsMobileIdNumberRemembered.mockReset();
    mockIsMobileIdNumberRemembered.mockImplementation(
      async (code: string) => code === REMEMBERED_CODE,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const inTheLoginCard = (knownNumbers: Map<string, boolean>, props: Props) => (
    <KnownMobileIdNumbers.Provider value={knownNumbers}>
      <Lookup {...props} />
    </KnownMobileIdNumbers.Provider>
  );

  it('answers at once for an identity code the login card already asked about, so coming back to the tab does not flash the phone field', async () => {
    const knownNumbers = new Map<string, boolean>();
    const { unmount: leaveTheTab } = render(
      inTheLoginCard(knownNumbers, { personalCode: REMEMBERED_CODE, phoneNumberNeeded: false }),
    );
    await settle();
    leaveTheTab();

    render(
      inTheLoginCard(knownNumbers, { personalCode: REMEMBERED_CODE, phoneNumberNeeded: false }),
    );

    expect(screen.getByRole('status')).toHaveTextContent('true');
  });

  it('still asks again when the tab comes back, and follows the new answer', async () => {
    const knownNumbers = new Map<string, boolean>([[REMEMBERED_CODE, true]]);
    mockIsMobileIdNumberRemembered.mockResolvedValue(false);

    render(
      inTheLoginCard(knownNumbers, { personalCode: REMEMBERED_CODE, phoneNumberNeeded: false }),
    );
    await settle();

    expect(screen.getByRole('status')).toHaveTextContent('false');
    expect(knownNumbers.get(REMEMBERED_CODE)).toBe(false);
  });

  it('reports a remembered number for a valid identity code', async () => {
    const { result } = renderLookup({ personalCode: REMEMBERED_CODE, phoneNumberNeeded: false });
    expect(result.current).toBe(false);

    await settle();

    expect(result.current).toBe(true);
    expect(mockIsMobileIdNumberRemembered).toHaveBeenCalledWith(
      REMEMBERED_CODE,
      expect.any(AbortSignal),
    );
  });

  it('reports no remembered number when the service does not know one', async () => {
    const { result } = renderLookup({ personalCode: OTHER_VALID_CODE, phoneNumberNeeded: false });

    await settle();

    expect(result.current).toBe(false);
    expect(mockIsMobileIdNumberRemembered).toHaveBeenCalledTimes(1);
  });

  it('does not ask about an identity code that is not valid', async () => {
    renderLookup({ personalCode: '3800108571', phoneNumberNeeded: false });

    await settle();

    expect(mockIsMobileIdNumberRemembered).not.toHaveBeenCalled();
  });

  it('does not ask once the phone number is needed anyway', async () => {
    const { result } = renderLookup({ personalCode: REMEMBERED_CODE, phoneNumberNeeded: true });

    await settle();

    expect(mockIsMobileIdNumberRemembered).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it('waits for the typing to stop before asking', async () => {
    const { rerender } = renderLookup({ personalCode: OTHER_VALID_CODE, phoneNumberNeeded: false });
    await settle(100);
    rerender({ personalCode: REMEMBERED_CODE, phoneNumberNeeded: false });

    await settle();

    expect(mockIsMobileIdNumberRemembered).toHaveBeenCalledTimes(1);
    expect(mockIsMobileIdNumberRemembered).toHaveBeenCalledWith(
      REMEMBERED_CODE,
      expect.any(AbortSignal),
    );
  });

  it('cancels the question about a code that changed and ignores its late answer', async () => {
    let answerForTheFirstCode: (remembered: boolean) => void = () => undefined;
    const signals: AbortSignal[] = [];
    mockIsMobileIdNumberRemembered.mockImplementation((code: string, signal: AbortSignal) => {
      signals.push(signal);
      if (code === REMEMBERED_CODE) {
        return new Promise((resolve) => {
          answerForTheFirstCode = resolve;
        });
      }
      return Promise.resolve(false);
    });
    const { result, rerender } = renderLookup({
      personalCode: REMEMBERED_CODE,
      phoneNumberNeeded: false,
    });
    await settle();

    rerender({ personalCode: OTHER_VALID_CODE, phoneNumberNeeded: false });
    await settle();
    await act(async () => answerForTheFirstCode(true));

    expect(signals[0].aborted).toBe(true);
    expect(result.current).toBe(false);
  });

  it('shows the phone field again when the identity code changes', async () => {
    const { result, rerender } = renderLookup({
      personalCode: REMEMBERED_CODE,
      phoneNumberNeeded: false,
    });
    await settle();
    expect(result.current).toBe(true);

    rerender({ personalCode: '3800108571', phoneNumberNeeded: false });

    expect(result.current).toBe(false);
  });

  it('treats a failed question as no remembered number', async () => {
    mockIsMobileIdNumberRemembered.mockRejectedValue({ status: 500 });
    const { result } = renderLookup({ personalCode: REMEMBERED_CODE, phoneNumberNeeded: false });

    await settle();

    expect(result.current).toBe(false);
  });
});

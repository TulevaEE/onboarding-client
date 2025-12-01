/* eslint-disable import/no-extraneous-dependencies */
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { WithdrawalMandateDetails } from '../../../common/apiModels/withdrawals';

export const singleWithdrawalCheckbox = async () =>
  screen.findByRole('checkbox', { name: 'Withdraw some money right away' });
export const fundPensionCheckbox = async () =>
  screen.findByRole('checkbox', { name: 'Receive monthly fund pension payments' });

export const nextButton = () => screen.getByRole('button', { name: 'Continue' });
export const confirmationCheckbox = () => screen.getByRole('checkbox');

export const signButton = () => screen.getByRole('button', { name: /Sign/ });

export const enterIban = async (iban: string, user: UserEvent) => {
  const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');
  await user.type(ibanInput, iban);
};

export const confirmAndSignAndAssertFailed = async () => {
  userEvent.click(confirmationCheckbox());
  expect(signButton()).toBeEnabled();

  userEvent.click(signButton());

  expect(
    screen.getByText(
      /Submitting withdrawal applications failed. Please contact us: tuleva@tuleva.ee/i,
    ),
  ).toBeInTheDocument();

  expect(signButton()).toBeInTheDocument();
};

export const confirmAndSignAndAssertDone = async (singleApplication?: 'SINGLE_APPLICATION') => {
  userEvent.click(confirmationCheckbox());
  expect(signButton()).toBeEnabled();

  userEvent.click(signButton());

  expect(
    await screen.findByRole(
      'heading',
      {
        name: singleApplication
          ? 'The application has been submitted'
          : 'The applications have been submitted',
      },
      { timeout: 10_000 },
    ),
  ).toBeInTheDocument();

  expect(
    screen.getByText(
      singleApplication
        ? /We have sent the digitally signed application to your email address./i
        : /We have sent the digitally signed applications to your email address./i,
    ),
  ).toBeInTheDocument();
};

export const assertDoneScreenFundPension = () => {
  expect(
    screen.getByText(/The first monthly fund pension payment will be sent on/i),
  ).toBeInTheDocument();
};

export const assertDoneScreenPartialWithdrawal = (pillar: 'SECOND' | 'THIRD') => {
  let paymentDeadline: HTMLElement;

  if (pillar === 'SECOND') {
    paymentDeadline = screen.getByText(/The partial withdrawal from II pillar will be sent on/i);
    expect(within(paymentDeadline).getByText(/January 16–20/)).toBeInTheDocument();
  } else {
    paymentDeadline = screen.getByText(/The partial withdrawal from III pillar will be sent on/i);
    expect(within(paymentDeadline).getByText(/four working days/)).toBeInTheDocument();
  }
};

export const assertDoneScreenSecondPillarWarning = () => {
  expect(
    screen.getByText('contributions to your second pillar will stop permanently'),
  ).toBeInTheDocument();
};

export const assertMandateCount = async (count: number) =>
  Promise.all(
    Array(count)
      .fill(null)
      .map(async (_, i) =>
        Promise.all([expect(await screen.findByText(`Application #${i + 1}`)).toBeInTheDocument()]),
      ),
  );

export const assertFundPensionCalculations = async ({
  fundPensionMonthlySize,
  liquidatedMonthlyPercentage = '0.42%',
  returnsRegex = /will earn returns for the next 20 years/i,
  assertSummaryBox = true,
}: {
  fundPensionMonthlySize: string;
  liquidatedMonthlyPercentage?: string;
  returnsRegex?: RegExp;
  assertSummaryBox?: boolean;
}) => {
  const explanationText = screen.getByText(/Every month you will receive/i);
  const fundPensionCard = screen.getByRole('region', {
    name: /Receive monthly fund pension payments/i,
  });
  expect(within(explanationText).getByText(liquidatedMonthlyPercentage)).toBeInTheDocument();
  expect(
    within(fundPensionCard).getByText(new RegExp(fundPensionMonthlySize, 'i')),
  ).toBeInTheDocument();
  expect(screen.getByText(returnsRegex)).toBeInTheDocument();

  if (assertSummaryBox) {
    const summaryBox = screen.getByRole('region', { name: /Withdrawal summary/i });
    expect(within(summaryBox).getByText(/Receive monthly/i)).toBeInTheDocument();
    expect(
      within(summaryBox).getByText(new RegExp(fundPensionMonthlySize, 'i')),
    ).toBeInTheDocument();
  }
};

export const assertPartialWithdrawalCalculations = ({
  amount,
  taxAmount,
  taxRate = '10%',
  assertSummaryBox = true,
}: {
  amount: string;
  taxAmount: string;
  taxRate?: '10%' | '22%';
  assertSummaryBox?: boolean;
}) => {
  const taxText = screen.getByText(
    new RegExp(`Partial withdrawal will be subject to ${taxRate} income tax`, 'i'),
  );
  expect(within(taxText).getByText(taxAmount)).toBeInTheDocument();

  if (assertSummaryBox) {
    const summaryBox = screen.getByRole('region', { name: /Withdrawal summary/i });
    expect(within(summaryBox).getByText(/Withdraw immediately/i)).toBeInTheDocument();
    expect(within(summaryBox).getByText(/and pay income tax on it/i)).toBeInTheDocument();
    expect(within(summaryBox).getByText(taxAmount)).toBeInTheDocument();
    expect(within(summaryBox).getByText(amount)).toBeInTheDocument();
  }
};

export const assertFundPensionMandate = async (
  pillar: WithdrawalMandateDetails['pillar'],
  fundPensionSize: string,
  bankruptciesPresent?: 'BANKRUPTCIES_ARRESTS_PRESENT',
) => {
  const fundPensionSection = await screen.findByTestId(`FUND_PENSION_OPENING_${pillar}`);

  if (pillar === 'SECOND') {
    expect(
      await within(fundPensionSection).findByRole('heading', {
        name: 'Monthly fund pension payments from II pillar',
      }),
    ).toBeInTheDocument();
  } else {
    expect(
      await within(fundPensionSection).findByRole('heading', {
        name: 'Monthly fund pension payments from III pillar',
      }),
    ).toBeInTheDocument();
  }

  const loader = within(fundPensionSection).queryByRole('progressbar');
  if (loader) {
    await waitForElementToBeRemoved(loader);
  }

  expect(
    within(fundPensionSection).getByText(
      /The recommended duration is calculated based on the average years left to live according to your age. Currently, it is \d+ years./i,
    ),
  ).toBeInTheDocument();

  const paymentDeadline = within(fundPensionSection).getByText(/The first payment will be sent on/);

  expect(within(paymentDeadline).getByText(/January 16–20/)).toBeInTheDocument();
  expect(within(paymentDeadline).getByText(new RegExp(fundPensionSize))).toBeInTheDocument();

  if (pillar === 'SECOND') {
    const pillarStoppedWarning = within(fundPensionSection).getByText(
      /Upon submitting the application/,
    );
    expect(
      within(pillarStoppedWarning).getByText(/II pillar contributions will stop/),
    ).toBeInTheDocument();
    expect(within(pillarStoppedWarning).getByText(/from August 1/)).toBeInTheDocument();

    if (bankruptciesPresent) {
      expect(
        within(fundPensionSection).getByText(
          /because there is an active arrest or bankruptcy claim registered in the pension registry./,
        ),
      ).toBeInTheDocument();
    }
  }

  if (!bankruptciesPresent && pillar !== 'SECOND') {
    const cancelDeadline = within(fundPensionSection).getByText(
      /I can cancel the application until/,
    );
    expect(within(cancelDeadline).getByText(/December 31 at 21:59/)).toBeInTheDocument();
  }
};

export const assertPartialWithdrawalMandate = async ({
  pillar,
  rows,
  amount,
  bankruptciesPresent,
  taxRate = '10%',
}: {
  pillar: WithdrawalMandateDetails['pillar'];
  rows: { fundName: string; liquidationAmount: string }[];
  amount: string;
  bankruptciesPresent?: 'BANKRUPTCIES_ARRESTS_PRESENT';
  taxRate?: '22%' | '10%';
}) => {
  const partialWithdrawalSection = await screen.findByTestId(`PARTIAL_WITHDRAWAL_${pillar}`);

  if (pillar === 'SECOND') {
    expect(
      await within(partialWithdrawalSection).findByRole('heading', {
        name: 'Partial withdrawal from II pillar',
      }),
    ).toBeInTheDocument();
  } else {
    expect(
      await within(partialWithdrawalSection).findByRole('heading', {
        name: 'Partial withdrawal from III pillar',
      }),
    ).toBeInTheDocument();
  }

  const loader = within(partialWithdrawalSection).queryByRole('progressbar');
  if (loader) {
    await waitForElementToBeRemoved(loader);
  }

  expect((await within(partialWithdrawalSection).findAllByTestId('fund-row')).length).toBe(
    rows.length,
  );

  rows.forEach(({ fundName, liquidationAmount }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rowElement = within(partialWithdrawalSection).getByText(
      fundName,
      // eslint-disable-next-line testing-library/no-node-access
    ).parentElement!;

    expect(within(rowElement).getByText(fundName)).toBeInTheDocument();
    expect(within(rowElement).getByText(liquidationAmount)).toBeInTheDocument();
  });

  const paymentDeadline = within(partialWithdrawalSection).getByText(/The payment will be sent on/);

  if (pillar === 'SECOND') {
    expect(within(paymentDeadline).getByText(/January 16–20/)).toBeInTheDocument();
  } else {
    expect(within(paymentDeadline).getByText(/in four working days/)).toBeInTheDocument();
  }

  expect(within(partialWithdrawalSection).getByText(`${taxRate} income tax`)).toBeInTheDocument();

  expect(within(partialWithdrawalSection).getByText(new RegExp(amount))).toBeInTheDocument();

  if (pillar === 'SECOND') {
    const pillarStoppedWarning = within(partialWithdrawalSection).getByText(
      /Upon submitting the application/,
    );
    expect(
      within(pillarStoppedWarning).getByText(/II pillar contributions will stop/),
    ).toBeInTheDocument();
    expect(within(pillarStoppedWarning).getByText(/from August 1/)).toBeInTheDocument();

    if (bankruptciesPresent) {
      expect(
        within(partialWithdrawalSection).getByText(
          /because there is an active arrest or bankruptcy claim registered in the pension registry./,
        ),
      ).toBeInTheDocument();
    }
  }
};

export const partialWithdrawalSizeInput = async (
  taxRate: '22%' | '10%' = '10%',
): Promise<HTMLInputElement> =>
  screen.findByLabelText(`Withdraw with ${taxRate} income tax`, {
    selector: 'input[type="text"]',
  });

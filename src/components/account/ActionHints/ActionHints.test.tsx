import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../test/utils';
import { ActionHints } from './ActionHints';

const depositHint = 'Your parent can make deposits from their own bank account or yours.';
const withdrawHint = 'Your parent can make withdrawals, and only to your own bank account.';

const savingsFundHints = [
  { label: 'accountStatement.savingsFund.deposit', text: 'account.minor.depositHint' },
  { label: 'accountStatement.savingsFund.withdraw', text: 'account.minor.withdrawHint' },
] as const;

function renderHints() {
  renderWrapped(
    <>
      <ActionHints hints={[...savingsFundHints]} />
      <p>Elsewhere on the page</p>
      <button type="button">Next on the page</button>
    </>,
  );
}

const depositButton = () => screen.getByRole('button', { name: 'Deposit' });
const withdrawButton = () => screen.getByRole('button', { name: 'Withdraw' });

describe('ActionHints', () => {
  it('keeps every hint closed until asked', () => {
    renderHints();

    expect(depositButton()).toHaveAttribute('aria-expanded', 'false');
    expect(withdrawButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(depositHint)).not.toBeVisible();
    expect(screen.getByText(withdrawHint)).not.toBeVisible();
  });

  it('offers the actions as buttons that explain, not as links to act', () => {
    renderHints();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('opens a hint on click and ties it to its button', () => {
    renderHints();

    userEvent.click(depositButton());

    expect(depositButton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(depositHint)).toBeVisible();
    expect(depositButton()).toHaveAttribute('aria-controls', screen.getByText(depositHint).id);
  });

  it('closes the hint on a second click', () => {
    renderHints();

    userEvent.click(depositButton());
    userEvent.click(depositButton());

    expect(depositButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(depositHint)).not.toBeVisible();
  });

  it('shows one hint at a time', () => {
    renderHints();

    userEvent.click(depositButton());
    userEvent.click(withdrawButton());

    expect(screen.getByText(depositHint)).not.toBeVisible();
    expect(screen.getByText(withdrawHint)).toBeVisible();
  });

  it('closes on Escape and leaves focus on its button', () => {
    renderHints();

    userEvent.click(withdrawButton());
    userEvent.keyboard('{Escape}');

    expect(withdrawButton()).toHaveAttribute('aria-expanded', 'false');
    expect(withdrawButton()).toHaveFocus();
  });

  it('closes on a click elsewhere on the page', () => {
    renderHints();

    userEvent.click(depositButton());
    userEvent.click(screen.getByText('Elsewhere on the page'));

    expect(screen.getByText(depositHint)).not.toBeVisible();
  });

  it('opens while the mouse rests on the button and closes when it moves away', () => {
    renderHints();

    userEvent.hover(depositButton());
    expect(screen.getByText(depositHint)).toBeVisible();

    userEvent.unhover(depositButton());
    expect(screen.getByText(depositHint)).not.toBeVisible();
  });

  describe('next to a button near the right edge of a narrow screen', () => {
    beforeEach(() => {
      jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(400);
      jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ left: 300, right: 380 } as DOMRect);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shifts the hint left so it stays on screen', () => {
      renderHints();

      userEvent.click(depositButton());

      expect(screen.getByText(depositHint)).toHaveStyle({ left: '-120px' });
    });

    it.each(['resize', 'orientationchange'])(
      'places an open hint again when the screen changes (%s)',
      (eventType) => {
        renderHints();
        userEvent.click(depositButton());

        jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
        act(() => {
          window.dispatchEvent(new Event(eventType));
        });

        expect(screen.getByText(depositHint)).toHaveStyle({ left: '0px' });
      },
    );
  });

  it('keeps a hint opened by click while the mouse passes over another button', () => {
    renderHints();

    userEvent.click(depositButton());
    userEvent.hover(withdrawButton());
    userEvent.unhover(withdrawButton());

    expect(screen.getByText(depositHint)).toBeVisible();
  });

  it('closes when keyboard focus moves on to the next button', () => {
    renderHints();

    userEvent.click(depositButton());
    userEvent.tab();

    expect(withdrawButton()).toHaveFocus();
    expect(screen.getByText(depositHint)).not.toBeVisible();
  });

  it('closes when keyboard focus leaves the hints', () => {
    renderHints();

    userEvent.click(withdrawButton());
    userEvent.tab();

    expect(screen.getByRole('button', { name: 'Next on the page' })).toHaveFocus();
    expect(screen.getByText(withdrawHint)).not.toBeVisible();
  });

  it('ties each button to its own hint when the same hints are shown twice', () => {
    renderWrapped(
      <>
        <ActionHints hints={[...savingsFundHints]} />
        <ActionHints hints={[...savingsFundHints]} />
      </>,
    );

    const [firstDeposit, secondDeposit] = screen.getAllByRole('button', { name: 'Deposit' });
    const [firstHint, secondHint] = screen.getAllByText(depositHint);
    expect(firstDeposit).toHaveAttribute('aria-controls', firstHint.id);
    expect(secondDeposit).toHaveAttribute('aria-controls', secondHint.id);
    expect(firstHint.id).not.toBe(secondHint.id);
  });

  it('keeps a hint that was clicked open after the mouse moves away', () => {
    renderHints();

    userEvent.hover(depositButton());
    userEvent.click(depositButton());
    userEvent.unhover(depositButton());

    expect(screen.getByText(depositHint)).toBeVisible();
  });
});

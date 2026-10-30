import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmojiIcon, StepIcon } from './FutureMeIcon';
import { FutureMeStep } from './steps';

describe('FutureMeIcon', () => {
  it('draws a known emoji as a hidden line icon', () => {
    render(<EmojiIcon emoji="🌿" />);

    const icon = screen.getByTestId('icon-leaf');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
    expect(screen.queryByText('🌿')).not.toBeInTheDocument();
  });

  it('draws a car in the line icon style', () => {
    render(<EmojiIcon emoji="🚗" />);

    expect(screen.getByTestId('icon-car')).toHaveAttribute('stroke-width', '2');
  });

  it('keeps an emoji without a line icon as it is', () => {
    render(<EmojiIcon emoji="🦄" />);

    expect(screen.queryByTestId(/^icon-/)).not.toBeInTheDocument();
    expect(screen.getByText('🦄')).toBeInTheDocument();
  });

  it('draws the prototype icon of each step', () => {
    const expected = [
      [FutureMeStep.YOU, 'user'],
      [FutureMeStep.AGE_55, 'lockOpen'],
      [FutureMeStep.AGE_65, 'sun'],
      [FutureMeStep.SPECIAL_PENSION, 'shield'],
      [FutureMeStep.RESULT, 'flag'],
    ] as const;

    expected.forEach(([step, name]) => {
      const { unmount } = render(<StepIcon step={step} />);
      expect(screen.getByTestId(`icon-${name}`)).toBeInTheDocument();
      unmount();
    });
  });
});

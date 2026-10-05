import { within } from '@testing-library/react';

export const expectIconOnTheLineOfItsFirstWord = (
  button: HTMLElement,
  iconTestId: string,
  label: string,
): void => {
  const [firstWord] = label.split(' ');
  const icon = within(button).getByTestId(iconTestId);
  const iconAndFirstWord = within(button).getByText(firstWord);
  expect(button).toHaveAccessibleName(label);
  expect(icon).toHaveAttribute('aria-hidden', 'true');
  expect(iconAndFirstWord).toHaveClass('text-nowrap');
  // eslint-disable-next-line testing-library/no-node-access
  expect(iconAndFirstWord.firstElementChild).toBe(icon);
};

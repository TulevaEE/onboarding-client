import { expectFullWidthCancel } from './expectFullWidthCancel';

export const expectStackedFullWidth = (primary: HTMLElement, cancel: HTMLElement): void => {
  expect(primary).toHaveClass('btn-primary', 'btn-lg', 'text-wrap', 'text-balance');
  expectFullWidthCancel(cancel);
  /* eslint-disable testing-library/no-node-access */
  const stack = primary.parentElement;
  expect(stack).toHaveClass('d-grid', 'gap-2');
  expect(Array.from(stack?.children ?? [])).toEqual([primary, cancel]);
  /* eslint-enable testing-library/no-node-access */
};

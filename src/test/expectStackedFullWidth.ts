export const expectStackedFullWidth = (primary: HTMLElement, secondary: HTMLElement): void => {
  expect(primary).toHaveClass('btn-primary', 'btn-lg', 'text-wrap', 'text-balance');
  expect(secondary).toHaveClass('btn-outline-primary', 'btn-lg', 'text-wrap', 'text-balance');
  /* eslint-disable testing-library/no-node-access */
  const stack = primary.parentElement;
  expect(stack).toHaveClass('d-grid', 'gap-2');
  expect(Array.from(stack?.children ?? [])).toEqual([primary, secondary]);
  /* eslint-enable testing-library/no-node-access */
};

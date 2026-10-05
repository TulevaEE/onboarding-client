export const expectQuietLinkUnder = (primary: HTMLElement, link: HTMLElement): void => {
  expect(primary).toHaveClass('btn-primary', 'btn-lg', 'text-wrap', 'text-balance');
  expect(link).toHaveClass('btn', 'btn-link');
  expect(link).not.toHaveClass('btn-outline-primary');
  expect(link).not.toHaveClass('btn-lg');
  expect(link).toHaveStyle({ minHeight: '44px' });
  /* eslint-disable testing-library/no-node-access */
  expect(Array.from(primary.parentElement?.children ?? [])).toEqual([primary, link]);
  /* eslint-enable testing-library/no-node-access */
};

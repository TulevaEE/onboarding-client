export const expectFullWidthCancel = (cancel: HTMLElement): void => {
  expect(cancel).toHaveClass(
    'btn',
    'btn-outline-primary',
    'btn-lg',
    'w-100',
    'text-wrap',
    'text-balance',
  );
};

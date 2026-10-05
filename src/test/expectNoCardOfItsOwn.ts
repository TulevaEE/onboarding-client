export const expectNoCardOfItsOwn = (container: HTMLElement): void => {
  // eslint-disable-next-line testing-library/no-node-access
  expect(container.getElementsByClassName('shadow-sm')).toHaveLength(0);
};

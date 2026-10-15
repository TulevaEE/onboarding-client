import { pathOnThisSite } from './pathOnThisSite';

describe('pathOnThisSite', () => {
  test.each([
    ['/3rd-pillar-payment'],
    ['/capital/listings/42?tab=open#top'],
    ['/a%20b'],
    [`/${'a'.repeat(2047)}`],
  ])('keeps %s', (path) => {
    expect(pathOnThisSite(path)).toBe(path);
  });

  test.each([
    [null],
    [undefined],
    [''],
    ['3rd-pillar-payment'],
    ['//evil.example/account'],
    ['/\\evil.example/account'],
    ['/%5Cevil.example/account'],
    ['https://evil.example/account'],
    ['/3rd-pillar payment'],
    ['/3rd-pillar payment'],
    ['/capital/listings/%E0%A4%A'],
    [`/${'a'.repeat(2048)}`],
  ])('drops %s', (path) => {
    expect(pathOnThisSite(path)).toBeUndefined();
  });
});

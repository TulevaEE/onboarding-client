import { readFileSync } from 'fs';
import { join } from 'path';

const securityTxt = readFileSync(
  join(__dirname, '..', 'public', '.well-known', 'security.txt'),
  'utf8',
);

const fields = (name: string) =>
  securityTxt
    .split('\n')
    .filter((line) => line.startsWith(`${name}: `))
    .map((line) => line.slice(name.length + 2).trim());

describe('the security.txt vulnerability reporters find at /.well-known/security.txt', () => {
  it('tells reporters which address to write to', () => {
    expect(fields('Contact')).toEqual(['mailto:tuleva@tuleva.ee']);
  });

  it('names the address it is served from', () => {
    expect(fields('Canonical')).toEqual(['https://pension.tuleva.ee/.well-known/security.txt']);
  });

  it('has not expired', () => {
    const [expires] = fields('Expires');

    expect(new Date(expires).getTime()).toBeGreaterThan(Date.now());
  });

  it('expires at most a year after it is renewed, as the standard recommends', () => {
    const [expires] = fields('Expires');
    const oneYearAndAMonth = 395 * 24 * 60 * 60 * 1000;

    expect(new Date(expires).getTime() - Date.now()).toBeLessThan(oneYearAndAMonth);
  });
});

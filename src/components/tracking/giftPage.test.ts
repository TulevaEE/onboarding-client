import { withoutGiftToken } from './giftPage';

describe('withoutGiftToken', () => {
  it('replaces the token in the path of a gift page', () => {
    expect(withoutGiftToken('/kingitus/SECRETTOKEN')).toBe('/kingitus/:token');
    expect(withoutGiftToken('/kingitus/SECRETTOKEN/tehtud')).toBe('/kingitus/:token/tehtud');
  });

  it('leaves a path that carries no gift token as it is', () => {
    expect(withoutGiftToken('/account')).toBe('/account');
  });
});

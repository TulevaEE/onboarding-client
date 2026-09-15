import { loginLanding } from './loginLanding';

describe('loginLanding', () => {
  it('lands on the account page with the login flag when there was nowhere to return to', () => {
    expect(loginLanding(undefined)).toEqual({
      pathname: '/account',
      search: '',
      state: { justLoggedIn: true },
    });
  });

  it.each(['/', '/account', '/account/'])(
    'treats %s recorded by PrivateRoute as a login landing',
    (from) => {
      expect(loginLanding(from)).toEqual({
        pathname: '/account',
        search: '',
        state: { justLoggedIn: true },
      });
    },
  );

  it('keeps the query string of an account landing', () => {
    expect(loginLanding('/account?language=en')).toEqual({
      pathname: '/account',
      search: '?language=en',
      state: { justLoggedIn: true },
    });
  });

  it.each(['/capital/listings/42', '/account/child', '/2nd-pillar-payment-rate?utm_source=email'])(
    'returns the deep link %s untouched, without the login flag',
    (from) => {
      expect(loginLanding(from)).toBe(from);
    },
  );
});

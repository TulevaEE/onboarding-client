import {
  hasNudgeBeenDismissed,
  hasOtherServiceEntry,
  isOtherServiceDestination,
  rememberNudgeDismissed,
  rememberOtherServiceEntry,
} from './suppression';

describe('secondPillarNudge suppression', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  describe('isOtherServiceDestination', () => {
    it.each([
      '/3rd-pillar-flow',
      '/3rd-pillar-payment',
      '/savings-fund',
      '/savings-fund/onboarding',
      '/withdrawals',
      '/partner/2nd-pillar-flow',
    ])('treats %s as another service', (pathname) => {
      expect(isOtherServiceDestination(pathname)).toBe(true);
    });

    it.each(['/account', '/2nd-pillar-payment-rate', '/2nd-pillar-flow', '/'])(
      'does not treat %s as another service',
      (pathname) => {
        expect(isOtherServiceDestination(pathname)).toBe(false);
      },
    );
  });

  it('remembers and reads the other-service entry flag', () => {
    expect(hasOtherServiceEntry()).toBe(false);
    rememberOtherServiceEntry();
    expect(hasOtherServiceEntry()).toBe(true);
  });

  it('remembers and reads the dismissed flag', () => {
    expect(hasNudgeBeenDismissed()).toBe(false);
    rememberNudgeDismissed();
    expect(hasNudgeBeenDismissed()).toBe(true);
  });
});

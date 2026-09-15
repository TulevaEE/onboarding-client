import { mockRequestInMockMode, writeMockModeConfiguration } from '.';
import { mockUser } from '../../../test/backend-responses';
import { completeConversion } from '../../account/statusBox/fixtures';
import { conversionMockProfiles } from './profiles/conversion';
import { userMockProfiles } from './profiles/user';
import { withdrawalsEligibilityProfiles } from './profiles/withdrawalsEligibility';
import { nudgeProfiles } from './profiles/nudge';
import { mandateDeadlinesProfiles } from './profiles/mandateDeadlines';
import { paymentRateRedirectProfiles } from './profiles/paymentRateRedirect';

describe('mockRequestInMockMode', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('does not mock request when config is not set', async () => {
    expect(await mockRequestInMockMode(() => Promise.resolve(mockUser), 'user')).toBe(mockUser);

    expect(
      await mockRequestInMockMode(() => Promise.resolve(completeConversion), 'conversion'),
    ).toBe(completeConversion);
  });

  it('does not mock request when config is not empty', async () => {
    writeMockModeConfiguration({});
    expect(await mockRequestInMockMode(() => Promise.resolve(mockUser), 'user')).toBe(mockUser);

    expect(
      await mockRequestInMockMode(() => Promise.resolve(completeConversion), 'conversion'),
    ).toBe(completeConversion);
  });

  it('does not mock request when config is null', async () => {
    writeMockModeConfiguration(null);
    expect(await mockRequestInMockMode(() => Promise.resolve(mockUser), 'user')).toBe(mockUser);

    expect(
      await mockRequestInMockMode(() => Promise.resolve(completeConversion), 'conversion'),
    ).toBe(completeConversion);
  });

  it('mocks request when config is set but does not mock unset requests', async () => {
    writeMockModeConfiguration({ user: 'NO_SECOND_NO_THIRD_PILLAR', conversion: 'INCOMPLETE' });
    expect(await mockRequestInMockMode(() => Promise.resolve(mockUser), 'user')).toBe(
      userMockProfiles.NO_SECOND_NO_THIRD_PILLAR,
    );

    expect(
      await mockRequestInMockMode(() => Promise.resolve(completeConversion), 'conversion'),
    ).toBe(conversionMockProfiles.INCOMPLETE);

    expect(
      await mockRequestInMockMode(
        () => Promise.resolve(withdrawalsEligibilityProfiles.UNDER_55),
        'withdrawalsEligibility',
      ),
    ).toBe(withdrawalsEligibilityProfiles.UNDER_55);
  });

  it('mocks request when config is set and does not fail when endpoint throws', async () => {
    writeMockModeConfiguration({ user: 'NO_SECOND_NO_THIRD_PILLAR', conversion: 'INCOMPLETE' });
    expect(await mockRequestInMockMode(() => Promise.reject(new Error('bla bla')), 'user')).toBe(
      userMockProfiles.NO_SECOND_NO_THIRD_PILLAR,
    );

    expect(
      await mockRequestInMockMode(() => Promise.resolve(completeConversion), 'conversion'),
    ).toBe(conversionMockProfiles.INCOMPLETE);

    expect(
      await mockRequestInMockMode(
        () => Promise.resolve(withdrawalsEligibilityProfiles.UNDER_55),
        'withdrawalsEligibility',
      ),
    ).toBe(withdrawalsEligibilityProfiles.UNDER_55);
  });

  it('mocks the nudge decision and the mandate deadlines when their profiles are set', async () => {
    writeMockModeConfiguration({
      nudge: 'THIRD_PILLAR_START',
      mandateDeadlines: 'NOVEMBER_2026_BEFORE_DEADLINE',
    });

    expect(await mockRequestInMockMode(() => Promise.reject(new Error('offline')), 'nudge')).toBe(
      nudgeProfiles.THIRD_PILLAR_START,
    );
    expect(
      await mockRequestInMockMode(() => Promise.reject(new Error('offline')), 'mandateDeadlines'),
    ).toBe(mandateDeadlinesProfiles.NOVEMBER_2026_BEFORE_DEADLINE);
  });

  it('mocks the payment rate redirect answer when its profile is set', async () => {
    writeMockModeConfiguration({ paymentRateRedirect: 'TREATMENT' });

    expect(
      await mockRequestInMockMode(
        () => Promise.reject(new Error('offline')),
        'paymentRateRedirect',
      ),
    ).toBe(paymentRateRedirectProfiles.TREATMENT);
  });
});

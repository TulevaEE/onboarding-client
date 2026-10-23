import { createMemoryHistory } from 'history';
import {
  applyMockScenarioFromLink,
  isMockModeEnabled,
  mockRequestInMockMode,
  readMockModeConfiguration,
  writeMockModeConfiguration,
} from '.';
import { isSessionStorageBlocked } from '../siteStorage';
import { blockSiteStorage } from '../../../test/siteStorage';
import { mockUser } from '../../../test/backend-responses';
import { completeConversion } from '../../account/statusBox/fixtures';
import { conversionMockProfiles } from './profiles/conversion';
import { userMockProfiles } from './profiles/user';
import { withdrawalsEligibilityProfiles } from './profiles/withdrawalsEligibility';
import { nudgeProfiles } from './profiles/nudge';
import { mandateDeadlinesProfiles } from './profiles/mandateDeadlines';
import { paymentRateRedirectProfiles } from './profiles/paymentRateRedirect';
import { mockScenarios } from './scenarios';

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

  describe('when the browser blocks session storage', () => {
    let unblockSiteStorage: () => void;

    beforeEach(() => {
      unblockSiteStorage = blockSiteStorage();
      expect(isSessionStorageBlocked()).toBe(true);
    });

    afterEach(() => unblockSiteStorage());

    it('stays out of mock mode, even when a configuration is written', async () => {
      writeMockModeConfiguration({ user: 'NO_SECOND_NO_THIRD_PILLAR' });

      expect(readMockModeConfiguration()).toBeNull();
      expect(isMockModeEnabled()).toBe(false);
      expect(await mockRequestInMockMode(() => Promise.resolve(mockUser), 'user')).toBe(mockUser);
    });

    it('leaves mock mode without failing', () => {
      expect(() => writeMockModeConfiguration(null)).not.toThrow();
    });
  });
});

describe('applyMockScenarioFromLink', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('mocks the scenario a shared link names and takes it out of the address', () => {
    const history = createMemoryHistory({
      initialEntries: ['/2nd-pillar-rejoin?dev=SECOND_PILLAR_REJOIN_RATE_ONLY&language=en'],
    });

    applyMockScenarioFromLink(history);

    expect(readMockModeConfiguration()).toEqual(mockScenarios.SECOND_PILLAR_REJOIN_RATE_ONLY);
    expect(history.location).toMatchObject({
      pathname: '/2nd-pillar-rejoin',
      search: '?language=en',
    });
  });

  it('shows everyone who opens the link the same scenario, whatever they mocked before', () => {
    writeMockModeConfiguration({ funds: 'WITH_SAVINGS_FUND', user: 'PAYMENT_RATE_6' });
    const history = createMemoryHistory({
      initialEntries: ['/2nd-pillar-rejoin?dev=SECOND_PILLAR_REJOIN_RATE_ONLY'],
    });

    applyMockScenarioFromLink(history);

    expect(readMockModeConfiguration()).toEqual(mockScenarios.SECOND_PILLAR_REJOIN_RATE_ONLY);
    expect(history.location.search).toBe('');
  });

  it.each(['?dev', '?dev=NO_SUCH_SCENARIO', '?dev=toString', '?language=en'])(
    'leaves mock mode and the address alone for %s',
    (search) => {
      const history = createMemoryHistory({ initialEntries: [`/account${search}`] });

      applyMockScenarioFromLink(history);

      expect(readMockModeConfiguration()).toBeNull();
      expect(history.location.search).toBe(search);
    },
  );
});

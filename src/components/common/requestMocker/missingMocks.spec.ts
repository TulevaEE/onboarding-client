import { writeMockModeConfiguration } from '.';
import * as http from '../http';
import {
  createTrackedEvent,
  getCapitalEvents,
  getMemberCapitalListingCount,
  getMissingAmlChecks,
  getPendingOnboardings,
} from '../api';
import { getConnectedApps } from '../../security/connectedApps/connectedApps.api';
import { capitalEventsProfiles } from './profiles/capitalEvents';
import { pendingOnboardingsProfiles } from './profiles/pendingOnboardings';
import { connectedAppsProfiles } from './profiles/connectedApps';
import { amlChecksProfiles } from './profiles/amlChecks';
import { memberCapitalListingsProfiles } from './profiles/memberCapitalListings';
import { memberCapitalProfiles } from './profiles/memberCapital';

describe('mock mode for the pages that had no mocks', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('answers the member capital history from a profile that matches the member capital totals', async () => {
    writeMockModeConfiguration({ capitalEvents: 'ALL_TYPES' });

    expect(await getCapitalEvents()).toBe(capitalEventsProfiles.ALL_TYPES);
  });

  it('answers pending onboardings, connected apps and missing AML checks from their profiles', async () => {
    writeMockModeConfiguration({
      pendingOnboardings: 'NONE',
      connectedApps: 'ONE_APP',
      amlChecks: 'NONE_MISSING',
    });

    expect(await getPendingOnboardings()).toBe(pendingOnboardingsProfiles.NONE);
    expect(await getConnectedApps()).toBe(connectedAppsProfiles.ONE_APP);
    expect(await getMissingAmlChecks()).toBe(amlChecksProfiles.NONE_MISSING);
  });

  it('counts the listings of the mocked listings profile', async () => {
    writeMockModeConfiguration({ memberCapitalListings: 'LISTINGS' });

    expect(await getMemberCapitalListingCount()).toBe(
      memberCapitalListingsProfiles.LISTINGS.length,
    );
  });

  it('keeps every capital events profile in step with the member capital profile of the same name', () => {
    Object.entries(capitalEventsProfiles).forEach(([name, events]) => {
      const rows = memberCapitalProfiles[name] ?? [];
      rows.forEach(({ type, contributions }) => {
        const total = events
          .filter((event) => event.type === type)
          .reduce((sum, event) => sum + event.value, 0);
        expect({ name, type, total }).toEqual({ name, type, total: contributions });
      });
    });
  });

  it('sends no tracked events in mock mode, where there is no person to track', async () => {
    const post = jest.spyOn(http, 'postWithAuthentication');
    writeMockModeConfiguration({ user: 'ALL_PILLARS_MEMBER' });

    await createTrackedEvent('PAGE_VIEW', { path: '/account' });

    expect(post).not.toHaveBeenCalled();
    post.mockRestore();
  });
});

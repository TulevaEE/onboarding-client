import { pendingApplicationsProfiles } from './pendingApplications';

const profilesLoadedAt = (now: string): typeof pendingApplicationsProfiles => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(now));
  let profiles!: typeof pendingApplicationsProfiles;
  jest.isolateModules(() => {
    profiles =
      jest.requireActual<typeof import('./pendingApplications')>(
        './pendingApplications',
      ).pendingApplicationsProfiles;
  });
  return profiles;
};

describe('pending applications mock profiles', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('lists an application to rejoin only for a leaver who filed one, as no II pillar saver can have one', () => {
    const profilesWithRejoin = Object.entries(pendingApplicationsProfiles)
      .filter(([, applications]) => applications.some(({ type }) => type === 'REJOIN'))
      .map(([profileName]) => profileName);

    expect(profilesWithRejoin).toEqual(['SECOND_PILLAR_REJOIN']);
  });

  it('starts contributions from a filed rejoin on the first day of the sixth month after its cancellation deadline, whenever the mock is opened', () => {
    const [rejoin] = profilesLoadedAt('2027-02-10T10:00:00Z').SECOND_PILLAR_REJOIN;

    expect(rejoin.details).toEqual({
      cancellationDeadline: '2027-02-17T23:59:59.999Z',
      fulfillmentDate: '2027-08-01',
    });
  });
});

import { conversionMockProfiles } from './conversion';

const profileNames = Object.keys(conversionMockProfiles);

describe('conversion mock profiles', () => {
  it.each(profileNames)(
    '%s says whether a III pillar standing order is detected, as the service always does',
    (profileName) => {
      expect(typeof conversionMockProfiles[profileName].thirdPillar.recurringPaymentDetected).toBe(
        'boolean',
      );
    },
  );

  it('shows a standing order for a saver whose III pillar is not fully with Tuleva', () => {
    expect(conversionMockProfiles.INCOMPLETE.thirdPillar).toMatchObject({
      selectionComplete: false,
      transfersComplete: false,
      recurringPaymentDetected: true,
    });
  });
});

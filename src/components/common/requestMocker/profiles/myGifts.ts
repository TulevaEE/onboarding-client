import { ReceivedGift } from '../../apiModels';

export const myGiftsProfiles: Record<string, ReceivedGift[]> = {
  MINOR: [
    {
      receivedAt: '2026-08-10T09:00:00Z',
      amount: 30,
      giverName: 'Mai Maasikas',
      message: 'Palju õnne sünnipäevaks! Kasvagu see koos sinuga. Vanaema',
      confirmed: true,
    },
  ],
  NONE: [],
};

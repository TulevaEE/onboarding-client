import moment from 'moment';
import { MemberCapitalListing } from '../../apiModels';

export const memberCapitalListingsProfiles: Record<string, MemberCapitalListing[]> = {
  NONE: [],
  LISTINGS: [
    {
      id: 1,
      type: 'BUY',
      units: 10,
      totalPrice: 20,
      language: 'et',
      isOwnListing: false,
      currency: 'EUR',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
    {
      id: 2,
      type: 'SELL',
      units: 100,
      totalPrice: 250,
      currency: 'EUR',
      isOwnListing: false,
      language: 'et',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
    {
      id: 3,
      type: 'BUY',
      units: 10000,
      language: 'en',
      totalPrice: 23400,
      currency: 'EUR',
      isOwnListing: true,
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
  ],
};

import moment from 'moment';
import { MemberCapitalListing } from '../../apiModels';

export const memberCapitalListingsProfiles: Record<string, MemberCapitalListing[]> = {
  NONE: [],
  LISTINGS: [
    {
      id: 1,
      type: 'BUY',
      units: 10,
      pricePerUnit: 2,
      language: 'EE',
      currency: 'EUR',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
    {
      id: 2,
      type: 'SELL',
      units: 100,
      pricePerUnit: 2.5,
      currency: 'EUR',
      language: 'EE',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
    {
      id: 3,
      type: 'BUY',
      units: 10000,
      language: 'EN',
      pricePerUnit: 2.34,
      currency: 'EUR',
      expiryTime: moment().add(1, 'months').toISOString(),
      createdTime: moment().subtract(5, 'days').toISOString(),
    },
  ],
};

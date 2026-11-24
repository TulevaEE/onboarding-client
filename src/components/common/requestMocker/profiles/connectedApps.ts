import moment from 'moment';
import { ConnectedApp } from '../../apiModels';

export const connectedAppsProfiles: Record<string, ConnectedApp[]> = {
  NONE: [],
  ONE_APP: [
    {
      id: 'portfellow',
      clientName: 'Portfellow',
      scopes: ['balances:read', 'transactions:read'],
      connectedAt: moment().subtract(35, 'days').toISOString(),
      lastUsedAt: moment().subtract(2, 'days').toISOString(),
      expiresAt: moment().add(330, 'days').toISOString(),
    },
  ],
};

import React from 'react';
import { FormattedMessage } from 'react-intl';

import { exchangeHandoverToken } from '../common/api';
import { getQueryParams } from '../../utils';

export const Authenticate: React.FC = () => {
  const { handoverToken, provider } = getQueryParams();

  React.useEffect(() => {
    if (typeof handoverToken === 'string') {
      console.log('do stuff', provider, handoverToken);
    } else {
      console.error('invalid token', handoverToken);
      throw new Error('TODO: Handle invalid token');
    }
    exchangeHandoverToken(handoverToken)
      .then((res) => {
        console.log('successfully exchanged', res);
      })
      .catch((err) => {
        console.error('error on exchange', err);
      });
  }, [handoverToken]);

  // render loading screen... or?
  return (
    <>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <div>Loading...</div>
    </>
  );
};

export default Authenticate;

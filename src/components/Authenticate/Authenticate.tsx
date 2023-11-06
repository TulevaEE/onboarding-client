import React from 'react';
// import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Loader from '../common/loader';
import { exchangeHandoverToken } from '../common/api';
import { getQueryParams } from '../../utils';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../login/constants';

export const Authenticate: React.FC = () => {
  const { handoverToken, provider, redirect } = getQueryParams();
  const dispatch = useDispatch();
  const history = useHistory();

  React.useEffect(() => {
    if (typeof handoverToken !== 'string') {
      throw new Error('TODO: Handle invalid token');
      console.error('invalid token', provider, handoverToken);
    }
    console.log('exchanging', provider, handoverToken);
    exchangeHandoverToken(handoverToken)
      .then((res) => {
        const { accessToken } = res;
        console.log('successfully exchanged', res);
        dispatch({
          type: MOBILE_AUTHENTICATION_SUCCESS,
          tokens: { accessToken },
          method: 'handoverToken',
          provider,
        });
        console.log('redirecting');
        if (typeof redirect !== 'undefined') {
          // using push for ease of testings for now, will be turning into replace, because hitting back should skip this component
          history.push('/');
          // history.replace('/');
        }
      })
      .catch((err) => {
        console.error('error on exchange', err);
      });
  }, [handoverToken]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Loader className="align-middle" />
    </div>
  );
};

export default Authenticate;

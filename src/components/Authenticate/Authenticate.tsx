import React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Loader from '../common/loader';
import { exchangeHandoverToken } from '../common/api';
import { getQueryParams } from '../../utils';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../login/constants';
import { init } from './externalProviderUtils';

const getPath = (process?: unknown) => {
  if (typeof process !== 'string') {
    return null;
  }
  if (process === 'partner-3rd-pillar-flow') {
    return '/3rd-pillar-flow';
  }
  return null;
};

export const Authenticate: React.FC = () => {
  const intl = useIntl();
  const { handoverToken, provider, process, redirectUri, redirect } = getQueryParams();
  const dispatch = useDispatch();
  const history = useHistory();
  const [message, setMessage] = React.useState<undefined | string>();

  React.useEffect(() => {
    init(provider, redirectUri);

    if (typeof handoverToken !== 'string') {
      setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
      // throw new Error('TODO: Handle invalid token');
      console.error('invalid token', provider, handoverToken);
      return;
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
        const path = getPath(process);
        if (path) {
          setMessage(`Redirecting to ${path}`);
        } else {
          console.error('Unknown process:', process);
          setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
        }

        if (typeof redirect !== 'undefined') {
          if (path) {
            // using push for ease of testings for now, will be turning into replace, because hitting back should skip this component
            history.push(path);
            // history.replace(path);
          }
        }
      })
      .catch((err) => {
        setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
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
      {message ?? <Loader className="align-middle" />}
    </div>
  );
};

export default Authenticate;

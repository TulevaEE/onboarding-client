import React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Loader from '../common/loader';
import { exchangeHandoverToken } from '../common/api';
import { getQueryParams } from '../../utils';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../login/constants';
import { init } from './externalProviderUtils';

export const TriggerProcedure: React.FC = () => {
  const intl = useIntl();
  const query = getQueryParams();
  const dispatch = useDispatch();
  const history = useHistory();
  const [message, setMessage] = React.useState<undefined | string>();

  React.useEffect(() => {
    setMessage(undefined);
    try {
      const { provider, procedure, handoverToken, path, redirectUri } = init(query);
      exchangeHandoverToken(handoverToken)
        .then((res) => {
          const { accessToken } = res;
          // setting access token globally
          dispatch({
            type: MOBILE_AUTHENTICATION_SUCCESS,
            tokens: { accessToken },
            method: 'handoverToken',
            provider,
          });
          if (path) {
            setMessage(`Redirecting to ${path}`);
          } else {
            console.error('Unknown procedure:', procedure);
            setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
          }

          if (typeof query.redirect !== 'undefined') {
            if (path) {
              // using push for ease of testings for now, will be turning into replace, because hitting back should skip this component
              // history.push(path);
              // history.replace(path);
            }
          }
        })
        .catch((err) => {
          setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
          console.error('error on exchange', err);
        });
    } catch (err) {
      console.error(err);
      setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
    }
  }, [query.handoverToken]);

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

export default TriggerProcedure;

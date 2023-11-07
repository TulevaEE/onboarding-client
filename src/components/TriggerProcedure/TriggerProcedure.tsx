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
      const { provider, handoverToken, path } = init(query);
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

          setMessage(`Redirecting to ${path}`);

          if (typeof query.redirect !== 'undefined') {
            if (path) {
              // using push for ease of testings for now, will be turning into replace, because hitting back should skip this component
              history.push(path);
              // history.replace(path);
            }
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console -- make this flow more debuggable for 3rd parties
          console.error('error on exchange', err);
          setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
        });
    } catch (err) {
      // eslint-disable-next-line no-console -- make this flow more debuggable for 3rd parties
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

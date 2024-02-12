import React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Loader from '../common/loader';
import { exchangeHandoverTokenForAccessToken } from './exchangeHandoverToken';
import { getQueryParams } from '../../utils';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../login/constants';
import { finish, init, parseJwt } from './utils';

import './TriggerProcedure.scss';

export const TriggerProcedure: React.FC = () => {
  const intl = useIntl();
  const query = getQueryParams();
  const dispatch = useDispatch();
  const history = useHistory();
  const [message, setMessage] = React.useState<null | string>(null);

  React.useEffect(() => {
    setMessage(null);
    try {
      const { provider, handoverToken, path } = init(query);
      exchangeHandoverTokenForAccessToken(handoverToken)
        .then((token) => {
          if (!token) {
            throw new Error('Failed to receive accessToken');
          }

          // setting access token globally
          dispatch({
            type: MOBILE_AUTHENTICATION_SUCCESS,
            tokens: token,
            method: parseJwt(handoverToken).signingMethod,
            provider,
          });

          setMessage(`Redirecting to ${path}`);

          if (query.redirect === '0') {
            return;
          }

          // using push for ease of testings for now, will be turning into replace, because hitting back should skip this component
          history.push(path);
          // history.replace(path);
        })
        .catch((err: Error) => {
          // eslint-disable-next-line no-console -- make this flow more debuggable for 3rd parties
          console.error('error on exchange', err);
          setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
          finish(undefined, err.message);
        });
    } catch (err) {
      // eslint-disable-next-line no-console -- make this flow more debuggable for 3rd parties
      console.error(err);
      setMessage(intl.formatMessage({ id: 'partnerFlow.error' }));
      if (err instanceof Error) {
        finish(undefined, err.message);
      }
    }
  }, [query.handoverToken]);

  return (
    <div className="full-screen centered-contents">
      {message ?? <Loader className="align-middle" />}
    </div>
  );
};

export default TriggerProcedure;

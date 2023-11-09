import React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Loader from '../common/loader';
import { exchangeHandoverTokenForAccessToken } from './exchangeHandoverToken';
import { getQueryParams } from '../../utils';
import { MOBILE_AUTHENTICATION_SUCCESS } from '../login/constants';
import { init, finish } from './utils';

import './TriggerProcedure.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJwt(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  );

  return JSON.parse(jsonPayload);
}

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

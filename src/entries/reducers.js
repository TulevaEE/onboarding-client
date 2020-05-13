import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { reducer as form } from 'redux-form';

import { reducer as login } from './components/login';
import { reducer as exchange } from './components/exchange';
import { reducer as account } from './components/account';
import { reducer as contactDetail } from './components/contact-details';
import { reducer as thirdPillar } from './components/thirdPillar';
import { reducer as tracking } from './components/tracking';

export default history =>
  combineReducers({
    router: connectRouter(history),
    login,
    exchange,
    account,
    thirdPillar,
    tracking,
    contactDetail,
    form,
  });

import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { reducer as form } from 'redux-form';

import { reducer as login } from './components/login';
import { reducer as exchange } from './components/exchange';
import { reducer as account } from './components/account';
import { reducer as contactDetails } from './components/contact-details';
import { reducer as thirdPillar } from './components/thirdPillar';
import { reducer as tracking } from './components/tracking';
import { reducer as aml } from './components/aml';
import { LOG_OUT } from './components/login/constants';

export default (history) => {
  const appReducer = combineReducers({
    router: connectRouter(history),
    login,
    exchange,
    account,
    thirdPillar,
    tracking,
    contactDetails,
    form,
    aml,
  });

  return (state, action) => {
    if (action.type === LOG_OUT) {
      return appReducer(undefined, action); // go to default state;
    }
    return appReducer(state, action);
  };
};

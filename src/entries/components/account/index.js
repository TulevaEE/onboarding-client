import accountReducer from './reducer';
import * as accountActions from './actions';

export { default } from './AccountPage'; // eslint-disable-line import/no-cycle
export const reducer = accountReducer;
export const actions = accountActions;

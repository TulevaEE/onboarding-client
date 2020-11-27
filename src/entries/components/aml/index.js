import amlReducer from './reducer';
import * as amlActions from './actions';

export { default } from './AmlPage';
export const reducer = amlReducer;
export const actions = amlActions;
export { hasContactDetailsAmlCheck } from './amlSelector';

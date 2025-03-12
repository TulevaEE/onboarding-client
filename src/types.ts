import { RouterState } from 'connected-react-router';
import { Aml } from './components/aml/types';
import { Login } from './components/login/types';
import { Exchange } from './components/exchange/types';
import { Account } from './components/account/types';
import { ContactDetails } from './components/contact-details/types';
import { ThirdPillar } from './components/thirdPillar/types';

export type State = {
  login: Login;
  exchange: Exchange;
  account: Account;
  thirdPillar: ThirdPillar;
  contactDetails: ContactDetails;
  aml: Aml;
  router: RouterState;
};

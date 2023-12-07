import { User, UserConversion } from '../common/apiModels';

export type Login = {
  phoneNumber: string;
  personalCode: string;
  controlCode: string;
  loadingAuthentication: boolean;
  token: string;
  loginMethod: LoginMethod;
  error: string;
  user: User;
  loadingUser: boolean;
  userError: string;
  userConversion: UserConversion;
  loadingUserConversion: boolean;
  userConversionError: string;
  redirectLogin: boolean;
  email: string;
};

type LoginMethod = 'MOBILE_ID' | 'SMART_ID' | 'ID_CARD';

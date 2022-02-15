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

type LoginMethod = 'mobileId' | 'smartId' | 'idCard';

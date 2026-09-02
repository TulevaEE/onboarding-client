import { AuthenticationPrincipal, User, UserConversion } from '../common/apiModels';

export type Login = {
  phoneNumber: string;
  personalCode: string;
  controlCode: string;
  smartIdWeb2AppLink: string | null;
  loadingAuthentication: boolean;
  authenticationPrincipal: AuthenticationPrincipal;
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

import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import UpdateUserForm from './updateUserForm';
import { updateUser, updateUserEmailAndPhone } from '../common/user/actions';
import { State } from '../../types';
import { ContactDetailsRedirectState } from './ContactDetailsGatekeep';

export const ContactDetailsPage = () => {
  const dispatch = useDispatch();
  const location = useLocation<ContactDetailsRedirectState>();

  const updateUserSuccess = useSelector((state: State) => state.contactDetails.updateUserSuccess);

  // user is redux form specific value
  const saveUser = (user: unknown) => {
    if (location.state.updateOnlyEmailAndPhone) {
      dispatch(updateUserEmailAndPhone(user));
    } else {
      dispatch(updateUser(user));
    }
  };

  usePageTitle('pageTitle.contactDetails');

  if (updateUserSuccess) {
    if ('referrer' in location.state && location.state.referrer) {
      return <Redirect to={location.state.referrer} />;
    }
  }

  return (
    <div className="col-sm-8 col-md-6 col-lg-5 mx-auto">
      <h1 className="mb-4">
        <FormattedMessage id="update.user.details.title" />
      </h1>
      {location.state.mandatoryUpdate && (
        <p className="mb-5">
          <FormattedMessage id="update.user.details.mandatoryUpdate" />
        </p>
      )}
      <UpdateUserForm onSubmit={saveUser} />
    </div>
  );
};

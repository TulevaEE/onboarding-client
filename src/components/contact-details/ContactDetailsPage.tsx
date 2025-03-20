import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import UpdateUserForm from './updateUserForm';
import { updateUser, updateUserEmailAndPhone } from '../common/user/actions';
import { State } from '../../types';
import { ContactDetailsRedirectState } from './ContactDetailsGatekeep';

export const ContactDetailsPage = () => {
  const dispatch = useDispatch();
  const location = useLocation<ContactDetailsRedirectState | undefined>();

  const updateUserSuccess = useSelector((state: State) => state.contactDetails.updateUserSuccess);

  // user is redux form specific value
  const saveUser = (user: unknown) => {
    dispatch(updateUser(user));
  };

  usePageTitle('pageTitle.contactDetails');

  if (updateUserSuccess) {
    if (location.state && location.state?.from) {
      return <Redirect to={location.state.from} />;
    }
  }

  return (
    <div className="col-sm-10 col-md-8 col-lg-6 mx-auto">
      <h1 className="mb-4">
        <FormattedMessage id="update.user.details.title" />
      </h1>
      {location.state?.mandatoryUpdate && (
        <p className="mb-5">
          <FormattedMessage id="update.user.details.mandatoryUpdate" />
        </p>
      )}
      <UpdateUserForm onSubmit={saveUser} />
    </div>
  );
};

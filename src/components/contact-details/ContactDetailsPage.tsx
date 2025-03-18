import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { usePageTitle } from '../common/usePageTitle';
import UpdateUserForm from './updateUserForm';
import { updateUser } from '../common/user/actions';

export const ContactDetailsPage = () => {
  const dispatch = useDispatch();

  // user
  const saveUser = (user: unknown) => {
    dispatch(updateUser(user));
  };

  usePageTitle('pageTitle.contactDetails');

  return (
    <div className="col-sm-8 col-md-6 col-lg-5 mx-auto">
      <h1 className="mb-4">
        <FormattedMessage id="update.user.details.title" />
      </h1>
      <UpdateUserForm onSubmit={saveUser} />
    </div>
  );
};

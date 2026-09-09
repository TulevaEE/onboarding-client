import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../common/statusAlert';
import { Nudge } from '../common/nudge/Nudge';

export const MembershipSuccess: FC = () => (
  <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
    <StatusAlert
      title={<FormattedMessage id="nudge.membership.success.title" />}
      actions={
        <a href="/account" className="btn btn-outline-primary">
          <FormattedMessage id="common.myAccount" />
        </a>
      }
    />
    <Nudge context="MEMBERSHIP" />
  </div>
);

export default MembershipSuccess;

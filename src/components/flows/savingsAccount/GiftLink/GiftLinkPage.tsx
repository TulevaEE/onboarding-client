import { FC, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useMe, usePendingOnboardings, useRoles } from '../../../common/apiHooks';
import { Role, User } from '../../../common/apiModels';
import { isChildRole } from '../../../common/utils';
import { byCode } from '../accountHolder';
import { usePageTitle } from '../../../common/usePageTitle';
import { CopyButton } from '../../../common/CopyButton';
import { pendingChildOnboardings } from '../SavingsFundOnboarding/onboardingFlows';
import { ReceivedGifts } from './ReceivedGifts';
import { ChildPicker } from './ChildPicker';
import { NoChildAccount } from './NoChildAccount';
import { ReplaceLinkButton } from './ReplaceLinkButton';
import { useMyGiftLink, useReceivedGifts, useReplaceGiftLink } from './api/giftLink.api';

const childrenOf = (user: User, roles: Role[]): Role[] =>
  roles.filter((role) => isChildRole(role, user)).sort(byCode);

const childLookedAt = (user: User, children: Role[]): string | undefined =>
  children.find((child) => child.code === user.role?.code)?.code;

const chosenChild = (
  user: User,
  children: Role[],
  picked: string | undefined,
): string | undefined =>
  children.find((child) => child.code === picked)?.code ??
  childLookedAt(user, children) ??
  children[0]?.code;

type EditedInvitation = { url: string; text: string };

const withCurrentLink = (edited: EditedInvitation, url: string): string =>
  edited.text.split(edited.url).join(url);

const pageColumn = 'col-12 col-md-10 col-lg-7 mx-auto';

const ErrorAlert: FC = () => (
  <div className="alert alert-danger" role="alert">
    <FormattedMessage id="giftLink.parent.error" />
  </div>
);

const ParentGiftLink: FC<{ user: User }> = ({ user }) => {
  const { formatMessage } = useIntl();
  const { data: roles, isError: rolesFailed } = useRoles();
  const children = roles ? childrenOf(user, roles) : undefined;
  const [pickedChild, setPickedChild] = useState<string>();
  const childCode = children ? chosenChild(user, children, pickedChild) : undefined;
  const {
    data: pendingOnboardings = [],
    isError: pendingFailed,
    isInitialLoading: pendingLoading,
  } = usePendingOnboardings({ enabled: children?.length === 0 });
  const { data: giftLink, isError: linkFailed } = useMyGiftLink(childCode);
  const { data: gifts, isError: giftsFailed } = useReceivedGifts(childCode, giftLink?.id);
  const replaceLink = useReplaceGiftLink();

  const url = giftLink ? `${window.location.origin}/kingitus/${giftLink.token}` : '';
  const invitation = formatMessage({ id: 'giftLink.parent.invitation' }, { url });
  const [editedInvitations, setEditedInvitations] = useState<Record<string, EditedInvitation>>({});
  const edited = childCode ? editedInvitations[childCode] : undefined;
  const editedInvitation = edited ? withCurrentLink(edited, url) : invitation;

  const noChildYet = children?.length === 0;
  if ((rolesFailed && !roles) || (noChildYet && pendingFailed)) {
    return (
      <div className={pageColumn}>
        <ErrorAlert />
      </div>
    );
  }

  if (!children || (noChildYet && pendingLoading)) {
    return null;
  }

  if (noChildYet) {
    return (
      <div className={pageColumn}>
        <NoChildAccount pendingOnboardings={pendingChildOnboardings(pendingOnboardings)} />
      </div>
    );
  }

  return (
    <div className={`${pageColumn} d-flex flex-column gap-5`}>
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">
          <FormattedMessage id="giftLink.parent.title" />
        </h1>
        {childCode && (
          <ChildPicker options={children} chosen={childCode} onChoose={setPickedChild} />
        )}
      </div>

      {linkFailed && !giftLink && <ErrorAlert />}

      {giftLink && childCode && (
        <>
          <div className="form-section d-flex flex-column gap-3">
            <label htmlFor="gift-invitation" className="fs-3 fw-semibold">
              <FormattedMessage id="giftLink.parent.invitation.label" />
            </label>
            <textarea
              id="gift-invitation"
              className="form-control"
              rows={5}
              value={editedInvitation}
              onChange={(event) =>
                setEditedInvitations((all) => ({
                  ...all,
                  [childCode]: { url, text: event.target.value },
                }))
              }
            />
            <p className="m-0 text-body-secondary">
              <FormattedMessage id="giftLink.parent.invitation.editIt" />
            </p>
            <div>
              <CopyButton
                textToCopy={editedInvitation}
                className="btn btn-lg btn-primary d-inline-flex align-items-center gap-2"
              >
                <FormattedMessage id="giftLink.parent.invitation.copy" />
              </CopyButton>
            </div>
          </div>

          <div className="form-section d-flex flex-column gap-3">
            <label htmlFor="gift-link-url" className="fs-3 fw-semibold">
              <FormattedMessage id="giftLink.parent.yourLink" />
            </label>
            <div className="input-group input-group-lg">
              <input id="gift-link-url" type="text" readOnly className="form-control" value={url} />
              <span className="input-group-text">
                <CopyButton textToCopy={url} />
              </span>
            </div>
            <p className="m-0 text-body-secondary">
              <FormattedMessage id="giftLink.parent.sendItTo" />
            </p>
            <a href={url} target="_blank" rel="noreferrer">
              <FormattedMessage id="giftLink.parent.seeWhatTheySee" />
            </a>
          </div>

          <ReceivedGifts gifts={gifts} isError={giftsFailed} />
        </>
      )}

      <div
        className={`d-flex justify-content-between align-items-start ${
          giftLink ? 'border-top pt-4' : ''
        }`}
      >
        <Link to="/account" className="btn btn-outline-primary">
          <FormattedMessage id="giftLink.parent.back" />
        </Link>
        {giftLink && childCode && (
          <ReplaceLinkButton
            giftLink={giftLink}
            childPersonalCode={childCode}
            replaceLink={replaceLink}
          />
        )}
      </div>
    </div>
  );
};

export const GiftLinkPage: FC = () => {
  usePageTitle('giftLink.parent.pageTitle');
  const { data: user } = useMe();

  if (!user) {
    return null;
  }

  return <ParentGiftLink key={user.role?.code ?? user.personalCode} user={user} />;
};

import { FC, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '../../../common/apiHooks';
import { isChildRole } from '../../../common/utils';
import { usePageTitle } from '../../../common/usePageTitle';
import { CopyButton } from '../../../common/CopyButton';
import { SimpleList, SimpleListItem } from '../../../common/simpleList';
import { Deposit, Defer, Verify } from '../InfoSection/assets';
import { ReceivedGifts } from './ReceivedGifts';
import { useMyGiftLink, useReceivedGifts, useReplaceGiftLink } from './api/giftLink.api';

export const GiftLinkPage: FC = () => {
  usePageTitle('giftLink.parent.pageTitle');
  const { formatMessage } = useIntl();
  const { data: user, isSuccess: userLoaded } = useMe();
  const childCode = user?.role && isChildRole(user.role, user) ? user.role.code : undefined;
  const { data: giftLink, isError } = useMyGiftLink(childCode);
  const { data: gifts, isError: giftsFailed } = useReceivedGifts(childCode);
  const replaceLink = useReplaceGiftLink();
  const queryClient = useQueryClient();

  const url = giftLink ? `${window.location.origin}/kingitus/${giftLink.token}` : '';
  const invitation = formatMessage({ id: 'giftLink.parent.invitation' }, { url });
  const [editedInvitation, setEditedInvitation] = useState(invitation);
  useEffect(() => setEditedInvitation(invitation), [invitation]);

  if (userLoaded && !childCode) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column align-items-start gap-4">
        <p className="m-0">
          <FormattedMessage id="giftLink.parent.notForThisAccount" />
        </p>
        <Link to="/account" className="btn btn-outline-primary">
          <FormattedMessage id="giftLink.parent.goToAccount" />
        </Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto">
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="giftLink.parent.error" />
        </div>
      </div>
    );
  }

  if (!user?.role || !giftLink) {
    return null;
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">
          <FormattedMessage id="giftLink.parent.title" />
        </h1>
        <p className="m-0 text-center fs-3 fw-medium">
          <FormattedMessage id="giftLink.parent.account" values={{ name: user.role.name }} />
        </p>
      </div>

      <div className="pt-4 pb-4 border-top border-bottom">
        <SimpleList>
          <SimpleListItem
            media={<Deposit />}
            title={<FormattedMessage id="giftLink.parent.noLoginNeeded" />}
          />
          <SimpleListItem
            media={<Verify />}
            title={<FormattedMessage id="giftLink.parent.reachesTheRightAccount" />}
          />
          <SimpleListItem
            media={<Defer />}
            title={<FormattedMessage id="giftLink.parent.neverExpires" />}
          />
        </SimpleList>
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
      </div>

      <div className="form-section d-flex flex-column gap-3">
        <label htmlFor="gift-invitation" className="fs-3 fw-semibold">
          <FormattedMessage id="giftLink.parent.invitation.label" />
        </label>
        <textarea
          id="gift-invitation"
          className="form-control"
          rows={5}
          value={editedInvitation}
          onChange={(event) => setEditedInvitation(event.target.value)}
        />
        <p className="m-0 text-body-secondary">
          <FormattedMessage id="giftLink.parent.invitation.editIt" />
        </p>
        <div className="d-flex flex-wrap gap-3">
          <CopyButton
            textToCopy={editedInvitation}
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
          >
            <FormattedMessage id="giftLink.parent.invitation.copy" />
          </CopyButton>
          <a className="btn btn-outline-primary" href={url} target="_blank" rel="noreferrer">
            <FormattedMessage id="giftLink.parent.seeWhatTheySee" />
          </a>
        </div>
      </div>

      <ReceivedGifts gifts={gifts} isError={giftsFailed} />

      <div className="border-top pt-4 d-flex justify-content-between align-items-start">
        <Link to="/account" className="btn btn-outline-primary">
          <FormattedMessage id="giftLink.parent.back" />
        </Link>
        <div className="text-end">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={replaceLink.isLoading}
            onClick={() =>
              replaceLink.mutate(giftLink.id, {
                onSuccess: (link) => queryClient.setQueryData(['myGiftLink', childCode], link),
              })
            }
          >
            <FormattedMessage id="giftLink.parent.replace" />
          </button>
          <p className="m-0 mt-2 small text-body-secondary">
            <FormattedMessage id="giftLink.parent.replace.warning" />
          </p>
          {replaceLink.isError && (
            <div className="alert alert-danger mt-3 mb-0 text-start" role="alert">
              <FormattedMessage id="giftLink.parent.replace.error" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { UseMutationResult } from '@tanstack/react-query';
import { GiftLink, ReplaceGiftLinkCommand, useIsReplacingAGiftLink } from './api/giftLink.api';

type Props = {
  giftLink: GiftLink;
  childPersonalCode: string;
  replaceLink: UseMutationResult<GiftLink, unknown, ReplaceGiftLinkCommand>;
};

export const ReplaceLinkButton: FC<Props> = ({ giftLink, childPersonalCode, replaceLink }) => {
  const replacing = useIsReplacingAGiftLink();
  const failedForThisChild =
    replaceLink.isError && replaceLink.variables?.childPersonalCode === childPersonalCode;

  return (
    <div className="text-end">
      <button
        type="button"
        className="btn btn-outline-secondary"
        disabled={replacing}
        onClick={() => replaceLink.mutate({ id: giftLink.id, childPersonalCode })}
      >
        <FormattedMessage id="giftLink.parent.replace" />
      </button>
      <p className="m-0 mt-2 small text-body-secondary">
        <FormattedMessage id="giftLink.parent.replace.warning" />
      </p>
      {failedForThisChild && (
        <div className="alert alert-danger mt-3 mb-0 text-start" role="alert">
          <FormattedMessage id="giftLink.parent.replace.error" />
        </div>
      )}
    </div>
  );
};

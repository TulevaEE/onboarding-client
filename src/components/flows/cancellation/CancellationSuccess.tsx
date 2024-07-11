import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useSignedMandateDownload } from '../../exchange/hooks';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';

export const CancellationSuccess: React.FunctionComponent<unknown> = () => {
  const { download } = useSignedMandateDownload();

  return (
    <div className="row">
      <div className="col-12 mt-5 px-0">
        <SuccessNotice>
          <h2 className="text-center m-0 mt-3">
            <FormattedMessage id="cancellation.flow.success.title" />
          </h2>
          <button type="button" className="btn btn-light text-center mt-5" onClick={download}>
            <FormattedMessage id="cancellation.flow.success.download" />
          </button>
        </SuccessNotice>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="cancellation.flow.success.back" />
        </a>
      </div>
    </div>
  );
};

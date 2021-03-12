import React from 'react';
import { Link } from 'react-router-dom';
import { Message } from 'retranslate';
import { useSignedMandateDownload } from '../../exchange/hooks';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';

export const CancellationSuccess: React.FunctionComponent<unknown> = () => {
  const { download } = useSignedMandateDownload();

  return (
    <div className="row">
      <div className="col-12 mt-5 px-0">
        <SuccessNotice>
          <h2 className="text-center mt-3">
            <Message>cancellation.flow.success.title</Message>
          </h2>
          <button type="button" className="btn btn-secondary text-center" onClick={download}>
            <Message>cancellation.flow.success.download</Message>
          </button>
        </SuccessNotice>
        <Link className="btn btn-primary mt-4 profile-link" to="/account">
          <Message>cancellation.flow.success.back</Message>
        </Link>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import download from 'downloadjs';
import { SuccessNotice2 } from '../common/SuccessNotice2/SuccessNotice2';
import { downloadSignedInsuranceTransferForm } from '../../common/api';
import { useInsuranceTransferForm, useMe } from '../../common/apiHooks';
import { InsuranceTransferForm } from '../../common/apiModels/insurance-transfer';
import { CopyButton } from '../../common/CopyButton';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { ACCOUNT_PATH } from '../../paths';
import { insurers } from './insurers';
import { LoadFailed } from './LoadFailed';

const SIGNED_CONTAINER_TYPE = 'application/vnd.etsi.asic-e+zip';

const useSignedRequestDownload = (form: InsuranceTransferForm) => {
  const [downloadFailed, setDownloadFailed] = useState(false);
  const downloadSigned = () =>
    downloadSignedInsuranceTransferForm(form.id)
      .then((file) =>
        download(
          file,
          `Tuleva_${insurers[form.insurer].name}_avaldus.asice`,
          SIGNED_CONTAINER_TYPE,
        ),
      )
      .catch(() => setDownloadFailed(true));

  return { downloadSigned, downloadFailed };
};

const DownloadButton = ({ className, onClick }: { className: string; onClick: () => void }) => (
  <button type="button" className={className} onClick={onClick}>
    <FormattedMessage id="insuranceTransfer.signed.downloadButton" />
  </button>
);

const InsurerAddress = ({ email }: { email: string }) => (
  <div className="d-flex justify-content-center align-items-center column-gap-2">
    <b className="text-break">{email}</b>
    <CopyButton textToCopy={email} />
  </div>
);

const SignedRequest = ({ form, userEmail }: { form: InsuranceTransferForm; userEmail: string }) => {
  const emailed = form.emailStatus === 'SENT';
  const { downloadSigned, downloadFailed } = useSignedRequestDownload(form);
  const values = {
    insurer: insurers[form.insurer].name,
    userEmail: <span className={PII_CLASS}>{userEmail}</span>,
  };

  return (
    <SuccessNotice2 className="text-pretty">
      <h2 className="my-3">
        <FormattedMessage id="insuranceTransfer.signed.title" />
      </h2>
      <p className="mb-2">
        <FormattedMessage
          id={emailed ? 'insuranceTransfer.signed.emailed' : 'insuranceTransfer.signed.download'}
          values={values}
        />
      </p>
      <InsurerAddress email={form.insurerEmail} />
      {emailed && <DownloadButton className="btn btn-link" onClick={downloadSigned} />}
      <div className="d-flex flex-column-reverse flex-sm-row justify-content-center gap-3 mt-3">
        <Link className="btn btn-outline-primary" to={ACCOUNT_PATH}>
          <FormattedMessage id="thirdPillarSuccess.button.account" />
        </Link>
        {!emailed && <DownloadButton className="btn btn-primary" onClick={downloadSigned} />}
      </div>
      {downloadFailed && (
        <div className="mt-3" role="alert">
          <LoadFailed />
        </div>
      )}
    </SuccessNotice2>
  );
};

export const InsuranceTransferSigned = () => {
  usePageTitle('pageTitle.thirdPillarInsurance');
  const { formId } = useParams<{ formId: string }>();
  const { data: form, isError: formFailed } = useInsuranceTransferForm(formId);
  const { data: user, isError: userFailed } = useMe();

  if (!form || !user) {
    return (
      <div className="mt-4">
        {formFailed || userFailed ? <LoadFailed /> : <Shimmer height={300} />}
      </div>
    );
  }

  return <SignedRequest form={form} userEmail={user.email} />;
};

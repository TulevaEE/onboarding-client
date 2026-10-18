import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import download from 'downloadjs';
import { SuccessNotice2 } from '../common/SuccessNotice2/SuccessNotice2';
import { downloadSignedInsuranceTransferForm } from '../../common/api';
import { useInsuranceTransferForm } from '../../common/apiHooks';
import { InsuranceTransferForm } from '../../common/apiModels/insurance-transfer';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { ACCOUNT_PATH } from '../../paths';
import { insurers } from './insurers';
import { LoadFailed } from './LoadFailed';

const SIGNED_CONTAINER_TYPE = 'application/vnd.etsi.asic-e+zip';

const DownloadSignedRequest = ({ form }: { form: InsuranceTransferForm }) => {
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

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={downloadSigned}>
        <FormattedMessage id="insuranceTransfer.signed.downloadButton" />
      </button>
      {downloadFailed && (
        <div className="mt-3" role="alert">
          <LoadFailed />
        </div>
      )}
    </>
  );
};

const SignedRequest = ({ form }: { form: InsuranceTransferForm }) => {
  const emailed = form.emailStatus === 'SENT';
  const values = {
    insurer: insurers[form.insurer].name,
    email: (
      <a className="text-break" href={`mailto:${form.insurerEmail}`}>
        {form.insurerEmail}
      </a>
    ),
  };

  return (
    <SuccessNotice2 className="text-pretty">
      <h2 className="my-3">
        <FormattedMessage id="insuranceTransfer.signed.title" />
      </h2>
      <p>
        <FormattedMessage
          id={emailed ? 'insuranceTransfer.signed.emailed' : 'insuranceTransfer.signed.download'}
          values={values}
        />
      </p>
      {!emailed && <DownloadSignedRequest form={form} />}
      <div>
        <Link className="btn btn-outline-primary mt-3" to={ACCOUNT_PATH}>
          <FormattedMessage id="thirdPillarSuccess.button.account" />
        </Link>
      </div>
    </SuccessNotice2>
  );
};

export const InsuranceTransferSigned = () => {
  usePageTitle('pageTitle.thirdPillarInsurance');
  const { formId } = useParams<{ formId: string }>();
  const { data: form, isError } = useInsuranceTransferForm(formId);

  if (!form) {
    return <div className="mt-4">{isError ? <LoadFailed /> : <Shimmer height={300} />}</div>;
  }

  return <SignedRequest form={form} />;
};

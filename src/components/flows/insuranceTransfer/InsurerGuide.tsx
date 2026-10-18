import { Fragment, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../common/PaymentStep/PaymentStep';
import { CopyButton } from '../../common/CopyButton';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { GuidedInsurerCode, guides, insurers } from './insurers';
import { TransferRequest } from './useTransferRequest';
import '../thirdPillar/ThirdPillarPayment/Payment.scss';

const GUIDE_HEADING_ID = 'insurer-guide-heading';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const CopyRequestStep = ({ request }: { request: TransferRequest }) => (
  <>
    <PaymentStep number={1}>
      <FormattedMessage id="insuranceTransfer.guide.copy" />
    </PaymentStep>
    <div
      className={`mt-2 p-3 p-md-4 rounded bg-blue-2 text-pretty ${PII_CLASS}`}
      style={{ whiteSpace: 'pre-line' }}
    >
      {request.text}
    </div>
    <div className="mt-3 mb-3">
      <CopyButton textToCopy={request.text}>
        <FormattedMessage id="global.copy" />
      </CopyButton>
    </div>
  </>
);

const PensionAccountNumberToCopy = ({ pensionAccountNumber }: { pensionAccountNumber: string }) => (
  <div className="mt-2 mb-3 p-3 rounded bg-blue-2 d-flex flex-wrap align-items-center justify-content-between gap-3">
    <span className={`fw-semibold ${PII_CLASS}`}>{pensionAccountNumber}</span>
    <CopyButton textToCopy={pensionAccountNumber}>
      <FormattedMessage id="global.copy" />
    </CopyButton>
  </div>
);

export const InsurerGuide = ({
  insurer,
  request,
  pensionAccountNumber,
}: {
  insurer: GuidedInsurerCode;
  request: TransferRequest;
  pensionAccountNumber: string | null;
}) => {
  const { writesLetter, noteMessageId, steps } = guides[insurer];
  const firstStepNumber = writesLetter ? 2 : 1;
  const stepValues = { b: bold, known: pensionAccountNumber ? 'yes' : 'no' };

  return (
    <section className="p-4 mt-5 payment-details" aria-labelledby={GUIDE_HEADING_ID}>
      <h3 id={GUIDE_HEADING_ID} className="h5 mb-3">
        {insurers[insurer].name}
      </h3>
      {noteMessageId && (
        <p className="mb-3 text-body-secondary text-pretty">
          <FormattedMessage id={noteMessageId} />
        </p>
      )}
      {writesLetter && <CopyRequestStep request={request} />}
      {steps.map(({ messageId, showsPensionAccountNumber }, index) => (
        <Fragment key={messageId}>
          <PaymentStep number={index + firstStepNumber}>
            <FormattedMessage id={messageId} values={stepValues} />
          </PaymentStep>
          {showsPensionAccountNumber && pensionAccountNumber && (
            <PensionAccountNumberToCopy pensionAccountNumber={pensionAccountNumber} />
          )}
        </Fragment>
      ))}
    </section>
  );
};

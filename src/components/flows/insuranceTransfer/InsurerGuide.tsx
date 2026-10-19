import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../common/PaymentStep/PaymentStep';
import { CopyButton } from '../../common/CopyButton';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { GuidedInsurerCode, guides, insurers } from './insurers';
import { TransferRequest } from './useTransferRequest';
import '../thirdPillar/ThirdPillarPayment/Payment.scss';

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
        <FormattedMessage id="insuranceTransfer.guide.copyButton" />
      </CopyButton>
    </div>
  </>
);

const PensionAccountNumberToCopy = ({ pensionAccountNumber }: { pensionAccountNumber: string }) => (
  <div className="mt-1 d-flex align-items-center column-gap-2">
    <b className={`text-break ${PII_CLASS}`}>{pensionAccountNumber}</b>
    <CopyButton textToCopy={pensionAccountNumber} />
  </div>
);

export const InsurerGuide = ({
  insurer,
  request,
  pensionAccountNumber,
}: {
  insurer: GuidedInsurerCode;
  request: TransferRequest;
  pensionAccountNumber: string;
}) => {
  const { writesLetter, steps } = guides[insurer];
  const firstStepNumber = writesLetter ? 2 : 1;

  return (
    <section className="p-3 p-sm-4 mt-5 payment-details" aria-label={insurers[insurer].name}>
      {writesLetter && <CopyRequestStep request={request} />}
      {steps.map(({ messageId, showsPensionAccountNumber }, index) => (
        <PaymentStep key={messageId} number={index + firstStepNumber}>
          <FormattedMessage id={messageId} values={{ b: bold }} />
          {showsPensionAccountNumber && (
            <PensionAccountNumberToCopy pensionAccountNumber={pensionAccountNumber} />
          )}
        </PaymentStep>
      ))}
    </section>
  );
};

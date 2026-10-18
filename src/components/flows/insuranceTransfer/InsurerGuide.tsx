import { ReactNode } from 'react';
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

export const InsurerGuide = ({
  insurer,
  request,
}: {
  insurer: GuidedInsurerCode;
  request: TransferRequest;
}) => (
  <section className="p-4 mt-5 payment-details" aria-labelledby={GUIDE_HEADING_ID}>
    <h3 id={GUIDE_HEADING_ID} className="h5 mb-3">
      {insurers[insurer].name}
    </h3>
    <CopyRequestStep request={request} />
    {guides[insurer].stepMessageIds.map((messageId, index) => (
      <PaymentStep key={messageId} number={index + 2}>
        <FormattedMessage id={messageId} values={{ b: bold }} />
      </PaymentStep>
    ))}
  </section>
);

import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStep } from '../common/PaymentStep/PaymentStep';
import { CopyButton } from '../../common/CopyButton';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { InsurerCode, insurers } from './insurers';
import { TransferRequest } from './useTransferRequest';
import '../thirdPillar/ThirdPillarPayment/Payment.scss';

const GUIDE_HEADING_ID = 'insurer-guide-heading';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const subjectOnlyMailto = (email: string, subject: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}`;

const SignedRequestByEmail = ({
  email,
  subject,
  onSend,
}: {
  email: string;
  subject: string;
  onSend: () => void;
}) => (
  <p className="small text-body-secondary mt-3 mb-0">
    <FormattedMessage
      id="insuranceTransfer.guide.signedEmail"
      values={{
        email: (
          <a className="text-break" href={subjectOnlyMailto(email, subject)} onClick={onSend}>
            {email}
          </a>
        ),
      }}
    />
  </p>
);

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
  onSend,
}: {
  insurer: InsurerCode;
  request: TransferRequest;
  onSend: () => void;
}) => {
  const { name, stepMessageIds, signedRequestEmail } = insurers[insurer];
  return (
    <section className="p-4 mt-5 payment-details" aria-labelledby={GUIDE_HEADING_ID}>
      <h3 id={GUIDE_HEADING_ID} className="h5 mb-3">
        {name}
      </h3>
      <CopyRequestStep request={request} />
      {stepMessageIds.map((messageId, index) => (
        <PaymentStep key={messageId} number={index + 2}>
          <FormattedMessage id={messageId} values={{ b: bold }} />
        </PaymentStep>
      ))}
      {signedRequestEmail && (
        <SignedRequestByEmail
          email={signedRequestEmail}
          subject={request.subject}
          onSend={onSend}
        />
      )}
    </section>
  );
};

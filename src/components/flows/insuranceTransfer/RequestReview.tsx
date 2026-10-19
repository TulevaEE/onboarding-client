import { ReactNode, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { InsuranceTransferFormInsurer } from '../../common/apiModels/insurance-transfer';
import { formatDateOnWithYear } from '../../common/dateFormatter';
import { TULEVA_3RD_PILLAR_FUND_ISIN } from '../../thirdPillar/initialState';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { insurers } from './insurers';

const REQUEST_HEADING_ID = 'insurance-transfer-request-heading';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const Ending = ({ endDate }: { endDate: string | null }) =>
  endDate ? (
    <FormattedMessage
      id="insuranceTransfer.review.endsOn"
      values={{ date: formatDateOnWithYear(endDate) }}
    />
  ) : (
    <FormattedMessage id="insuranceTransfer.request.endDate.asap" />
  );

export const RequestReview = ({
  insurer,
  policyNumber,
  endDate,
  pensionAccountNumber,
  working,
  onViewAsPdf,
  onSign,
  onEditAnswers,
}: {
  insurer: InsuranceTransferFormInsurer;
  policyNumber: string;
  endDate: string | null;
  pensionAccountNumber: string;
  working: boolean;
  onViewAsPdf: () => void;
  onSign: () => void;
  onEditAnswers: () => void;
}) => {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="text-pretty">
      <p className="my-5 lead">
        <FormattedMessage id="insuranceTransfer.review.lead" />
      </p>

      <section className="card my-3 p-4" aria-labelledby={REQUEST_HEADING_ID}>
        <p className="mb-2 small fw-medium text-primary">{insurers[insurer].name}</p>
        <h2
          id={REQUEST_HEADING_ID}
          ref={heading}
          tabIndex={-1}
          className="h3 fw-semibold text-balance"
        >
          <FormattedMessage id="insuranceTransfer.review.heading" />
        </h2>
        <div className="mt-2">
          <p>
            <FormattedMessage
              id="insuranceTransfer.review.description"
              values={{
                b: bold,
                contractNumber: <span className={PII_CLASS}>{policyNumber}</span>,
                ending: <Ending endDate={endDate} />,
              }}
            />
          </p>
          <p className="mb-0 text-body-secondary">
            <FormattedMessage id="insuranceTransfer.review.forwarding" />
          </p>
        </div>
      </section>

      <dl className="card p-4 mb-3">
        <div className="d-flex justify-content-between gap-3 mb-3">
          <dt className="fw-normal text-nowrap">
            <FormattedMessage id="insuranceTransfer.review.fund" />:
          </dt>
          <dd className="mb-0 text-end">
            <b>
              <FormattedMessage id={`target.funds.${TULEVA_3RD_PILLAR_FUND_ISIN}.title`} />
            </b>
            <div className="text-body-secondary">{TULEVA_3RD_PILLAR_FUND_ISIN}</div>
          </dd>
        </div>
        <div className="d-flex justify-content-between gap-3">
          <dt className="fw-normal text-nowrap">
            <FormattedMessage id="insuranceTransfer.review.pensionAccount" />:
          </dt>
          <dd className="mb-0 text-end">
            <b className={PII_CLASS}>{pensionAccountNumber}</b>
          </dd>
        </div>
      </dl>

      <button type="button" className="btn btn-link p-0" disabled={working} onClick={onViewAsPdf}>
        <FormattedMessage id="insuranceTransfer.review.viewAsPdf" />
      </button>

      <div className="mt-5 d-flex flex-column flex-sm-row-reverse justify-content-between align-items-sm-center gap-3">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={working}
          onClick={onSign}
        >
          <FormattedMessage id="insuranceTransfer.review.sign" />
        </button>
        <button
          type="button"
          className="btn btn-light btn-lg"
          disabled={working}
          onClick={onEditAnswers}
        >
          <FormattedMessage id="common.back" />
        </button>
      </div>
    </div>
  );
};

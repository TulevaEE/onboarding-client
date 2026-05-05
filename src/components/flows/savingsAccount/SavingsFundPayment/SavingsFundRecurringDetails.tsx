import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';
import { getPaymentLink } from '../../../common/api';
import { PaymentChannel, PaymentLink, PrefilledLink } from '../../../common/apiModels';
import { PaymentDetailRow } from '../../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentDetailRow';
import { CopyButton } from '../../../common/CopyButton';
import { formatAmountForCount, formatAmountForCurrency } from '../../../common/utils';

export type BankKey = 'LHV' | 'COOP' | 'SWEDBANK' | 'SEB' | 'LUMINOR' | 'OTHER';

// PREFILLED — bank link opens the standing-order form with all fields pre-filled;
//             user just reviews.
// LANDING   — bank link lands on the standing-order page; user fills the fields
//             manually using the copy buttons.
// MANUAL    — no bank link; user opens their own bank and fills the fields manually.
type LinkBehavior = 'PREFILLED' | 'LANDING' | 'MANUAL';

const BANK_META: Record<
  BankKey,
  { label: string; channel?: PaymentChannel; linkBehavior: LinkBehavior }
> = {
  LHV: { label: 'LHV', channel: 'LHV', linkBehavior: 'PREFILLED' },
  COOP: { label: 'Coop Pank', channel: 'COOP', linkBehavior: 'PREFILLED' },
  SWEDBANK: { label: 'Swedbank', channel: 'SWEDBANK', linkBehavior: 'PREFILLED' },
  SEB: { label: 'SEB', channel: 'SEB', linkBehavior: 'LANDING' },
  LUMINOR: { label: 'Luminor', channel: 'LUMINOR', linkBehavior: 'LANDING' },
  OTHER: { label: '', linkBehavior: 'MANUAL' },
};

const isSafeBankUrl = (url: string | undefined): url is string =>
  !!url && (url.startsWith('https://') || url.startsWith('http://'));

type Props = {
  bank: BankKey;
  amount: number | undefined;
  personalCode: string;
};

export const SavingsFundRecurringDetails: FC<Props> = ({ bank, amount, personalCode }) => {
  const meta = BANK_META[bank];
  const hasAmount = Number.isFinite(amount) && (amount ?? 0) >= 1;
  const { data, isLoading, isError } = useQuery<PaymentLink>({
    queryKey: ['paymentLink', 'SAVINGS_RECURRING', meta.channel ?? null, amount, personalCode],
    queryFn: () =>
      getPaymentLink({
        type: 'SAVINGS_RECURRING',
        ...(meta.channel ? { paymentChannel: meta.channel } : {}),
        recipientPersonalCode: personalCode,
        ...(hasAmount ? { amount } : {}),
        currency: 'EUR',
      }),
    enabled: !!personalCode,
    retry: false,
  });

  if (isError) {
    return (
      <div className="alert alert-danger" role="alert">
        <FormattedMessage id="savingsFund.payment.linkGenerationError" />
      </div>
    );
  }
  if (isLoading || !data || data.type !== 'PREFILLED') {
    return null;
  }
  const bankUrl = isSafeBankUrl(data.url) ? data.url : undefined;

  return (
    <>
      <div>
        <div className="payment-details savings-recurring-details p-4">
          <h3>
            <FormattedMessage id={`savingsFund.recurring.panel.title.${bank}`} />
          </h3>

          <Step number={1}>
            {meta.linkBehavior === 'MANUAL' ? (
              <FormattedMessage id="savingsFund.recurring.step.openBank.generic" />
            ) : (
              <FormattedMessage
                id="savingsFund.recurring.step.openBank"
                values={{ bank: meta.label }}
              />
            )}
          </Step>

          <Step number={2}>
            {meta.linkBehavior === 'PREFILLED' ? (
              <>
                <FormattedMessage id="savingsFund.recurring.step.review" />
                <div className="mt-3 p-3 p-md-4 payment-details-table">
                  <PaymentDetailRow
                    label={<FormattedMessage id="savingsFund.recurring.copyCard.recipientName" />}
                    value={data.recipientName}
                  />
                  <PaymentDetailRow
                    label={<FormattedMessage id="savingsFund.recurring.copyCard.recipientIban" />}
                    value={data.recipientIban}
                  />
                  <PaymentDetailRow
                    label={<FormattedMessage id="savingsFund.recurring.copyCard.description" />}
                    value={data.description}
                  />
                  {hasAmount && (
                    <PaymentDetailRow
                      label={<FormattedMessage id="savingsFund.recurring.copyCard.amount" />}
                      value={formatAmountForCurrency(Number(data.amount))}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <FormattedMessage id="savingsFund.recurring.step.copyFields" />
                <CopyTable link={data} />
              </>
            )}
          </Step>

          <Step number={3}>
            <FormattedMessage
              id="savingsFund.recurring.step.verify"
              values={{
                b: (chunks: string) => <b>{chunks}</b>,
              }}
            />
          </Step>
        </div>

        <p className="text-secondary small mt-2 mb-0">
          <FormattedMessage
            id="savingsFund.recurring.help"
            values={{
              email: (chunks: string) => (
                <a href={`mailto:${String(chunks)}`} className="text-secondary">
                  {chunks}
                </a>
              ),
              phone: (chunks: string) => (
                <a href={`tel:${String(chunks).replace(/\s/g, '')}`} className="text-secondary">
                  {chunks}
                </a>
              ),
            }}
          />
        </p>
      </div>

      <div className="d-flex justify-content-between border-top pt-4">
        <Link to="/account" className="btn btn-outline-primary">
          <FormattedMessage id="savingsFund.payment.form.cancel.label" />
        </Link>
        {meta.linkBehavior !== 'MANUAL' && bankUrl && (
          <a
            href={bankUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-nowrap"
          >
            <FormattedMessage id="savingsFund.payment.form.submit.label" />
          </a>
        )}
      </div>
    </>
  );
};

const Step: FC<{ number: number; children: React.ReactNode }> = ({ number, children }) => (
  <div className="d-flex py-2">
    <span className="flex-shrink-0 tv-step__number me-3">
      <b>{number}</b>
    </span>
    <div className="flex-grow-1 align-self-center">{children}</div>
  </div>
);

const CopyTable: FC<{ link: PrefilledLink }> = ({ link }) => {
  const numericAmount = Number(link.amount);
  const hasAmount = Number.isFinite(numericAmount) && numericAmount >= 1;
  const rows: { labelId: TranslationKey; value: string; copyValue?: string }[] = [
    { labelId: 'savingsFund.recurring.copyCard.recipientName', value: link.recipientName },
    { labelId: 'savingsFund.recurring.copyCard.recipientIban', value: link.recipientIban },
    { labelId: 'savingsFund.recurring.copyCard.description', value: link.description },
    ...(hasAmount
      ? [
          {
            labelId: 'savingsFund.recurring.copyCard.amount' as TranslationKey,
            value: formatAmountForCurrency(numericAmount),
            copyValue: formatAmountForCount(numericAmount).replace(/\s+/g, ''),
          },
        ]
      : []),
  ];
  return (
    <div className="mt-3 p-3 p-md-4 payment-details-table copy-table">
      {rows.map((row) => (
        <CopyRow
          key={row.labelId}
          labelId={row.labelId}
          value={row.value}
          copyValue={row.copyValue}
        />
      ))}
    </div>
  );
};

type TranslationKey = Parameters<typeof FormattedMessage>[0]['id'];

const CopyRow: FC<{ labelId: TranslationKey; value: string; copyValue?: string }> = ({
  labelId,
  value,
  copyValue,
}) => (
  <div className="row gx-md-4 gy-1 align-items-md-baseline mb-2">
    <div className="col-12 col-md-4">
      <FormattedMessage id={labelId} />:
    </div>
    <div className="col d-flex justify-content-between align-items-center column-gap-2 text-break">
      <b>{value}</b>
      <CopyButton textToCopy={copyValue ?? value} />
    </div>
  </div>
);

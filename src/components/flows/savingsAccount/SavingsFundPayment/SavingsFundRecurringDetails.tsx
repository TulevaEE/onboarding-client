import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';
import { getPaymentLink } from '../../../common/api';
import { PaymentChannel, PaymentLink, PrefilledLink } from '../../../common/apiModels';
import { PaymentDetailRow } from '../../thirdPillar/ThirdPillarPayment/paymentDetails/row/PaymentDetailRow';
import './SavingsFundRecurring.scss';

export type BankKey = 'LHV' | 'COOP' | 'SWEDBANK' | 'SEB' | 'LUMINOR' | 'OTHER';
type PanelType = 'A' | 'B' | 'C';

const BANK_META: Record<BankKey, { label: string; channel?: PaymentChannel; panel: PanelType }> = {
  LHV: { label: 'LHV', channel: 'LHV', panel: 'A' },
  COOP: { label: 'Coop Pank', channel: 'COOP', panel: 'A' },
  SWEDBANK: { label: 'Swedbank', channel: 'SWEDBANK', panel: 'A' },
  SEB: { label: 'SEB', channel: 'SEB', panel: 'B' },
  LUMINOR: { label: 'Luminor', channel: 'LUMINOR', panel: 'B' },
  OTHER: { label: '', panel: 'C' },
};

const INVEST_ACCOUNT_URL =
  'https://tuleva.ee/soovitused/miks-kasutada-kogumisfondi-puhul-investeerimiskontot/';
const GUIDE_URL = 'https://tuleva.ee/kogumisfondi-sissemaksed/';

const isSafeBankUrl = (url: string | undefined): url is string =>
  !!url && (url.startsWith('https://') || url.startsWith('http://'));

type Props = {
  bank: BankKey;
  amount: number;
  personalCode: string;
};

export const SavingsFundRecurringDetails: FC<Props> = ({ bank, amount, personalCode }) => {
  const meta = BANK_META[bank];
  const { data, isLoading, isError } = useQuery<PaymentLink>({
    queryKey: ['paymentLink', 'SAVINGS_RECURRING', meta.channel ?? null, amount, personalCode],
    queryFn: () =>
      getPaymentLink({
        type: 'SAVINGS_RECURRING',
        ...(meta.channel ? { paymentChannel: meta.channel } : {}),
        recipientPersonalCode: personalCode,
        amount,
        currency: 'EUR',
      }),
    enabled: Number.isFinite(amount) && amount >= 1 && !!personalCode,
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
      <div className="mt-4 payment-details savings-recurring-details p-4">
        <h3>
          <FormattedMessage id={`savingsFund.recurring.panel.title.${bank}`} />
        </h3>

        <Step number={1}>
          {meta.panel === 'C' ? (
            <FormattedMessage id="savingsFund.recurring.step.openBank.generic" />
          ) : (
            <FormattedMessage
              id="savingsFund.recurring.step.openBank"
              values={{ bank: meta.label }}
            />
          )}
        </Step>

        <Step number={2}>
          {meta.panel === 'A' ? (
            <>
              <strong>
                <FormattedMessage id="savingsFund.recurring.step.review" />
              </strong>
              <div className="mt-3 p-4 payment-details-table">
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
                <PaymentDetailRow
                  label={<FormattedMessage id="savingsFund.recurring.copyCard.amount" />}
                  value={`${data.amount} €`}
                />
              </div>
            </>
          ) : (
            <>
              <strong>
                <FormattedMessage id="savingsFund.recurring.step.copyFields" />
              </strong>
              <CopyTable link={data} />
            </>
          )}
        </Step>

        <Step number={3}>
          <strong>
            <FormattedMessage id="savingsFund.recurring.step.verify" />
          </strong>
          <CheckList>
            <CheckItem>
              <FormattedMessage
                id="savingsFund.recurring.check.investAccount"
                values={{
                  link: (chunks: string | JSX.Element) => (
                    <a href={INVEST_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
                      {chunks}
                    </a>
                  ),
                }}
              />
            </CheckItem>
            <CheckItem>
              <FormattedMessage id="savingsFund.recurring.check.frequency" />
            </CheckItem>
          </CheckList>
        </Step>

        <Step number={4}>
          <strong>
            <FormattedMessage id="savingsFund.recurring.step.confirm" />
          </strong>
        </Step>
      </div>

      {meta.panel !== 'C' && bankUrl && (
        <div className="mt-4">
          <a
            href={bankUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-primary text-nowrap"
          >
            <FormattedMessage id="savingsFund.recurring.button.openBank" />
          </a>
        </div>
      )}

      <p className="text-secondary small mt-4 mb-0">
        <FormattedMessage
          id="savingsFund.recurring.help"
          values={{
            guide: (chunks: string | JSX.Element) => (
              <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">
                {chunks}
              </a>
            ),
            email: (chunks: string | JSX.Element) => (
              <a href={`mailto:${String(chunks)}`}>{chunks}</a>
            ),
            phone: (chunks: string | JSX.Element) => (
              <a href={`tel:${String(chunks).replace(/\s/g, '')}`}>{chunks}</a>
            ),
          }}
        />
      </p>
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

const CheckList: FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="ps-3 mt-2 mb-0">{children}</ul>
);

const CheckItem: FC<{ children: React.ReactNode }> = ({ children }) => <li>{children}</li>;

const CopyTable: FC<{ link: PrefilledLink }> = ({ link }) => {
  const rows: { labelId: TranslationKey; value: string }[] = [
    { labelId: 'savingsFund.recurring.copyCard.recipientName', value: link.recipientName },
    { labelId: 'savingsFund.recurring.copyCard.recipientIban', value: link.recipientIban },
    { labelId: 'savingsFund.recurring.copyCard.description', value: link.description },
    { labelId: 'savingsFund.recurring.copyCard.amount', value: `${link.amount} €` },
  ];
  return (
    <div className="mt-3 p-4 payment-details-table copy-table">
      {rows.map((row) => (
        <CopyRow key={row.labelId} labelId={row.labelId} value={row.value} />
      ))}
    </div>
  );
};

type TranslationKey = Parameters<typeof FormattedMessage>[0]['id'];

const CopyRow: FC<{ labelId: TranslationKey; value: string }> = ({ labelId, value }) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const onCopy = async () => {
    if (!navigator.clipboard?.writeText) {
      setStatus('failed');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('failed');
    }
  };
  const buttonLabelByStatus: Record<typeof status, TranslationKey> = {
    idle: 'savingsFund.recurring.copyCard.copy',
    copied: 'savingsFund.recurring.copyCard.copied',
    failed: 'savingsFund.recurring.copyCard.copyFailed',
  };
  const buttonLabelId = buttonLabelByStatus[status];
  return (
    <div className="row mb-2 copy-row align-items-center">
      <div className="col-12 col-md-4 text-md-end">
        <FormattedMessage id={labelId} />:
      </div>
      <div className="col-8 col-md-6 copy-value">
        <b>{value}</b>
      </div>
      <div className="col-4 col-md-2">
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onCopy}>
          <FormattedMessage id={buttonLabelId} />
        </button>
        <span className="visually-hidden" aria-live="polite">
          {status === 'copied' && <FormattedMessage id="savingsFund.recurring.copyCard.copied" />}
          {status === 'failed' && (
            <FormattedMessage id="savingsFund.recurring.copyCard.copyFailed" />
          )}
        </span>
      </div>
    </div>
  );
};

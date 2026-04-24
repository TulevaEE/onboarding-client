import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormattedMessage } from 'react-intl';
import { getPaymentLink } from '../../../common/api';
import { PaymentChannel, PaymentLink } from '../../../common/apiModels';
import './SavingsFundRecurring.scss';

export type BankKey = 'LHV' | 'COOP' | 'SWEDBANK' | 'SEB' | 'LUMINOR' | 'OTHER';
type PanelType = 'A' | 'B' | 'C';

const BANK_META: Record<BankKey, { label: string; channel: PaymentChannel; panel: PanelType }> = {
  LHV: { label: 'LHV', channel: 'LHV', panel: 'A' },
  COOP: { label: 'Coop Pank', channel: 'COOP', panel: 'A' },
  SWEDBANK: { label: 'Swedbank', channel: 'SWEDBANK', panel: 'A' },
  SEB: { label: 'SEB', channel: 'SEB', panel: 'B' },
  LUMINOR: { label: 'Luminor', channel: 'LUMINOR', panel: 'B' },
  OTHER: { label: '', channel: 'OTHER', panel: 'C' },
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
    queryKey: ['paymentLink', 'SAVINGS_RECURRING', meta.channel, amount, personalCode],
    queryFn: () =>
      getPaymentLink({
        type: 'SAVINGS_RECURRING',
        paymentChannel: meta.channel,
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
  if (isLoading || !data) {
    return null;
  }
  const bankUrl = isSafeBankUrl(data.url) ? data.url : undefined;

  return (
    <div className="recurring-panel d-flex flex-column gap-4">
      <h2 className="panel-title m-0">
        {meta.panel === 'C' ? (
          <FormattedMessage id="savingsFund.recurring.panel.titleC" />
        ) : (
          <FormattedMessage id="savingsFund.recurring.panel.titleA" values={{ bank: meta.label }} />
        )}
      </h2>

      <ol className="step-list list-unstyled d-flex flex-column gap-3 m-0 p-0">
        <Step number={1}>
          {meta.panel === 'A' && (
            <>
              <strong>
                <a
                  href={bankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="outbound-link"
                >
                  <FormattedMessage
                    id="savingsFund.recurring.step.openBank"
                    values={{ bank: meta.label }}
                  />
                </a>
              </strong>
              <div className="text-secondary mt-1 small">
                <FormattedMessage id="savingsFund.recurring.step.openBank.prefillHint" />
              </div>
            </>
          )}
          {meta.panel === 'B' && (
            <strong>
              <a href={bankUrl} target="_blank" rel="noopener noreferrer" className="outbound-link">
                <FormattedMessage
                  id="savingsFund.recurring.step.openBank"
                  values={{ bank: meta.label }}
                />
              </a>
            </strong>
          )}
          {meta.panel === 'C' && (
            <>
              <strong>
                <FormattedMessage id="savingsFund.recurring.step.openBank.generic" />
              </strong>
              <div className="text-secondary mt-1 small">
                <FormattedMessage id="savingsFund.recurring.step.openBank.findHint" />
              </div>
            </>
          )}
        </Step>

        {meta.panel === 'A' ? (
          <Step number={2}>
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
                <FormattedMessage
                  id="savingsFund.recurring.check.recipient"
                  values={{ strong: (chunks: string | JSX.Element) => <strong>{chunks}</strong> }}
                />
              </CheckItem>
              <CheckItem>
                <FormattedMessage id="savingsFund.recurring.check.description" />
              </CheckItem>
              <CheckItem>
                <FormattedMessage id="savingsFund.recurring.check.amount" />
              </CheckItem>
            </CheckList>
          </Step>
        ) : (
          <>
            <Step number={2}>
              <strong>
                <FormattedMessage id="savingsFund.recurring.step.copyFields" />
              </strong>
              <CopyCard link={data} />
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
          </>
        )}

        <Step number={meta.panel === 'A' ? 3 : 4}>
          <strong>
            <FormattedMessage id="savingsFund.recurring.step.confirm" />
          </strong>
        </Step>
      </ol>

      <p className="text-secondary small m-0">
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
    </div>
  );
};

const Step: FC<{ number: number; children: React.ReactNode }> = ({ number, children }) => (
  <li className="d-flex gap-3">
    <span className="tv-step__number">{number}</span>
    <div className="step-body flex-grow-1">{children}</div>
  </li>
);

const CheckList: FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="check-list ps-3 mt-2 mb-0">{children}</ul>
);

const CheckItem: FC<{ children: React.ReactNode }> = ({ children }) => <li>{children}</li>;

const CopyCard: FC<{ link: PaymentLink }> = ({ link }) => {
  const rows: { labelId: TranslationKey; value: string }[] = [
    { labelId: 'savingsFund.recurring.copyCard.recipientName', value: link.recipientName ?? '' },
    { labelId: 'savingsFund.recurring.copyCard.recipientIban', value: link.recipientIban ?? '' },
    { labelId: 'savingsFund.recurring.copyCard.description', value: link.description ?? '' },
    { labelId: 'savingsFund.recurring.copyCard.amount', value: `${link.amount ?? ''} €` },
  ];
  return (
    <div className="copy-card mt-2">
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
    <div className="copy-row d-flex flex-wrap align-items-center gap-2 py-2 border-top">
      <span className="label text-secondary small">
        <FormattedMessage id={labelId} />
      </span>
      <span className="value flex-grow-1">{value}</span>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={onCopy}>
        <FormattedMessage id={buttonLabelId} />
      </button>
      <span className="visually-hidden" aria-live="polite">
        {status === 'copied' && <FormattedMessage id="savingsFund.recurring.copyCard.copied" />}
        {status === 'failed' && <FormattedMessage id="savingsFund.recurring.copyCard.copyFailed" />}
      </span>
    </div>
  );
};

import { FC, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { captureException } from '@sentry/browser';
import { logo } from '../../../common';
import styles from './GiftLink.module.scss';
import { usePageTitle } from '../../../common/usePageTitle';
import { PaymentBankButtons } from '../../thirdPillar/ThirdPillarPayment/PaymentBankButtons';
import { BankKey } from '../../thirdPillar/ThirdPillarPayment/types';
import { CurrencyInput } from '../../../common/input/CurrencyInput';
import { SimpleList, SimpleListItem } from '../../../common/simpleList';
import { Deposit, Defer, Verify } from '../InfoSection/assets';
import { PaymentChannel } from '../../../common/apiModels';
import { GiftBankDetails } from './GiftBankDetails';
import { GiftDisclaimer } from './GiftDisclaimer';
import { startGiftPayment, usePublicGiftLink } from './api/giftLink.api';

const MONTONIO_MAX_AMOUNT = 15000;
const MAX_MESSAGE_LENGTH = 300;

export const PublicGiftPage: FC = () => {
  usePageTitle('giftLink.public.pageTitle');
  const { formatMessage } = useIntl();
  const { token = '' } = useParams<{ token: string }>();
  const { data: giftLink, isLoading, isError, error } = usePublicGiftLink(token);

  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [bank, setBank] = useState<BankKey | 'other' | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return null;
  }

  if (isError || !giftLink) {
    // The backend answers a closed token, a mistyped one and one that never existed identically,
    // so only a 404 means the link is gone. Anything else is ours and the link is probably fine.
    const linkIsGone = (error as { status?: number } | null)?.status === 404;
    return (
      <GiftPageFrame>
        <div className="d-flex flex-column gap-3 text-center">
          <h1 className="m-0">
            <FormattedMessage
              id={
                linkIsGone ? 'giftLink.public.notFound.title' : 'giftLink.public.unavailable.title'
              }
            />
          </h1>
          <p className="m-0 text-body-secondary">
            <FormattedMessage
              id={
                linkIsGone
                  ? 'giftLink.public.notFound.description'
                  : 'giftLink.public.unavailable.description'
              }
            />
          </p>
        </div>
      </GiftPageFrame>
    );
  }

  const payingByHand = bank === 'other' || (amount ?? 0) > MONTONIO_MAX_AMOUNT;
  const canSubmit = !!bank && !payingByHand && (amount ?? 0) >= 1 && !submitting;
  // Only a payment we start ourselves has somewhere to carry a greeting; a bank transfer arrives
  // with nothing to join it to.
  const canCarryAGreeting = !payingByHand;

  const submit = async () => {
    setSubmitError(false);
    setSubmitting(true);
    try {
      const { url } = await startGiftPayment(token, {
        amount: amount as number,
        paymentChannel: bank?.toUpperCase() as PaymentChannel,
        message: message.trim() || undefined,
      });
      window.location.replace(url);
    } catch (e) {
      setSubmitting(false);
      setSubmitError(true);
      captureException(e);
    }
  };

  return (
    <GiftPageFrame>
      <div className="d-flex flex-column gap-5">
        <div className="d-flex flex-column gap-3">
          <h1 className="m-0 text-center">
            <FormattedMessage id="giftLink.public.title" />
          </h1>
          <p className="m-0 text-center fs-3 fw-medium">
            <FormattedMessage
              id="giftLink.public.subtitle"
              values={{ name: giftLink.recipientName }}
            />
          </p>
        </div>

        <div className="pt-4 pb-4 border-top border-bottom d-flex flex-column gap-3">
          <h2 className="m-0 fs-3">
            <FormattedMessage id="giftLink.public.whose.title" />
          </h2>
          <SimpleList>
            <SimpleListItem
              media={<Verify />}
              title={<FormattedMessage id="giftLink.public.whose.invested" />}
            />
            <SimpleListItem
              media={<Deposit />}
              title={<FormattedMessage id="giftLink.public.whose.untilEighteen" />}
            />
            <SimpleListItem
              media={<Defer />}
              title={<FormattedMessage id="giftLink.public.whose.fromEighteen" />}
            />
          </SimpleList>
        </div>

        <div className="form-section d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
            <label htmlFor="gift-amount" className="fs-3 fw-semibold">
              <FormattedMessage id="giftLink.public.amount.label" />
            </label>
            <CurrencyInput id="gift-amount" value={amount} onChange={setAmount} />
          </div>
        </div>

        {canCarryAGreeting && (
          <div className="form-section d-flex flex-column gap-3">
            <label htmlFor="gift-message" className="fs-3 fw-semibold">
              <FormattedMessage id="giftLink.public.message.label" />{' '}
              <span className="fs-6 fw-normal text-body-secondary">
                <FormattedMessage id="giftLink.public.message.optional" />
              </span>
            </label>
            <textarea
              id="gift-message"
              className="form-control"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="m-0 text-body-secondary">
              <FormattedMessage id="giftLink.public.message.whoSees" />
            </p>
          </div>
        )}

        <div
          className="form-section d-flex flex-column gap-3"
          role="group"
          aria-labelledby="gift-bank-label"
        >
          <span className="fs-3 fw-semibold" id="gift-bank-label">
            <FormattedMessage id="giftLink.public.bank.label" />
          </span>
          <PaymentBankButtons paymentBank={bank} setPaymentBank={setBank} />
        </div>

        {payingByHand ? (
          <GiftBankDetails
            amount={amount}
            paymentDescription={giftLink.paymentDescription}
            overMontonioLimit={(amount ?? 0) > MONTONIO_MAX_AMOUNT}
          />
        ) : (
          <div className="border-top pt-4 d-flex flex-column gap-3">
            {submitError && (
              <div className="alert alert-danger" role="alert">
                <FormattedMessage id="giftLink.public.error" />
              </div>
            )}
            <p className="text-body-secondary m-0">
              <FormattedMessage id="giftLink.public.confirmInYourBank" />
            </p>
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-lg btn-primary"
                disabled={!canSubmit}
                onClick={submit}
              >
                {formatMessage({ id: 'giftLink.public.submit' })}
              </button>
            </div>
          </div>
        )}

        <GiftDisclaimer />
      </div>
    </GiftPageFrame>
  );
};

const GiftPageFrame: FC = ({ children }) => (
  <div className={styles.giftPage}>
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
          {children}
        </div>
      </div>
    </div>
  </div>
);

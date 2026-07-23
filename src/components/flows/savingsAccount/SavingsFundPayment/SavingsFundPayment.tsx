import { captureException } from '@sentry/browser';
import { FC, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';
import { redirectToPayment } from '../../../common/api';
import { useMe } from '../../../common/apiHooks';
import { PaymentChannel } from '../../../common/apiModels';
import { usePageTitle } from '../../../common/usePageTitle';
import { PaymentBankButtons } from '../../thirdPillar/ThirdPillarPayment/PaymentBankButtons';
import { BankKey } from '../../thirdPillar/ThirdPillarPayment/types';
import { accountHolderFor } from '../accountHolder';
import { AmountInput } from '../AmountInput';
import { InfoSection } from '../InfoSection';
import { PaymentTypeSelection, SavingsFundPaymentType } from './PaymentTypeSelection';
import { SavingsFundOtherBankDetails } from './SavingsFundOtherBankDetails';
import { SavingsFundRecurringDetails } from './SavingsFundRecurringDetails';

const MONTONIO_MAX_AMOUNT = 15000;
const MIN_RECURRING_AMOUNT = 1;
const RECURRING_BANK_KEYS = ['LHV', 'COOP', 'SWEDBANK', 'SEB', 'LUMINOR', 'OTHER'] as const;
type RecurringBankKey = (typeof RECURRING_BANK_KEYS)[number];
const toRecurringBank = (value: string | undefined): RecurringBankKey | null => {
  const upper = value?.toUpperCase();
  return RECURRING_BANK_KEYS.find((key) => key === upper) ?? null;
};

type IPaymentForm = {
  amount: number | undefined;
  paymentMethod: BankKey | 'other';
};

export const SavingsFundPayment: FC = () => {
  const [submitError, setSubmitError] = useState(false);
  // Landing here from a "set up a standing order" link opens the recurring option,
  // the same way the III pillar payment page does.
  const initialPaymentType: SavingsFundPaymentType =
    new URLSearchParams(useLocation().search).get('type') === 'RECURRING' ? 'RECURRING' : 'SINGLE';
  const [paymentType, setPaymentType] = useState<SavingsFundPaymentType>(initialPaymentType);
  const intl = useIntl();
  const { data: user } = useMe();
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IPaymentForm>({
    defaultValues: {
      amount: undefined,
      paymentMethod: undefined,
    },
  });

  const paymentMethod = watch('paymentMethod');
  const amount = watch('amount');
  const isOtherBank = paymentMethod === 'other';
  const isOverMaxAmount = (amount ?? 0) >= MONTONIO_MAX_AMOUNT;
  const showManualPayment = paymentType === 'SINGLE' && (isOtherBank || isOverMaxAmount);
  const isRecurring = paymentType === 'RECURRING';
  const recurringBank = isRecurring ? toRecurringBank(paymentMethod) : null;
  const hasValidRecurringAmount = Number.isFinite(amount) && (amount ?? 0) >= MIN_RECURRING_AMOUNT;
  usePageTitle('savingsFund.payment.pageTitle');

  if (!user) {
    return null;
  }

  const accountHolder = accountHolderFor(user);
  const isLegalEntity = accountHolder === 'company';

  const handleRedirect = async (data: IPaymentForm) => {
    try {
      setSubmitError(false);
      await redirectToPayment({
        recipientPersonalCode: user.role.code,
        amount: data.amount,
        currency: 'EUR',
        type: 'SAVINGS',
        paymentChannel: data.paymentMethod?.toUpperCase() as PaymentChannel,
      });
    } catch (e) {
      setSubmitError(true);
      captureException(e);
    }
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">
          <FormattedMessage id="savingsFund.payment.title" />
        </h1>
        <p className="m-0 text-center fs-3 fw-medium">
          <FormattedMessage
            id="savingsFund.payment.accountOwner"
            values={{ accountOwner: user.role.name }}
          />
        </p>
      </div>

      <PaymentTypeSelection paymentType={paymentType} setPaymentType={setPaymentType} />

      <div className="pt-4 pb-4 border-top border-bottom">
        <InfoSection variant="payment" accountHolder={accountHolder} />
      </div>

      <form onSubmit={handleSubmit((data) => handleRedirect(data))} method="post">
        <section className="d-flex flex-column gap-5">
          <AmountInput
            control={control}
            name="amount"
            error={errors.amount}
            label={<FormattedMessage id="savingsFund.payment.form.amount.label" />}
            errorMessage={intl.formatMessage({ id: 'savingsFund.payment.form.amount.min' })}
          />

          {(!isOverMaxAmount || isRecurring) && (
            <div className="form-section d-flex flex-column gap-3">
              <div className="d-flex flex-column gap-3">
                <label htmlFor="payment-method" className="fs-3 fw-semibold">
                  <FormattedMessage id="savingsFund.payment.form.paymentMethod.label" />
                </label>
                <Controller
                  control={control}
                  name="paymentMethod"
                  rules={{
                    required: intl.formatMessage({
                      id: 'savingsFund.payment.form.paymentMethod.required',
                    }),
                  }}
                  render={({ field }) => {
                    const selectedBank =
                      (field.value as BankKey | 'other' | null | undefined) ?? null;

                    return (
                      <PaymentBankButtons
                        paymentBank={selectedBank}
                        setPaymentBank={(bank) => {
                          if (!bank) {
                            return;
                          }

                          field.onChange(bank);
                        }}
                        showOther
                      />
                    );
                  }}
                />
              </div>
              {errors.paymentMethod ? (
                <div className="d-block invalid-feedback">{errors.paymentMethod.message}</div>
              ) : null}
            </div>
          )}

          {showManualPayment && (
            <SavingsFundOtherBankDetails
              amount={amount}
              personalCode={user.role.code}
              titleId={
                isOverMaxAmount
                  ? 'savingsFund.payment.manualTransfer.title'
                  : 'savingsFund.payment.otherBank.title'
              }
            />
          )}

          {isRecurring && recurringBank && (!Number.isFinite(amount) || hasValidRecurringAmount) ? (
            <SavingsFundRecurringDetails
              bank={recurringBank}
              amount={amount}
              personalCode={user.role.code}
              isLegalEntity={isLegalEntity}
            />
          ) : null}

          {submitError ? (
            <div className="alert alert-danger" role="alert">
              <FormattedMessage id="savingsFund.payment.linkGenerationError" />
            </div>
          ) : null}

          {showManualPayment && (
            <div className="mt-4 d-flex gap-2 align-items-center border-top pt-4">
              <span>
                <FormattedMessage id="savingsFund.payment.otherBank.paymentQuestion" />
              </span>
              <Link className="icon-link" to="/account">
                <FormattedMessage id="savingsFund.payment.otherBank.backToAccountPage" />
              </Link>
            </div>
          )}

          {!showManualPayment && !isRecurring && (
            <div className="border-top pt-4 d-flex flex-column gap-3">
              {paymentMethod && accountHolder === 'self' ? (
                <p className="text-body-secondary m-0">
                  <FormattedMessage id="savingsFund.payment.investmentAccountReminder" />
                </p>
              ) : null}
              <p className="text-body-secondary m-0">
                <FormattedMessage id="savingsFund.payment.transferLimit" />
              </p>
              <div className="d-flex justify-content-between">
                <Link to="/account" className="btn btn-outline-primary">
                  <FormattedMessage id="savingsFund.payment.form.cancel.label" />
                </Link>

                <button
                  type="submit"
                  className="btn btn-primary btn-loading"
                  disabled={!user.personalCode || isSubmitting}
                >
                  <FormattedMessage id="savingsFund.payment.form.submit.label" />
                </button>
              </div>
            </div>
          )}
        </section>
      </form>
    </div>
  );
};

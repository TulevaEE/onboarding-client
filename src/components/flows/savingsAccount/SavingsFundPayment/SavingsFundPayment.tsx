import { FC, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, useForm } from 'react-hook-form';
import classNames from 'classnames';
import { captureException } from '@sentry/browser';
import styles from './SavingsFundPayment.module.scss';
import { PaymentBankButtons } from '../../thirdPillar/ThirdPillarPayment/PaymentBankButtons';
import { BankKey } from '../../thirdPillar/ThirdPillarPayment/types';
import { InfoSection } from './InfoSection';
import { usePageTitle } from '../../../common/usePageTitle';
import { redirectToPayment } from '../../../common/api';
import { useMe } from '../../../common/apiHooks';
import { PaymentChannel } from '../../../common/apiModels';
import '../../thirdPillar/ThirdPillarPayment/Payment.scss';

type IPaymentForm = {
  amount: number;
  paymentMethod: BankKey;
};

// TODO: redirect away if not eligilbe to see
export const SavingsFundPayment: FC = () => {
  const [submitError, setSubmitError] = useState(false);
  const intl = useIntl();
  const { data: user } = useMe();
  const {
    handleSubmit,
    control,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<IPaymentForm>({
    defaultValues: {
      amount: undefined,
      paymentMethod: undefined,
    },
  });
  usePageTitle('savingsFund.payment.pageTitle');

  const redirectToAccount = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/account';
    }
  };

  if (!user) {
    return null;
  }

  const handleRedirect = async ({ paymentMethod, amount }: IPaymentForm) => {
    try {
      setSubmitError(false);
      await redirectToPayment({
        recipientPersonalCode: user.personalCode,
        amount,
        currency: 'EUR',
        type: 'SAVINGS',
        paymentChannel: paymentMethod?.toUpperCase() as PaymentChannel,
      });
    } catch (e) {
      setSubmitError(true);
      captureException(e);
    }
  };

  const renderErrorMessage = () => {
    if (submitError) {
      return (
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="savingsFund.payment.linkGenerationError" />
        </div>
      );
    }

    return errors.amount?.message || errors.paymentMethod?.message ? (
      <div className="alert alert-danger" role="alert">
        {errors.amount?.message || errors.paymentMethod?.message}
      </div>
    ) : null;
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">
          <FormattedMessage id="savingsFund.payment.title" />
        </h1>
      </div>

      {/* TODO: RadioControl for recurring payments/single payment */}

      <div className="pt-4 pb-4 border-top border-bottom">
        <InfoSection />
      </div>

      {/* eslint-disable-next-line no-console */}
      <form onSubmit={handleSubmit((data) => handleRedirect(data))} method="post">
        <section className={`d-flex flex-column gap-5 ${styles.content}`}>
          <div className="form-section d-flex flex-column gap-3">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
              <label htmlFor="payment-amount" className="fs-3 fw-semibold">
                <FormattedMessage id="savingsFund.payment.form.amount.label" />
              </label>
              <Controller
                control={control}
                name="amount"
                rules={{
                  required: {
                    value: true,
                    message: intl.formatMessage({ id: 'savingsFund.payment.form.amount.min' }),
                  },
                  min: {
                    value: 1,
                    message: intl.formatMessage({ id: 'savingsFund.payment.form.amount.min' }),
                  },
                  validate: {
                    validateNumber: (value) => !Number.isNaN(Number(value)),
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    {/* TODO: Consider extracting to a AmountInput component */}
                    <div className={`input-group input-group-lg ${styles.inputGroup}`}>
                      <input
                        type="text"
                        id="payment-amount"
                        placeholder="0"
                        inputMode="decimal"
                        className={classNames(`form-control form-control-lg fw-semibold`, {
                          'border-danger focus-ring focus-ring-danger': !!error,
                        })}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.replace(',', '.'));
                        }}
                      />
                      <span className="input-group-text fw-semibold">&euro;</span>
                    </div>
                  </>
                )}
              />
            </div>
          </div>

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
                  const selectedBank = (field.value as BankKey | null | undefined) ?? null;

                  return (
                    <PaymentBankButtons
                      paymentBank={selectedBank}
                      setPaymentBank={(bank) => {
                        if (!bank || bank === 'other') {
                          return;
                        }

                        field.onChange(bank);
                      }}
                      showOther={false}
                    />
                  );
                }}
              />
            </div>
          </div>

          {renderErrorMessage()}

          <div className="d-flex justify-content-between border-top">
            <button
              type="button"
              className="btn btn-outline-primary btn-lg mt-4"
              onClick={() => {
                redirectToAccount();
              }}
            >
              <FormattedMessage id="savingsFund.payment.form.cancel.label" />
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg mt-4 btn-loading"
              disabled={(!isDirty && !isValid) || !user.personalCode || isSubmitting}
            >
              <FormattedMessage id="savingsFund.payment.form.submit.label" />
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, useForm } from 'react-hook-form';
import classNames from 'classnames';
import styles from './SavingsFundPayment.module.scss';
import { PaymentBanksRadios } from './PaymentBanksRadios';
import { BankKey } from '../../thirdPillar/ThirdPillarPayment/types';
import { InfoSection } from './InfoSection';
import { usePageTitle } from '../../../common/usePageTitle';

type IPaymentForm = {
  amount: number;
  paymentMethod: BankKey;
};

// TODO: redirect away if not eligilbe to see
export const SavingsFundPayment: FC = () => {
  const intl = useIntl();
  const {
    handleSubmit,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<IPaymentForm>({
    defaultValues: {
      amount: undefined,
      paymentMethod: undefined,
    },
  });

  usePageTitle('savingsFund.payment.pageTitle');

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
      <form onSubmit={handleSubmit((data) => console.log(data))} method="post">
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
                    message: intl.formatMessage({ id: 'savingsFund.payment.form.amount.required' }),
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
                    {/* TODO: Extract into input component */}
                    <div className={`input-group input-group-lg ${styles.inputGroup}`}>
                      <input
                        type="number"
                        className={classNames(`form-control form-control-lg fw-semibold`, {
                          'border-danger focus-ring focus-ring-danger': !!error,
                        })}
                        id="payment-amount"
                        placeholder="0"
                        inputMode="decimal"
                        {...field}
                      />
                      <span className="input-group-text fw-semibold">&euro;</span>
                    </div>
                  </>
                )}
              />
            </div>
          </div>

          <div className="form-section d-flex flex-column gap-3">
            <div className="d-flex flex-column justify-content-between align-items-start gap-3 row-gap-2">
              <label htmlFor="payment-method" className="fs-3 fw-semibold">
                <FormattedMessage id="savingsFund.payment.form.paymentMethod.label" />
              </label>
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field: { onChange, value } }) => (
                  <PaymentBanksRadios selected={value} onSelect={onChange} />
                )}
              />
            </div>
          </div>

          {errors.amount?.message ? (
            <div className="alert alert-danger" role="alert">
              {errors.amount.message}
            </div>
          ) : null}

          <div className="d-flex justify-content-between border-top">
            <button
              type="button"
              className="btn btn-outline-primary btn-lg mt-4"
              onClick={() => {
                // TODO: back to account page
              }}
            >
              <FormattedMessage id="savingsFund.payment.form.cancel.label" />
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg mt-4"
              disabled={!isDirty && !isValid}
            >
              <FormattedMessage id="savingsFund.payment.form.submit.label" />
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

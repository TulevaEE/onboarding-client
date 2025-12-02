import { captureException } from '@sentry/browser';
import { FC, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { redirectToPayment } from '../../../common/api';
import { useMe } from '../../../common/apiHooks';
import { PaymentChannel } from '../../../common/apiModels';
import { usePageTitle } from '../../../common/usePageTitle';
import { PaymentBankButtons } from '../../thirdPillar/ThirdPillarPayment/PaymentBankButtons';
import { BankKey } from '../../thirdPillar/ThirdPillarPayment/types';
import { AmountInput } from '../AmountInput';
import { InfoSection } from '../InfoSection';

type IPaymentForm = {
  amount: number | undefined;
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
    formState: { errors, isSubmitting },
  } = useForm<IPaymentForm>({
    defaultValues: {
      amount: undefined,
      paymentMethod: undefined,
    },
  });
  usePageTitle('savingsFund.payment.pageTitle');

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

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">
          <FormattedMessage id="savingsFund.payment.title" />
        </h1>
      </div>

      {/* TODO: RadioControl for recurring payments/single payment */}

      <div className="pt-4 pb-4 border-top border-bottom">
        <InfoSection variant="payment" />
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
            {errors.paymentMethod ? (
              <div className="d-block invalid-feedback">{errors.paymentMethod.message}</div>
            ) : null}
          </div>

          {submitError ? (
            <div className="alert alert-danger" role="alert">
              <FormattedMessage id="savingsFund.payment.linkGenerationError" />
            </div>
          ) : null}

          <div className="d-flex justify-content-between border-top">
            <Link to="/account" className="btn btn-outline-primary btn-lg mt-4">
              <FormattedMessage id="savingsFund.payment.form.cancel.label" />
            </Link>

            <button
              type="submit"
              className="btn btn-primary btn-lg mt-4 btn-loading"
              disabled={!user.personalCode || isSubmitting}
            >
              <FormattedMessage id="savingsFund.payment.form.submit.label" />
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

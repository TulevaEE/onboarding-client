import { captureException } from '@sentry/browser';
import classNames from 'classnames';
import { FC, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';
import { createSavingsFundWithdrawal } from '../../../common/api';
import { useSavingsFundBalance, useSavingsFundBankAccounts } from '../../../common/apiHooks';
import { getBankName } from '../../../common/iban';
import { usePageTitle } from '../../../common/usePageTitle';
import { formatAmountForCurrency } from '../../../common/utils';
import Slider from '../../withdrawals/Slider';
import { AmountInput } from '../AmountInput';
import { InfoSection } from '../InfoSection';
import Card from '../../../common/card';
import { Euro } from '../../../common/Euro';

const parseAmount = (value: string | number | undefined): number => {
  if (!value) {
    return 0;
  }
  const stringValue = String(value).replace(',', '.');
  const parsed = Number(stringValue);
  return Number.isNaN(parsed) ? 0 : parsed;
};

type IWithdrawalForm = {
  amount: number | undefined;
  iban: string;
};

export const SavingsFundWithdraw: FC = () => {
  const [submitError, setSubmitError] = useState(false);
  const [currentStep, setCurrentStep] = useState<'INPUT' | 'REVIEW'>('INPUT');
  const intl = useIntl();
  const history = useHistory();
  const { data: savingsFundBalance } = useSavingsFundBalance();
  const { data: bankAccounts } = useSavingsFundBankAccounts();
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<IWithdrawalForm>({
    mode: 'onChange',
    defaultValues: {
      amount: undefined,
      iban: '',
    },
  });
  const selectedBankAccount = watch('iban');
  const selectedAmount = watch('amount');

  useEffect(() => {
    if (bankAccounts && bankAccounts.length === 1) {
      setValue('iban', bankAccounts[0]);
    }
  }, [bankAccounts, setValue]);

  usePageTitle('savingsFund.withdraw.pageTitle');

  const handleWithdraw = async ({ iban, amount }: IWithdrawalForm) => {
    try {
      setSubmitError(false);
      await createSavingsFundWithdrawal({
        amount: parseAmount(amount),
        currency: 'EUR',
        iban,
      });
      history.push('/savings-fund/withdraw/success');
    } catch (e) {
      setSubmitError(true);
      captureException(e);
    }
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">
          <FormattedMessage id="savingsFund.withdraw.title" />
        </h1>
      </div>

      {currentStep === 'INPUT' ? (
        <div className="pt-4 pb-4 border-top border-bottom">
          <InfoSection variant="withdraw" />
        </div>
      ) : null}

      <form onSubmit={handleSubmit(handleWithdraw)} method="post">
        {currentStep === 'INPUT' ? (
          <section className="d-flex flex-column gap-5">
            <div className="d-flex flex-column gap-3">
              <AmountInput
                control={control}
                name="amount"
                error={errors.amount}
                label={<FormattedMessage id="savingsFund.withdraw.form.amount.label" />}
                errorMessage={intl.formatMessage({ id: 'savingsFund.withdraw.form.amount.min' })}
                max={savingsFundBalance?.price}
              />
              {savingsFundBalance && (
                <div className="d-flex flex-column">
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                      <Slider
                        value={parseAmount(field.value)}
                        onChange={field.onChange}
                        min={0}
                        max={savingsFundBalance.price}
                        step={0.01}
                        color="RED"
                        ariaLabelledBy="amount"
                      />
                    )}
                  />
                  <div className="mt-2 d-flex justify-content-between">
                    <div className="text-body-secondary">{formatAmountForCurrency(0, 0)}</div>
                    <div className="text-body-secondary">
                      {formatAmountForCurrency(savingsFundBalance.price, 2)}
                    </div>
                  </div>
                </div>
              )}
              <p className="m-0 text-secondary">
                <FormattedMessage id="savingsFund.withdraw.form.amount.description" />
              </p>
            </div>

            <div className="form-section d-flex flex-column gap-3">
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <label htmlFor="bank-account" className="fs-3 fw-semibold">
                    <FormattedMessage id="savingsFund.withdraw.form.iban.label" />
                  </label>
                  <p className="m-0 text-secondary align-self-center">
                    {getBankName(selectedBankAccount)}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="iban"
                  rules={{
                    required: intl.formatMessage({
                      id: 'savingsFund.withdraw.form.iban.required',
                    }),
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <select
                      id="bank-account"
                      className={classNames('form-select form-select-lg', {
                        'border-danger focus-ring focus-ring-danger': !!error,
                      })}
                      {...field}
                    >
                      <option value="">
                        {intl.formatMessage({
                          id: 'savingsFund.withdraw.form.iban.placeholder',
                        })}
                      </option>
                      {bankAccounts?.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              {errors.iban ? (
                <div className="d-block invalid-feedback">{errors.iban.message}</div>
              ) : null}
              <p className="m-0 text-secondary">
                <FormattedMessage id="savingsFund.withdraw.form.iban.description" />
              </p>
            </div>

            <div className="d-flex justify-content-between border-top">
              <Link to="/account" className="btn btn-outline-primary btn-lg mt-4">
                <FormattedMessage id="savingsFund.withdraw.form.back.label" />
              </Link>

              <button
                type="button"
                className="btn btn-primary btn-lg mt-4 btn-loading"
                onClick={async () => {
                  const isValid = await trigger();
                  if (isValid) {
                    setCurrentStep('REVIEW');
                  }
                }}
              >
                <FormattedMessage id="savingsFund.withdraw.form.continue.label" />
              </button>
            </div>
          </section>
        ) : null}

        {currentStep === 'REVIEW' ? (
          <>
            <Card
              title={
                <FormattedMessage
                  id="savingsFund.withdraw.confirmation.card.title"
                  // We have validation rules on amount input, so selectedAmount is guaranteed to be defined here
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  values={{ amount: <Euro amount={selectedAmount!} /> }}
                />
              }
              description={
                <FormattedMessage id="savingsFund.withdraw.confirmation.card.description" />
              }
            />

            {submitError ? (
              <div className="alert alert-danger" role="alert">
                <FormattedMessage id="savingsFund.withdraw.error" />
              </div>
            ) : null}

            <div className="d-flex justify-content-between border-top mt-5">
              <button
                type="button"
                className="btn btn-outline-primary btn-lg mt-4"
                onClick={() => setCurrentStep('INPUT')}
              >
                <FormattedMessage id="savingsFund.withdraw.form.back.label" />
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-lg mt-4 btn-loading"
                disabled={isSubmitting}
              >
                <FormattedMessage id="savingsFund.withdraw.form.confirm.label" />
              </button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
};

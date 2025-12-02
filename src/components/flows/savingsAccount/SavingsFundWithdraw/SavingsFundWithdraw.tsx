import { captureException } from '@sentry/browser';
import classNames from 'classnames';
import { FC, useState } from 'react';
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

const parseAmount = (value: string | number | undefined): number => {
  if (!value) {
    return 0;
  }
  const stringValue = String(value).replace(',', '.');
  const parsed = Number(stringValue);
  return Number.isNaN(parsed) ? 0 : parsed;
};

type IWithdrawalForm = {
  amount: string;
  iban: string;
};

export const SavingsFundWithdraw: FC = () => {
  const [submitError, setSubmitError] = useState(false);
  const intl = useIntl();
  const history = useHistory();
  const { data: savingsFundBalance } = useSavingsFundBalance();
  const { data: bankAccounts } = useSavingsFundBankAccounts();
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IWithdrawalForm>({
    defaultValues: {
      amount: '',
      iban: '',
    },
  });
  const selectedBankAccount = watch('iban');

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

      <div className="pt-4 pb-4 border-top border-bottom">
        <InfoSection variant="withdraw" />
      </div>

      <form onSubmit={handleSubmit(handleWithdraw)} method="post">
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
                      onChange={(value) => field.onChange(value.toFixed(2))}
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

          {submitError ? (
            <div className="alert alert-danger" role="alert">
              <FormattedMessage id="savingsFund.withdraw.error" />
            </div>
          ) : null}

          <div className="d-flex justify-content-between border-top">
            <Link to="/account" className="btn btn-outline-primary btn-lg mt-4">
              <FormattedMessage id="savingsFund.withdraw.form.cancel.label" />
            </Link>

            <button
              type="submit"
              className="btn btn-primary btn-lg mt-4 btn-loading"
              disabled={isSubmitting}
            >
              <FormattedMessage id="savingsFund.withdraw.form.submit.label" />
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

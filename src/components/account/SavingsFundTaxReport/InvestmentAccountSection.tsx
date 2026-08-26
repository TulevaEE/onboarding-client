import React, { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDeclareInvestmentAccount, useInvestmentAccount } from './api/investmentAccount.api';

const ERROR_ID = 'investment-account-error';

const isRejectedAccountNumber = (error: unknown): boolean => {
  const body = (error as { body?: { errors?: { path?: string }[] } })?.body;
  return body?.errors?.some((one) => one.path === 'iban') ?? false;
};

export const InvestmentAccountSection: React.FunctionComponent = () => {
  const { data: investmentAccount, isError, refetch } = useInvestmentAccount();
  const declareInvestmentAccount = useDeclareInvestmentAccount();

  const [typed, setTyped] = useState<string | null>(null);
  const declaring = useRef(false);

  const declaredIban = investmentAccount?.iban ?? '';
  const value = typed ?? declaredIban;
  const rejectedAccountNumber =
    declareInvestmentAccount.isError && isRejectedAccountNumber(declareInvestmentAccount.error);

  return (
    <div className="card p-4 mb-3">
      <h2 className="h6 mb-2">
        <FormattedMessage id="savingsFundTaxReport.investmentAccount.heading" />
      </h2>
      <p className="text-body-secondary small">
        <FormattedMessage id="savingsFundTaxReport.investmentAccount.explainer" />
      </p>

      {isError ? (
        <div
          role="alert"
          className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between mb-0"
        >
          <span>
            <FormattedMessage id="savingsFundTaxReport.investmentAccount.unavailable" />
          </span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            <FormattedMessage id="savingsFundTaxReport.investmentAccount.retry" />
          </button>
        </div>
      ) : (
        <form
          className="d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const iban = value.trim();
            if (!iban || declaring.current) {
              return;
            }
            declaring.current = true;
            declareInvestmentAccount.mutate(iban, {
              onSuccess: () => setTyped(null),
              onSettled: () => {
                declaring.current = false;
              },
            });
          }}
        >
          <div>
            <label className="form-label small mb-1" htmlFor="investment-account-iban">
              <FormattedMessage id="savingsFundTaxReport.investmentAccount.label" />
            </label>
            <input
              id="investment-account-iban"
              className="form-control form-control-sm"
              value={value}
              aria-invalid={rejectedAccountNumber || undefined}
              aria-describedby={declareInvestmentAccount.isError ? ERROR_ID : undefined}
              onChange={(event) => {
                setTyped(event.target.value);
                declareInvestmentAccount.reset();
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={declareInvestmentAccount.isLoading}
          >
            <FormattedMessage id="savingsFundTaxReport.investmentAccount.save" />
          </button>
        </form>
      )}

      {declareInvestmentAccount.isError && (
        <div id={ERROR_ID} role="alert" className="alert alert-danger mt-3 mb-0">
          <FormattedMessage
            id={
              rejectedAccountNumber
                ? 'savingsFundTaxReport.investmentAccount.invalid'
                : 'savingsFundTaxReport.investmentAccount.saveFailed'
            }
          />
        </div>
      )}
    </div>
  );
};

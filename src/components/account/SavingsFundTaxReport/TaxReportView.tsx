import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Euro } from '../../common/Euro';
import { CostBasisMethod, SavingsFundTaxReport } from '../../common/apiModels';
import { MethodSelector } from './MethodSelector';
import { YearSelector } from './YearSelector';

export const TaxReportView: React.FunctionComponent<{
  report: SavingsFundTaxReport;
  taxYears: number[];
  year: number;
  method: CostBasisMethod;
  detailsOpen: boolean;
  onYearChange: (year: number) => void;
  onMethodChange: (method: CostBasisMethod) => void;
  onDetailsToggle: () => void;
}> = ({
  report,
  taxYears,
  year,
  method,
  detailsOpen,
  onYearChange,
  onMethodChange,
  onDetailsToggle,
}) => {
  const gains = report.redemptions;
  const total = report.totalGain;

  return (
    <>
      <div className="card p-4 mb-3">
        <YearSelector taxYears={taxYears} year={year} onYearChange={onYearChange} />
      </div>

      <div className="card p-4 mb-3">
        <h2 className="h6 text-body-secondary mb-2">
          <FormattedMessage id="savingsFund.statement.tax.heading" values={{ year }} />
        </h2>

        {gains.length === 0 ? (
          <>
            <div className="h3 fw-medium text-navy">
              <FormattedMessage id="savingsFund.statement.tax.nothing" />
            </div>
            <p className="mt-2 mb-0">
              <FormattedMessage id="savingsFund.statement.tax.nothingLead" />
            </p>
          </>
        ) : (
          <>
            <div className="h3 fw-medium text-navy">
              {total >= 0 ? (
                <FormattedMessage
                  id="savingsFund.statement.tax.gain"
                  values={{ amount: <Euro amount={total} className="text-success" /> }}
                />
              ) : (
                <FormattedMessage
                  id="savingsFund.statement.tax.loss"
                  values={{ amount: <Euro amount={Math.abs(total)} className="text-danger" /> }}
                />
              )}
            </div>
            <p className="mt-2 mb-0">
              <FormattedMessage id="savingsFund.statement.tax.lead" />
            </p>
          </>
        )}

        <div className="alert alert-warning mt-3 mb-0">
          <FormattedMessage id="savingsFund.statement.tax.investmentAccount" />
        </div>
      </div>

      <button type="button" className="btn btn-link p-0 mb-3" onClick={onDetailsToggle}>
        <FormattedMessage
          id={
            detailsOpen ? 'savingsFund.statement.hideDetails' : 'savingsFund.statement.showDetails'
          }
        />
      </button>

      {detailsOpen && (
        <div className="card p-4 mb-3">
          <h2 className="h6 text-body-secondary mb-3">
            <FormattedMessage id="savingsFund.statement.tax.detailsHeading" />
          </h2>

          <div className="mb-3">
            <MethodSelector method={method} onMethodChange={onMethodChange} />
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th scope="col">
                    <FormattedMessage id="savingsFund.statement.tax.tableDate" />
                  </th>
                  <th scope="col" className="text-end">
                    <FormattedMessage id="savingsFund.statement.tax.tableUnits" />
                  </th>
                  <th scope="col" className="text-end">
                    <FormattedMessage id="savingsFund.statement.tax.tableCost" />
                  </th>
                  <th scope="col" className="text-end">
                    <FormattedMessage id="savingsFund.statement.tax.tableProceeds" />
                  </th>
                  <th scope="col" className="text-end">
                    <FormattedMessage id="savingsFund.statement.tax.tableGain" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {gains.length ? (
                  gains.map((gain) => (
                    <tr key={gain.time}>
                      <td>{moment(gain.time).format('DD.MM.YYYY')}</td>
                      <td className="text-end">{gain.units.toFixed(3)}</td>
                      <td className="text-end">
                        <Euro amount={gain.acquisitionCost} />
                      </td>
                      <td className="text-end">
                        <Euro amount={gain.proceeds} />
                      </td>
                      <td className={`text-end ${gain.gain >= 0 ? 'text-success' : 'text-danger'}`}>
                        <Euro amount={gain.gain} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-body-secondary">
                      <FormattedMessage id="savingsFund.statement.tax.tableEmpty" />
                    </td>
                  </tr>
                )}
              </tbody>
              {gains.length ? (
                <tfoot>
                  <tr>
                    <td colSpan={4}>
                      <FormattedMessage id="savingsFund.statement.tax.tableTotal" />
                    </td>
                    <td className={`text-end ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                      <Euro amount={total} />
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>

          <p className="text-body-secondary small mb-0">
            <FormattedMessage id="savingsFund.statement.tax.methodNote" />
          </p>
        </div>
      )}
    </>
  );
};

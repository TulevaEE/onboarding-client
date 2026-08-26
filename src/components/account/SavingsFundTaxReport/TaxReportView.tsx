import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { CostBasisMethod, SavingsFundTaxReport } from '../../common/apiModels';
import { MethodSelector } from './MethodSelector';
import { YearSelector } from './YearSelector';

export const TaxReportView: React.FunctionComponent<{
  report?: SavingsFundTaxReport;
  taxYears: number[];
  year: number;
  method: CostBasisMethod;
  detailsOpen: boolean;
  isLoading: boolean;
  onYearChange: (year: number) => void;
  onMethodChange: (method: CostBasisMethod) => void;
  onDetailsToggle: () => void;
}> = ({
  report,
  taxYears,
  year,
  method,
  detailsOpen,
  isLoading,
  onYearChange,
  onMethodChange,
  onDetailsToggle,
}) => (
  <>
    <div className="card p-4 mb-3">
      <YearSelector taxYears={taxYears} year={year} onYearChange={onYearChange} />
    </div>

    {report && (
      <div className="card p-4 mb-3">
        <h2 className="h6 text-body-secondary mb-2">
          <FormattedMessage id="savingsFund.statement.tax.heading" values={{ year }} />
        </h2>

        {report.redemptions.length === 0 ? (
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
              {report.totalGain >= 0 ? (
                <FormattedMessage
                  id="savingsFund.statement.tax.gain"
                  values={{ amount: <Euro amount={report.totalGain} className="text-success" /> }}
                />
              ) : (
                <FormattedMessage
                  id="savingsFund.statement.tax.loss"
                  values={{
                    amount: <Euro amount={Math.abs(report.totalGain)} className="text-danger" />,
                  }}
                />
              )}
            </div>
            <p className="mt-2 mb-0">
              <FormattedMessage id="savingsFund.statement.tax.lead" />
            </p>
          </>
        )}

        {report.investmentAccount == null && (
          <div className="alert alert-warning mt-3 mb-0">
            <FormattedMessage id="savingsFund.statement.tax.investmentAccount" />
          </div>
        )}

        {report.investmentAccount != null && report.investmentAccount.totalGain === null && (
          <div role="alert" className="alert alert-warning mt-3 mb-0">
            <FormattedMessage id="savingsFundTaxReport.investmentAccount.redeemedOutside" />
          </div>
        )}

        {report.investmentAccount?.totalGain != null && (
          <div className="alert alert-info mt-3 mb-0">
            <div className="fw-medium mb-1">
              <FormattedMessage id="savingsFundTaxReport.investmentAccount.gainsHeading" />
            </div>
            <Euro amount={report.investmentAccount.totalGain} />
            <p className="small mt-2 mb-0">
              <FormattedMessage id="savingsFundTaxReport.investmentAccount.notAGain" />
            </p>
          </div>
        )}
      </div>
    )}

    {isLoading && <Shimmer height={32} />}

    {/* The method stays on the page in every state, so a request the backend refuses cannot
        take away the control needed to ask for something else. */}
    <div className="card p-4 mb-3">
      <div className="mb-3">
        <MethodSelector method={method} onMethodChange={onMethodChange} />
      </div>

      <p className="text-body-secondary small mb-0">
        <FormattedMessage id="savingsFund.statement.tax.methodNote" />
      </p>
    </div>

    {report && (
      <button
        type="button"
        aria-expanded={detailsOpen}
        className="btn btn-link p-0 mb-3"
        onClick={onDetailsToggle}
      >
        <FormattedMessage
          id={
            detailsOpen ? 'savingsFund.statement.hideDetails' : 'savingsFund.statement.showDetails'
          }
        />
      </button>
    )}

    {report && detailsOpen && (
      <div className="card p-4 mb-3">
        <h2 className="h6 text-body-secondary mb-3">
          <FormattedMessage id="savingsFund.statement.tax.detailsHeading" />
        </h2>

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
              {report.redemptions.length ? (
                report.redemptions.map((gain) => (
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
            {report.redemptions.length ? (
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <FormattedMessage id="savingsFund.statement.tax.tableTotal" />
                  </td>
                  <td
                    className={`text-end ${report.totalGain >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    <Euro amount={report.totalGain} />
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    )}
  </>
);

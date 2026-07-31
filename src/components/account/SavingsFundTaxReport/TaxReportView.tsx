import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Transaction } from '../../common/apiModels';
import { Euro } from '../../common/Euro';
import { CostBasisMethod, getRealisedGainsBetween } from './statement';

const TAX_YEARS = [moment().year() - 1, moment().year()];

export const TaxReportView: React.FunctionComponent<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const [year, setYear] = useState(TAX_YEARS[0]);
  const [method, setMethod] = useState<CostBasisMethod>('WEIGHTED_AVERAGE');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const from = moment().year(year).startOf('year').format('YYYY-MM-DD');
  const to = moment().year(year).endOf('year').format('YYYY-MM-DD');
  const gains = getRealisedGainsBetween(transactions, from, to, method);
  const total = gains.reduce((sum, gain) => sum + gain.gain, 0);

  return (
    <>
      <div className="card p-4 mb-3">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-body-secondary me-1">
            <FormattedMessage id="savingsFund.statement.tax.year" />
          </span>
          {TAX_YEARS.map((taxYear) => (
            <button
              key={taxYear}
              type="button"
              className={`btn btn-sm rounded-pill ${
                year === taxYear ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => setYear(taxYear)}
            >
              {taxYear}
            </button>
          ))}
        </div>
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

      <button
        type="button"
        className="btn btn-link p-0 mb-3"
        onClick={() => setDetailsOpen(!detailsOpen)}
      >
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

          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <span className="text-body-secondary me-1">
              <FormattedMessage id="savingsFund.statement.tax.method" />
            </span>
            {(['FIFO', 'WEIGHTED_AVERAGE'] as CostBasisMethod[]).map((option) => (
              <button
                key={option}
                type="button"
                className={`btn btn-sm rounded-pill ${
                  method === option ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                onClick={() => setMethod(option)}
              >
                {option === 'FIFO' ? (
                  <FormattedMessage id="savingsFund.statement.tax.methodFifo" />
                ) : (
                  <FormattedMessage id="savingsFund.statement.tax.methodAverage" />
                )}
              </button>
            ))}
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

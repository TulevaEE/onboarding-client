import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { CostBasisMethod } from '../../common/apiModels';
import { useSavingsFundTaxReport } from './api/taxReport.api';
import { TaxReportView } from './TaxReportView';
import { YearSelector } from './YearSelector';

const TAX_YEARS = [moment().year() - 1, moment().year()];

export const TaxReportPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.savingsFundTaxReport');

  const [year, setYear] = useState(TAX_YEARS[0]);
  const [method, setMethod] = useState<CostBasisMethod>('WEIGHTED_AVERAGE');

  const { data: report, isLoading, isError, refetch } = useSavingsFundTaxReport(year, method);

  return (
    <section className="mt-5">
      <h1 className="mb-1">
        <FormattedMessage id="savingsFundTaxReport.title" />
      </h1>
      <p className="text-body-secondary">
        <FormattedMessage id="savingsFundTaxReport.subtitle" />
      </p>
      <div className="alert alert-info mb-4">
        <FormattedMessage id="savingsFundTaxReport.pillarNote" />
      </div>

      {isError && (
        <div className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <span>
            <FormattedMessage id="savingsFundTaxReport.unavailable" />
          </span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            <FormattedMessage id="savingsFundTaxReport.retry" />
          </button>
        </div>
      )}

      {/* A year the backend refused leaves nothing to draw, so the year someone can change
          is shown on its own — otherwise the page stays broken until a reload. */}
      {report ? (
        <TaxReportView
          report={report}
          taxYears={TAX_YEARS}
          year={year}
          method={method}
          onYearChange={setYear}
          onMethodChange={setMethod}
        />
      ) : (
        <>
          <div className="card p-4 mb-3">
            <YearSelector taxYears={TAX_YEARS} year={year} onYearChange={setYear} />
          </div>
          {isLoading && <Shimmer height={32} />}
        </>
      )}
    </section>
  );
};

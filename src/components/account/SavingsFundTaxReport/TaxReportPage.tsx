import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { CostBasisMethod } from '../../common/apiModels';
import { useSavingsFundTaxReport } from './api/taxReport.api';
import { MethodSelector } from './MethodSelector';
import { TaxReportView } from './TaxReportView';
import { YearSelector } from './YearSelector';

const TAX_YEARS = [moment().year() - 1, moment().year()];
const DEFAULT_METHOD: CostBasisMethod = 'WEIGHTED_AVERAGE';

export const TaxReportPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.savingsFundTaxReport');

  const [year, setYear] = useState(TAX_YEARS[0]);
  const [method, setMethod] = useState<CostBasisMethod>(DEFAULT_METHOD);
  // The details live here so that asking for another method — which leaves nothing to draw
  // until the backend answers — does not close the panel someone opened.
  const [detailsOpen, setDetailsOpen] = useState(false);

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

      {/* A request the backend refused leaves nothing to draw, so the selectors are shown on
          their own — otherwise the page stays broken until a reload. Every request carries a
          method, so the method is reachable once a failure has been reported; while nothing
          has failed it is shown only if it was already on screen, keeping it from flashing on
          an ordinary first load. */}
      {report ? (
        <TaxReportView
          report={report}
          taxYears={TAX_YEARS}
          year={year}
          method={method}
          detailsOpen={detailsOpen}
          onYearChange={setYear}
          onMethodChange={setMethod}
          onDetailsToggle={() => setDetailsOpen(!detailsOpen)}
        />
      ) : (
        <>
          <div className="card p-4 mb-3">
            <YearSelector taxYears={TAX_YEARS} year={year} onYearChange={setYear} />
          </div>
          {(isError || detailsOpen) && (
            <div className="card p-4 mb-3">
              <MethodSelector method={method} onMethodChange={setMethod} />
            </div>
          )}
          {isLoading && <Shimmer height={32} />}
        </>
      )}
    </section>
  );
};

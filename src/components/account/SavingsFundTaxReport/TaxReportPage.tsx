import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../common/usePageTitle';
import { CostBasisMethod } from '../../common/apiModels';
import { useSavingsFundTaxReport } from './api/taxReport.api';
import { TaxReportView } from './TaxReportView';

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

  // Asking for another method puts the query back into loading, clearing the failure that was
  // the only reason the methods were on the page. Remembering the failure keeps them there,
  // so the pill someone just pressed is not pulled out from under the keyboard.
  const [methodReachable, setMethodReachable] = useState(false);
  if (isError && !methodReachable) {
    setMethodReachable(true);
  }

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
        <div
          role="alert"
          className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between"
        >
          <span>
            <FormattedMessage id="savingsFundTaxReport.unavailable" />
          </span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            <FormattedMessage id="savingsFundTaxReport.retry" />
          </button>
        </div>
      )}

      <TaxReportView
        report={report}
        taxYears={TAX_YEARS}
        year={year}
        method={method}
        detailsOpen={detailsOpen}
        isLoading={isLoading}
        methodReachable={methodReachable}
        onYearChange={setYear}
        onMethodChange={setMethod}
        onDetailsToggle={() => setDetailsOpen(!detailsOpen)}
      />
    </section>
  );
};

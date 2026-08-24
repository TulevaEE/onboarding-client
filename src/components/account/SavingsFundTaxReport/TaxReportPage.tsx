import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import { usePageTitle } from '../../common/usePageTitle';
import { useMe } from '../../common/apiHooks';
import { ACCOUNT_PATH } from '../../paths';
import { CostBasisMethod } from '../../common/apiModels';
import { useSavingsFundTaxReport } from './api/taxReport.api';
import { TaxReportView } from './TaxReportView';

const TAX_YEARS = [moment().year() - 1, moment().year()];
const DEFAULT_METHOD: CostBasisMethod = 'WEIGHTED_AVERAGE';

export const TaxReportPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.savingsFundTaxReport');

  const { data: user } = useMe();
  const isLegalEntity = user?.role?.type === 'LEGAL_ENTITY';

  const [year, setYear] = useState(TAX_YEARS[0]);
  const [method, setMethod] = useState<CostBasisMethod>(DEFAULT_METHOD);
  // The details live here so that asking for another method — which leaves nothing to draw
  // until the backend answers — does not close the panel someone opened.
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useSavingsFundTaxReport(year, method, { enabled: user !== undefined && !isLegalEntity });

  if (isLegalEntity) {
    return <Redirect to={ACCOUNT_PATH} />;
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
        onYearChange={setYear}
        onMethodChange={setMethod}
        onDetailsToggle={() => setDetailsOpen(!detailsOpen)}
      />
    </section>
  );
};

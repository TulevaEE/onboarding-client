import React, { useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { CostBasisMethod } from '../../common/apiModels';
import { useSavingsFundTaxReport } from './api/taxReport.api';
import { TaxReportView } from './TaxReportView';

const TAX_YEARS = [moment().year() - 1, moment().year()];

export const TaxReportPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.savingsFundTaxReport');

  const [year, setYear] = useState(TAX_YEARS[0]);
  const [method, setMethod] = useState<CostBasisMethod>('WEIGHTED_AVERAGE');

  const { data: report, isLoading } = useSavingsFundTaxReport(year, method);

  if (isLoading || !report) {
    return (
      <section className="mt-5">
        <Shimmer height={32} />
      </section>
    );
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

      <TaxReportView
        report={report}
        taxYears={TAX_YEARS}
        year={year}
        method={method}
        onYearChange={setYear}
        onMethodChange={setMethod}
      />
    </section>
  );
};

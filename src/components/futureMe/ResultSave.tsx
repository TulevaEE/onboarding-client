import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js';
import { flushSync } from 'react-dom';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { euro } from './amountFormat';
import { chartRowsOf, chartSeriesOf, tableRowsOf } from './chartData';
import { SOURCE_LABELS } from './chartSources';
import { needMonthly } from './expensesAnswers';
import { ComparisonTable } from './ResultComparison';
import { ResultContext, resultOf } from './resultAnswers';
import { markdownOf, markdownTable } from './resultMarkdown';

type SaveFormat = 'markdown' | 'pdf';

const LEFT_OUT_OF_FILE =
  '.result-save, .result-compare, #future-me-chart-table, .result-chart-legend-hint, .result-chart-legend';
const OBJECT_URL_LIFETIME_MS = 1000;
const PRINT_CHART_WIDTH = 1000;
const PRINT_CHART_HEIGHT = 352;

const incomeTableOf = (intl: IntlShape, context: ResultContext): string => {
  const rows = chartRowsOf(resultOf(context), needMonthly(context.expenses));
  const sources = chartSeriesOf(rows).map(({ id }) => id);
  const head = [
    intl.formatMessage({ id: 'futureMe.result.chart.table.age' }),
    ...sources.map((id) => intl.formatMessage({ id: SOURCE_LABELS[id] })),
    intl.formatMessage({ id: 'futureMe.result.chart.costs' }),
  ];
  const body = tableRowsOf(rows).map((row) => [
    String(row.age),
    ...sources.map((id) => euro(row[id])),
    euro(row.costs),
  ]);
  const caption = intl.formatMessage({ id: 'futureMe.result.chart.table.caption' });
  return `**${caption}**\n\n${markdownTable(head, body)}`;
};

const fileOf = (intl: IntlShape, context: ResultContext, page: Element, printOnly: Element) =>
  `${[
    `# ${intl.formatMessage({ id: 'futureMe.result.save.file.title' })}`,
    `_${intl.formatMessage(
      { id: 'futureMe.result.save.file.intro' },
      { date: intl.formatDate(new Date()) },
    )}_`,
    markdownOf(page, LEFT_OUT_OF_FILE),
    incomeTableOf(intl, context),
    markdownOf(printOnly, 'h3'),
    '---',
    intl.formatMessage({ id: 'futureMe.result.save.file.footer' }),
  ].join('\n\n')}\n`;

const download = (text: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  link.download = `tulevane-mina-${new Date().toLocaleDateString('sv-SE')}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), OBJECT_URL_LIFETIME_MS);
};

const openForPrint = (page: Element): (() => void) => {
  const closedDetails = Array.from(page.querySelectorAll('details')).filter(
    (details) => !details.open,
  );
  const charts = Array.from(page.querySelectorAll('canvas'))
    .map((canvas) => Chart.getChart(canvas))
    .filter((chart): chart is Chart => chart !== undefined);
  closedDetails.forEach((details) => details.setAttribute('open', ''));
  charts.forEach((chart) => chart.resize(PRINT_CHART_WIDTH, PRINT_CHART_HEIGHT));
  return () => {
    closedDetails.forEach((details) => details.removeAttribute('open'));
    charts.forEach((chart) => chart.resize());
  };
};

export const ResultSave = ({ context }: { context: ResultContext }) => {
  const intl = useIntl();
  const [isSaving, setSaving] = useState(false);
  const ownRef = useRef<HTMLDivElement>(null);
  const printOnlyRef = useRef<HTMLDivElement>(null);

  const restoreAfterPrint = useRef<(() => void) | null>(null);

  useEffect(() => {
    const afterPrint = () => {
      restoreAfterPrint.current?.();
      restoreAfterPrint.current = null;
      setSaving(false);
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const save = (format: SaveFormat) => {
    flushSync(() => setSaving(true));
    const page = ownRef.current?.closest('section');
    if (format === 'pdf') {
      restoreAfterPrint.current = page ? openForPrint(page) : null;
      window.print();
      return;
    }
    if (page && printOnlyRef.current) {
      download(fileOf(intl, context, page, printOnlyRef.current));
    }
    setSaving(false);
  };

  return (
    <div className="result-save" ref={ownRef}>
      <h3 className="h5 section-title mt-4">
        <FormattedMessage id="futureMe.result.save.title" />
      </h3>
      <div className="result-save-actions">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => save('markdown')}
        >
          <FormattedMessage id="futureMe.result.save.markdown" />
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          aria-describedby="future-me-save-pdf-hint"
          onClick={() => save('pdf')}
        >
          <FormattedMessage id="futureMe.result.save.pdf" />
        </button>
        <span id="future-me-save-pdf-hint" className="small text-secondary text-pretty">
          <FormattedMessage id="futureMe.result.save.pdfHint" />
        </span>
      </div>
      {isSaving && (
        <div className="result-save-print" ref={printOnlyRef}>
          <h3 className="h5 section-title mt-4">
            <FormattedMessage id="futureMe.result.compare.caption" />
          </h3>
          <ComparisonTable context={context} />
        </div>
      )}
    </div>
  );
};

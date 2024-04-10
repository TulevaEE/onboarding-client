import React, { useState } from 'react';
import './ComparisonCalculator.scss';
import { FormattedMessage } from 'react-intl';
import { formatAmountForCurrency } from '../../common/utils';

interface Option {
  value: string;
  label: string;
}

interface GraphBarProperties {
  color: string;
  amount: number;
  percentage: number;
  height: number;
  label: string;
}

interface GraphProperties {
  barCount: 2 | 3;
  barProperties: {
    1: GraphBarProperties;
    2: GraphBarProperties;
    3: GraphBarProperties | undefined;
  };
}

const ComparisonCalculator: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('option1');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [graphProperties, setGraphProperties] = useState<GraphProperties>({
    barCount: 3,
    barProperties: {
      1: {
        color: 'orange',
        amount: 14800,
        percentage: 5.7,
        height: 120,
        label: 'comparisonCalculator.graphYourIIPillar',
      },
      2: {
        color: 'green',
        amount: 24300,
        percentage: 200,
        height: 200,
        label: 'Bank 2i',
      },
      3: {
        color: 'blue',
        amount: 21000,
        percentage: 8.5,
        height: 165,
        label: 'comparisonCalculator.graphWorldMarketStockIndex',
      },
    },
  });

  const getTimePeriodOptions = (): Option[] => {
    return [
      { value: 'option1', label: 'Alates II sambas kogumise algusest (19.03.2004)' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];
  };

  const getCompareToOptions = (): Option[] => {
    return [
      { value: 'option1', label: 'Maailmaturu index' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
    // eslint-disable-next-line no-console
    console.log('Selected key:', event.target.value);
  };

  return (
    <div className="comparison-calculator">
      <div className="card card-primary p-4">
        <div className="header-section">
          <div className="row justify-content-center">
            <div className="btn-group">
              <button type="button" className="btn btn-primary">
                <FormattedMessage id="comparisonCalculator.yourIIpillar" />
              </button>
              <button type="button" className="btn btn-light">
                <FormattedMessage id="comparisonCalculator.yourIIIpillar" />
              </button>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-12 col-md text-left  mt-3">
              <label htmlFor="timePeriodSelect" className="form-label">
                <FormattedMessage id="comparisonCalculator.timePeriod" />:{' '}
              </label>
              <select
                id="timePeriodSelect"
                className="form-control"
                value={selectedOption}
                onChange={handleSelectChange}
              >
                {getTimePeriodOptions().map((option: Option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md text-left  mt-3">
              <label htmlFor="comparedToSelect" className="form-label">
                <FormattedMessage id="comparisonCalculator.comparedTo" />:{' '}
              </label>
              <select
                id="comparedToSelect"
                className="form-control"
                value={selectedOption}
                onChange={handleSelectChange}
              >
                {getCompareToOptions().map((option: Option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="content-section row justify-content-center">
          <div className="col-md-7 order-2 order-md-1 d-flex flex-column">
            <div className="result-section text-left mt-5 pb-0 d-flex flex-column justify-content-between">
              <div className="mb-3">
                <p className="result-text">
                  <FormattedMessage
                    id="comparisonCalculator.contentPerformance"
                    values={{
                      b: (chunks: string) => (
                        <strong style={{ fontWeight: 'bold' }}>{chunks}</strong>
                      ),
                    }}
                  />{' '}
                  <span className="result-negative">-10 700 €</span>{' '}
                  <FormattedMessage id="comparisonCalculator.contentPerformanceNegativeVerdict" />
                </p>
              </div>
              <div className="mb-3">
                <p className="result-text">
                  <FormattedMessage
                    id="comparisonCalculator.contentExplanation"
                    values={{
                      b: (chunks: string) => (
                        <strong style={{ fontWeight: 'bold' }}>{chunks}</strong>
                      ),
                    }}
                  />{' '}
                </p>
              </div>
              <div className="">
                <button type="button" className="btn btn-outline-primary">
                  <FormattedMessage id="comparisonCalculator.ctaButton" />
                </button>
              </div>
            </div>
          </div>
          {getGraphSection()}
        </div>
        <div className="footer-section text-center">
          <div className="footer-disclaimer">
            <FormattedMessage id="comparisonCalculator.footerDisclaimer" />
          </div>
          <div className="footer-links pt-3">
            <div className="row justify-content-center">
              <div className="col-12 col-sm-6 col-md-auto">
                <a
                  href="https://tuleva.ee/mida-need-numbrid-naitavad"
                  // className="pr-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FormattedMessage id="comparisonCalculator.footerNumbersExplanationLink" />
                </a>
              </div>
              <div className="col-12 col-sm-6 col-md-auto">
                <a
                  href="https://tuleva.ee/analuusid/millist-tootlust-on-tulevas-oodata"
                  // className="pl-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FormattedMessage id="comparisonCalculator.footerPerformanceExplanationLink" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function getGraphSection() {
    // convenience to see 2 vs 3 bars
    const handleMouseEnter = () => {
      setGraphProperties((prevState) => ({
        ...prevState,
        barCount: 2,
      }));
    };

    const handleMouseLeave = () => {
      setGraphProperties((prevState) => ({
        ...prevState,
        barCount: 3,
      }));
    };
    return (
      <div
        className="graph-section col-md-5 order-1 order-md-2 d-flex flex-column mb-4"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {getGraphBars()}
        <div className="bottom-divider">
          <div className="container-fluid">
            <div className="row">
              <div className="col-auto px-0 gradient-left" />
              <div className="col gradient-center" />
              <div className="col-auto px-0 gradient-right" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function getGraphBars() {
    if (graphProperties.barCount === 2) {
      return (
        <div className="bar-container mt-5 d-flex">
          <div className="col-md-5 col-sm-6">{getGraphBar(graphProperties.barProperties['1'])}</div>
          <div className="col-md-5 col-sm-6">{getGraphBar(graphProperties.barProperties['2'])}</div>
        </div>
      );
    }
    if (graphProperties.barCount === 3) {
      return (
        <div className="bar-container mt-5 d-flex">
          <div className="col-4">{getGraphBar(graphProperties.barProperties['1'])}</div>
          <div className="col-4">{getGraphBar(graphProperties.barProperties['2'])}</div>
          {graphProperties.barProperties['3'] && (
            <div className="col-4">{getGraphBar(graphProperties.barProperties['3'])}</div>
          )}
        </div>
      );
    }
    return <div />;
  }
  function getGraphBar(properties: GraphBarProperties) {
    // eslint-disable-next-line no-nested-ternary
    const amountSign = properties.amount > 0 ? '+' : properties.amount < 0 ? '-' : '';
    return (
      <div className="bar bar-2" style={{ backgroundColor: properties.color }}>
        <div className="bar-value" style={{ bottom: `${properties.height + 8 + 32}px` }}>
          {amountSign}
          {formatAmountForCurrency(properties.amount, 0)}
        </div>
        <div className="bar-graph" style={{ height: `${properties.height}px` }}>
          <div className="bar-percentage">{properties.percentage}%</div>
        </div>
        <div className="bar-label">
          <FormattedMessage id={properties.label} />
        </div>
      </div>
    );
  }
};

export default ComparisonCalculator;

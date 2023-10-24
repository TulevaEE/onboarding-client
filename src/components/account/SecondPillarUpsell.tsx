import React from 'react';
import './SecondPillarUpsell.scss';
import { FormattedMessage, useIntl } from 'react-intl';
import moment from 'moment';
import Euro from '../common/Euro';
import { useMe } from '../common/apiHooks';
import { useDefaultReturns } from './ReturnComparison/returnComparisonHooks';

interface CardTitleProps {
  className: string;
}
const CardTitle: React.FC<CardTitleProps> = ({ className }) => {
  return (
    <div className={`card-title mb-3 ${className}`}>
      <h2 className="d-inline mr-2">
        <FormattedMessage id="secondPillarUpsell.cardTitle" />
      </h2>
      <span className="badge badge-pink">
        <FormattedMessage id="secondPillarUpsell.notInTuleva" />
      </span>
    </div>
  );
};
interface CTAProps {
  className: string;
}
const CallToAction: React.FC<CTAProps> = ({ className }) => {
  return (
    <div className={`cta ${className}`}>
      <button className="btn btn-primary px-3" type="button">
        <FormattedMessage id="secondPillarUpsell.callToAction" />
      </button>
    </div>
  );
};

interface PensionGraphProps {
  startingYear: number | string;
  currentYear: number | string;
  endingYear: number | string;
  markerText: string;
}

const PensionGraph: React.FC<PensionGraphProps> = ({
  startingYear,
  currentYear,
  endingYear,
  markerText,
}) => {
  return (
    <svg viewBox="0 0 439 158" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        fill="#333333"
        xmlSpace="preserve"
        fontFamily="Roboto"
        fontSize="12"
        letterSpacing="0px"
      >
        <tspan x="0.5" y="151.133">
          {startingYear}
        </tspan>
      </text>
      <text
        fill="#333333"
        xmlSpace="preserve"
        fontFamily="Roboto"
        fontSize="12"
        fontWeight="bold"
        letterSpacing="0px"
      >
        <tspan x="136.719" y="151.133">
          {currentYear}
        </tspan>
      </text>
      <text
        fill="#333333"
        xmlSpace="preserve"
        fontFamily="Roboto"
        fontSize="12"
        letterSpacing="0px"
      >
        <tspan x="408.5" y="151.133">
          {endingYear}
        </tspan>
      </text>
      <path
        d="M1 129.827C1 129.827 151.284 133.33 237.876 108.786C328.364 83.1367 437 2 437 2"
        stroke="#0078FF"
        strokeWidth="4"
      />
      <path
        d="M1 130.796C1 130.796 127.796 133.878 219 116.104C310.204 98.33 437 36 437 36"
        stroke="#333333"
        strokeWidth="2"
      />
      <path d="M436.5 132L0.500013 132" stroke="#E0E0E0" />
      <circle
        cx="8"
        cy="8"
        r="7"
        transform="matrix(1 0 0 -1 142 133)"
        fill="white"
        stroke="#333333"
        strokeWidth="2"
      />
      <rect x="105" y="79" width="87" height="23" rx="4" fill="#333333" />
      <text fill="white" xmlSpace="preserve" fontFamily="Roboto" fontSize="12" letterSpacing="0px">
        <tspan x="113.139" y="94.1328">
          {markerText}
        </tspan>
      </text>
      <line x1="149.5" y1="102" x2="149.5" y2="118" stroke="#333333" strokeWidth="2" />
    </svg>
  );
};

const SecondPillarUpsell: React.FC = () => {
  const intl = useIntl();
  const { data: returns } = useDefaultReturns();
  const { data: user } = useMe();

  const startingYear = moment(returns?.from).year() || '...';
  const currentYear = moment().year() || '...';
  const endingYear = moment(user?.dateOfBirth).year() + (user?.retirementAge || 65) || '...';

  const yourSecondPillar = (returns?.personal?.amount || 0) + (returns?.personal?.paymentsSum || 0);
  const amountInIndexFund = (returns?.index?.amount || 0) + (returns?.index?.paymentsSum || 0);
  return (
    <div className="card">
      <div className="card-body p-4">
        <div className="row">
          <div className="col-md-6 order-1 order-md-0">
            <CardTitle className="d-none d-md-block" />
            <div className="card-text mt-4 mt-md-0">
              <ul className="pl-3 small-bullet-list pr-4">
                <li className="mb-3">
                  <FormattedMessage
                    id="secondPillarUpsell.riskDiversification"
                    values={{ b: (chunks: string) => <b>{chunks}</b> }}
                  />
                </li>
                <li className="mb-3">
                  <FormattedMessage
                    id="secondPillarUpsell.ownership"
                    values={{ b: (chunks: string) => <b>{chunks}</b> }}
                  />
                </li>
                <li className="mb-3">
                  <FormattedMessage
                    id="secondPillarUpsell.lowFees"
                    values={{ b: (chunks: string) => <b>{chunks}</b> }}
                  />
                </li>
              </ul>
              <p className="ml-3">
                <a href="/">
                  <u>
                    <FormattedMessage id="secondPillarUpsell.readMore" />
                  </u>
                </a>
              </p>
              <CallToAction className="d-none d-md-block" />
            </div>
          </div>
          <div className="col-md-6 order-0 order-md-1">
            <CardTitle className="d-md-none" />
            <div className="card card-primary mr-md-0 border-0 pb-md-2">
              <div className="card-body">
                <span className="h6">
                  <FormattedMessage
                    id="secondPillarUpsell.pensionSavings"
                    values={{
                      a: (text: string) => (
                        <a href="/">
                          <u>{text}</u>
                        </a>
                      ),
                      amount: (
                        <span className="h2 text-primary text-bold text-nowrap">
                          <Euro amount={64732} fractionDigits={0} />
                        </span>
                      ),
                    }}
                  />
                </span>
                <PensionGraph
                  startingYear={startingYear}
                  currentYear={currentYear}
                  endingYear={endingYear}
                  markerText={intl.formatMessage({ id: 'secondPillarUpsell.youAreHere' })}
                />
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-end small mb-1">
                    <FormattedMessage id="secondPillarUpsell.yourSecondPillar" />
                    <span className="text-bold text-nowrap">
                      <Euro amount={yourSecondPillar} fractionDigits={0} />
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-end small mb-1 text-primary text-bold">
                    <FormattedMessage id="secondPillarUpsell.amountInIndexFund" />
                    <span className="text-bold text-nowrap">
                      <Euro amount={amountInIndexFund} fractionDigits={0} />
                    </span>
                  </div>
                  <a href="/" className="small text-dark">
                    <u>
                      <FormattedMessage id="secondPillarUpsell.whatDoTheseNumbersMean" />
                    </u>
                  </a>
                  <CallToAction className="d-md-none mt-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecondPillarUpsell;

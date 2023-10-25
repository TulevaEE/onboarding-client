import React from 'react';
import './SecondPillarUpsell.scss';
import { FormattedMessage, useIntl } from 'react-intl';
import moment from 'moment';
import { Link } from 'react-router-dom';
import Euro from '../../common/Euro';
import { useMe } from '../../common/apiHooks';
import { useDefaultReturns } from '../ReturnComparison/returnComparisonHooks';
import PensionGraph from './PensionGraph';

const SecondPillarUpsellCard: React.FC = () => {
  const intl = useIntl();
  const { data: returns } = useDefaultReturns();
  const { data: user } = useMe();

  const startingYear = moment(returns?.from).year() || '...';
  const currentYear = moment().year() || '...';
  const endingYear = moment(user?.dateOfBirth).year() + (user?.retirementAge || 65) || '...';

  const yourSecondPillar = (returns?.personal?.amount || 0) + (returns?.personal?.paymentsSum || 0);
  const amountInIndexFund = (returns?.index?.amount || 0) + (returns?.index?.paymentsSum || 0);
  const diff = yourSecondPillar - amountInIndexFund;

  return (
    <div>
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
                  <a href="https://tuleva.ee/tasud-alla/" target="_blank" rel="noreferrer">
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
                        amount: (
                          <span className="h2 text-orange text-bold text-nowrap">
                            {diff ? <Euro amount={diff} fractionDigits={0} /> : '...'}
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
                    <div className="d-flex justify-content-between align-items-end small mb-1 text-primary text-bold">
                      <FormattedMessage id="secondPillarUpsell.amountInIndexFund" />
                      <span className="text-bold text-nowrap">
                        {amountInIndexFund ? (
                          <Euro amount={amountInIndexFund} fractionDigits={0} />
                        ) : (
                          '...'
                        )}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-end small mb-1">
                      <FormattedMessage id="secondPillarUpsell.yourSecondPillar" />
                      <span className="text-bold text-nowrap">
                        {yourSecondPillar ? (
                          <Euro amount={yourSecondPillar} fractionDigits={0} />
                        ) : (
                          '...'
                        )}
                      </span>
                    </div>
                    <a
                      href="https://tuleva.ee/mida-need-numbrid-naitavad/"
                      className="small text-dark"
                      target="_blank"
                      rel="noreferrer"
                    >
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
      <Disclaimer />
    </div>
  );
};

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
    <div className={className}>
      <Link to="/2nd-pillar-flow" className="btn btn-primary px-3">
        <FormattedMessage id="secondPillarUpsell.callToAction" />
      </Link>
    </div>
  );
};
const Disclaimer: React.FC = () => {
  return (
    <div className="mt-2 text-center">
      <small className="text-muted">
        <FormattedMessage id="secondPillarUpsell.disclaimer" />
      </small>
    </div>
  );
};

export default SecondPillarUpsellCard;

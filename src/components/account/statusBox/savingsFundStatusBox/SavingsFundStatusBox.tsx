import { FC } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import StatusBoxRow from '../statusBoxRow';
import { useSavingsFundBalance, useSavingsFundOnboardingStatus } from '../../../common/apiHooks';
import { Login } from '../../../login/types';
import { Euro } from '../../../common/Euro';

type SavingsFundStatusBoxProps = {
  loading: boolean;
};

const SavingsFundStatusBox: FC<SavingsFundStatusBoxProps> = ({ loading }) => {
  const intl = useIntl();
  const { data: onboardingStatus } = useSavingsFundOnboardingStatus();
  const { data: savingsFundBalance } = useSavingsFundBalance();

  if (!onboardingStatus || onboardingStatus?.status !== 'COMPLETED') {
    return null;
  }

  const noContributions = savingsFundBalance?.contributions === 0;

  return (
    <div>
      <StatusBoxRow
        ok
        showAction={!loading}
        name={intl.formatMessage({ id: 'savingsFund.status.title' })}
        lines={
          noContributions
            ? [
                <span>
                  <FormattedMessage id="savingsFund.status.description.zeroBalance" />
                </span>,
              ]
            : [
                <span>
                  <FormattedMessage id="savingsFund.status.description.hasInvested" />
                </span>,
                ...(savingsFundBalance
                  ? [
                      <span className="text-body-secondary">
                        <FormattedMessage
                          id="savingsFund.status.investedBalance"
                          values={{
                            investedAmount: (
                              <Euro amount={savingsFundBalance.contributions} fractionDigits={0} />
                            ),
                          }}
                        />
                      </span>,
                    ]
                  : []),
              ]
        }
      >
        <Link to="/savings-fund/payment" className="btn btn-outline-primary">
          <FormattedMessage id="savingsFund.status.makeDeposit.label" />
        </Link>
      </StatusBoxRow>
    </div>
  );
};

type State = {
  login: Login;
};

const mapStateToProps = (state: State) => ({
  loading: state.login.loadingUserConversion,
});

export default connect(mapStateToProps)(SavingsFundStatusBox);

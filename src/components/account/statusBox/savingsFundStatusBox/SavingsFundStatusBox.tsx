import { FC, ReactNode } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import StatusBoxRow from '../statusBoxRow';
import { useSavingsFundBalance, useSavingsFundOnboardingStatus } from '../../../common/apiHooks';
import { Login } from '../../../login/types';
import { Euro } from '../../../common/Euro';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { fundBalance } from '../../../common/balances';

type SavingsFundStatusBoxProps = {
  loading: boolean;
  last?: boolean;
};

const SavingsFundStatusBox: FC<SavingsFundStatusBoxProps> = ({ loading, last }) => {
  const intl = useIntl();
  const { data: onboardingStatus } = useSavingsFundOnboardingStatus();
  const { data: savingsFundBalance, isLoading } = useSavingsFundBalance();

  if (!onboardingStatus) {
    return null;
  }

  const holdsValue = savingsFundBalance != null && fundBalance(savingsFundBalance) > 0;

  const getLines = () => {
    const lines: ReactNode[] = [];

    if (!savingsFundBalance && isLoading) {
      lines.push(<Shimmer />);
      return lines;
    }

    if (holdsValue) {
      lines.push(
        <span>
          <FormattedMessage id="savingsFund.status.description.hasInvested" />
        </span>,
      );
      lines.push(
        <span className="text-body-secondary">
          <FormattedMessage
            id="savingsFund.status.secondary.value"
            values={{
              value: (
                <strong>
                  <Euro amount={fundBalance(savingsFundBalance)} />
                </strong>
              ),
            }}
          />
        </span>,
      );
      return lines;
    }

    lines.push(
      <span>
        <FormattedMessage id="savingsFund.status.description.zeroBalance" />
      </span>,
      <span className="text-body-secondary">
        <FormattedMessage id="savingsFund.status.secondary.zeroBalance" />
      </span>,
    );
    return lines;
  };

  return (
    <div>
      <StatusBoxRow
        status={holdsValue ? 'SUCCESS' : 'TODO'}
        showAction={!loading}
        name={intl.formatMessage({ id: 'savingsFund.status.title' })}
        lines={getLines()}
        last={last}
      >
        {onboardingStatus?.status === 'COMPLETED' ? (
          <Link to="/savings-fund/payment" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.status.makeDeposit.label" />
          </Link>
        ) : (
          <Link to="/savings-fund/onboarding" className="btn btn-outline-primary">
            <FormattedMessage id="savingsFund.status.startSaving.label" />
          </Link>
        )}
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

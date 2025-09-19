import { FormattedMessage } from 'react-intl';
import React from 'react';
import { connect } from 'react-redux';
import { Conversion } from '../../../common/apiModels';
import { State } from '../../../../types';
import { Shimmer } from '../../../common/shimmer/Shimmer';

interface Props {
  conversion: Conversion;
  className?: string;
}

export const ThirdPillarContributionAmount: React.FunctionComponent<Props> = ({
  conversion,
  className,
}) => {
  if (!conversion) {
    return <Shimmer height={24} />;
  }
  return (
    <span className={`text-body-secondary ${className}`}>
      <FormattedMessage
        id="account.status.contributionAmount"
        values={{
          thisYearContribution: (
            <b className="text-nowrap">{(conversion.contribution.yearToDate || 0).toFixed(0)} €</b>
          ),
          lastYearContribution: (
            <b className="text-nowrap">{(conversion.contribution.lastYear || 0).toFixed(0)} €</b>
          ),
        }}
      />
    </span>
  );
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion && state.login.userConversion.thirdPillar,
});

export default connect(mapStateToProps)(ThirdPillarContributionAmount);

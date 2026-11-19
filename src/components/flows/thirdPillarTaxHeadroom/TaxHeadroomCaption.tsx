import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useThirdPillarTaxHeadroom } from '../../common/apiHooks';
import { TAX_HEADROOM_PATH } from './paths';

export const TaxHeadroomCaption = () => {
  const { data: headroom } = useThirdPillarTaxHeadroom();

  if (headroom === undefined) {
    return null;
  }

  return (
    <p className="m-0 mt-3 text-body-secondary text-center small">
      <Link to={TAX_HEADROOM_PATH}>
        <FormattedMessage id="thirdPillarPayment.taxHeadroom.ask" />
      </Link>
    </p>
  );
};

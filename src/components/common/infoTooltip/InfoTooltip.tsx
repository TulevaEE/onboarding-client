import React, { PropsWithChildren } from 'react';
import ReactTooltip, { Place } from 'react-tooltip';

import './InfoTooltip.scss';
import infoImage from './info.svg';

type Props = {
  name?: string;
  className?: string;
  place?: Place;
};
export const InfoTooltip = ({
  children,
  name,
  className = '',
  place = 'right',
}: PropsWithChildren<Props>) => (
  <span className={`info-tooltip info-tooltip-modern mx-1 ${className}`}>
    <img data-tip data-for={name} src={infoImage} alt="" className="info-tooltip__image" />
    <span data-tip data-for={name} className="info-bubble" />
    <ReactTooltip id={name} place={place} type="light" effect="solid" className="react-tooltip">
      {children}
    </ReactTooltip>
  </span>
);

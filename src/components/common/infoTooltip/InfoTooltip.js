import React from 'react';
import { PropTypes as Types } from 'prop-types';
import ReactTooltip from 'react-tooltip';

import './InfoTooltip.scss';
import infoImage from './info.svg';

const InfoTooltip = ({ children, name, className = '', place = 'right' }) => (
  <span className={`info-tooltip ${className}`}>
    <img data-tip data-for={name} src={infoImage} alt="" className="info-tooltip__image" />
    <span data-tip data-for={name} className="info-bubble" />
    <ReactTooltip id={name} place={place} type="light" effect="solid" className="react-tooltip">
      {children}
    </ReactTooltip>
  </span>
);

InfoTooltip.defaultProps = {
  children: '',
  name: '',
};

InfoTooltip.propTypes = {
  children: Types.oneOfType([Types.node, Types.string, Types.arrayOf(Types.node)]),
  name: Types.string,
};

export default InfoTooltip;

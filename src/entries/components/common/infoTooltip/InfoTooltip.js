import React from 'react';
import { PropTypes as Types } from 'prop-types';
import ReactTooltip from 'react-tooltip';

import './InfoTooltip.scss';
import infoImage from './info.svg';

const InfoTooltip = ({ children, name }) => (
  <span className="info-tooltip">
    <img
      data-tip
      data-for={name}
      src={infoImage}
      alt="Information"
      className="info-tooltip__image"
    />
    <ReactTooltip id={name} place="right" type="light" effect="float" className="react-tooltip">
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

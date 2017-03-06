import React, { PropTypes as Types } from 'react';
import ReactTooltip from 'react-tooltip';
import infoImage from './info.svg';

const InfoTooltip = ({ children, name }) => (
  <span>
    <img data-tip data-for={name} src={infoImage} alt="Information" className="infoTooltip" />
    <ReactTooltip id={name} place="right" type="light" effect="float">
      { children }
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

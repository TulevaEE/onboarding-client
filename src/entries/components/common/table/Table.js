import React from 'react';
import { PropTypes as Types } from 'prop-types';

import './Table.scss';

const Table = ({ children }) => {
  return (
    <div className="table-container">
      <table className="table">{children}</table>
    </div>
  );
};

Table.defaultProps = {
  children: '',
};

Table.propTypes = {
  children: Types.oneOfType([Types.node, Types.string, Types.arrayOf(Types.node)]),
};

export default Table;

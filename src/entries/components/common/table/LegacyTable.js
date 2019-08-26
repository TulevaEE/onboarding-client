import React from 'react';
import Types from 'prop-types';

import './Table.scss';

const LegacyTable = ({ children }) => {
  return (
    <div className="table-container">
      <table className="table">{children}</table>
    </div>
  );
};

LegacyTable.defaultProps = {
  children: '',
};

LegacyTable.propTypes = {
  children: Types.oneOfType([Types.node, Types.string, Types.arrayOf(Types.node)]),
};

export default LegacyTable;

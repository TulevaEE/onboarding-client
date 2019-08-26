import React from 'react';
import Types from 'prop-types';

import './Table.scss';

const Table = ({ columns, dataSource }) => (
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>
          {columns.map(({ dataIndex, title }) => (
            <th key={dataIndex}>{title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map(({ key, ...data }) => (
          <tr key={key}>
            {columns.map(({ dataIndex }) => (
              <td key={dataIndex}>{data[dataIndex]}</td>
            ))}
          </tr>
        ))}
      </tbody>
      {columns.some(({ footer }) => !!footer) && (
        <tfoot>
          <tr>
            {columns.map(({ dataIndex, footer }) => (
              <td key={dataIndex}>{footer}</td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

Table.propTypes = {
  columns: Types.arrayOf(
    Types.shape({
      title: Types.node.isRequired,
      dataIndex: Types.string.isRequired,
      footer: Types.node,
    }).isRequired,
  ).isRequired,
  dataSource: Types.arrayOf(
    Types.shape({
      key: Types.string.isRequired,
    }),
  ).isRequired,
};

export default Table;

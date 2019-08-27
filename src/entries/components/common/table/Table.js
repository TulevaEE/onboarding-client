import React from 'react';
import Types from 'prop-types';

import './Table.scss';

const HIDDEN_ON_MOBILE_CELL_CLASS = 'd-none d-sm-table-cell';

const Table = ({ columns, dataSource }) => (
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>
          {columns.map(({ dataIndex, title, hideOnMobile }) => (
            <th key={dataIndex} className={getClass(hideOnMobile)}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map(({ key, ...data }) => (
          <tr key={key}>
            {columns.map(({ dataIndex, hideOnMobile }) => (
              <td key={dataIndex} className={getClass(hideOnMobile)}>
                {data[dataIndex]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {columns.some(({ footer }) => !!footer) && (
        <tfoot>
          <tr>
            {columns.map(({ dataIndex, footer, hideOnMobile }) => (
              <td key={dataIndex} className={getClass(hideOnMobile)}>
                {footer}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

function getClass(hideOnMobile) {
  return hideOnMobile ? HIDDEN_ON_MOBILE_CELL_CLASS : undefined;
}

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

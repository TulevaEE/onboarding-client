import React from 'react';
import Types from 'prop-types';

import './Table.scss';

const Table = ({ columns, dataSource }) => (
  <div className="table-container">
    <table className="table mb-0">
      <thead>
        <tr>
          {columns.map(({ dataIndex, title, hideOnMobile, align }) => (
            <th
              key={dataIndex}
              className={`${getAlignClass(align)} ${getMobileClass(hideOnMobile)}`}
            >
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map(({ key, ...data }) => (
          <tr key={key}>
            {columns.map(({ dataIndex, hideOnMobile, width100, align }) => (
              <td
                key={dataIndex}
                className={`${getAlignClass(align)} ${getWidthClass(width100)} ${getMobileClass(
                  hideOnMobile,
                )}`}
              >
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
              <td key={dataIndex} className={getMobileClass(hideOnMobile)}>
                {footer}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

function getMobileClass(hideOnMobile) {
  const HIDDEN_ON_MOBILE_CELL_CLASS = 'd-none d-sm-table-cell';
  return hideOnMobile ? HIDDEN_ON_MOBILE_CELL_CLASS : undefined;
}

function getAlignClass(align) {
  if (align === 'left') {
    return 'text-left';
  }
  if (align === 'right') {
    return 'text-right';
  }
  return '';
}

function getWidthClass(width100) {
  return width100 ? 'w-100' : '';
}

export function getProfitClassName(profit) {
  return profit > 0 ? 'text-success' : undefined;
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

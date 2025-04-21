import React from 'react';
import './Table.scss';

export interface TableColumn {
  title: React.ReactNode;
  dataIndex: string;
  footer?: React.ReactNode;
  hideOnMobile?: boolean;
  align?: 'left' | 'right' | string;
  padding?: boolean;
  width100?: boolean;
}

export interface Props {
  columns: TableColumn[];
  dataSource: { key: string; [key: string]: unknown }[];
}

const Table: React.FC<Props> = ({ columns, dataSource }) => (
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

function getMobileClass(hideOnMobile?: boolean) {
  const HIDDEN_ON_MOBILE_CELL_CLASS = 'd-none d-sm-table-cell';
  return hideOnMobile ? HIDDEN_ON_MOBILE_CELL_CLASS : undefined;
}

function getAlignClass(align?: string) {
  if (align === 'left') {
    return 'text-start';
  }
  if (align === 'right') {
    return 'text-end';
  }
  return '';
}

function getWidthClass(width100?: boolean) {
  return width100 ? 'w-100' : '';
}

export default Table;

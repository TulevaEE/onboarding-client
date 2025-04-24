import React from 'react';
import './Table.scss';

export interface TableColumn {
  title: React.ReactNode;
  dataIndex: string;
  footer?: React.ReactNode;
  hideOnBreakpoint?: Breakpoint[];
  align?: 'left' | 'right' | string;
  width?: number | 'auto';
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
          {columns.map(({ dataIndex, title, hideOnBreakpoint, align }) => (
            <th
              key={dataIndex}
              className={`${getAlignClass(align)} ${getBreakpointClass(hideOnBreakpoint)}`}
            >
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map(({ key, ...data }) => (
          <tr key={key}>
            {columns.map(({ dataIndex, hideOnBreakpoint, width, align }) => (
              <td
                key={dataIndex}
                className={`${getAlignClass(align)} ${getWidthClass(width)} ${getBreakpointClass(
                  hideOnBreakpoint,
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
            {columns.map(({ dataIndex, footer, hideOnBreakpoint }) => (
              <td key={dataIndex} className={getBreakpointClass(hideOnBreakpoint)}>
                {footer}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

function getAlignClass(align?: string) {
  if (align === 'left') {
    return 'text-start';
  }
  if (align === 'right') {
    return 'text-end';
  }
  return '';
}

function getWidthClass(width?: number | 'auto'): string {
  return width !== undefined ? `w-${width}` : '';
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

function getBreakpointClass(breakpointsToHide?: Breakpoint[]): string {
  const allBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  if (!breakpointsToHide || breakpointsToHide?.length === 0) {
    return '';
  }

  const mapBreakpointToClass = (breakpoint: Breakpoint, hide: boolean) => {
    if (hide) {
      if (breakpoint === 'xs') {
        return 'd-none';
      }
      return `d-${breakpoint}-none`;
    }

    return `d-${breakpoint}-table-cell`;
  };

  return allBreakpoints
    .map((breakpoint) => mapBreakpointToClass(breakpoint, breakpointsToHide.includes(breakpoint)))
    .join(' ');
}

export default Table;

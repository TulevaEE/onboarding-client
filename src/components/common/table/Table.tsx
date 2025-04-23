import React from 'react';
import './Table.scss';

export interface TableColumn {
  title: React.ReactNode;
  dataIndex: string;
  footer?: React.ReactNode;
  hideOnBreakpoint?: string;
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

function getBreakpointClass(hideOnBreakpoint?: string): string {
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  if (!hideOnBreakpoint) {
    return '';
  }
  const points = hideOnBreakpoint.split(' ').filter(Boolean);
  const indices = Array.from(
    new Set(points.map((bp) => breakpoints.indexOf(bp)).filter((i) => i >= 0)),
  ).sort((a, b) => a - b);

  const classes: string[] = [];
  let idx = 0;
  while (idx < indices.length) {
    const start = indices[idx];
    let end = start;
    while (idx + 1 < indices.length && indices[idx + 1] === end + 1) {
      idx += 1;
      end = indices[idx];
    }
    // hide starting at this breakpoint
    if (start === 0) {
      classes.push('d-none');
    } else {
      classes.push(`d-${breakpoints[start]}-none`);
    }
    // show from the next breakpoint after the end of the hide range
    if (end < breakpoints.length - 1) {
      const next = breakpoints[end + 1];
      classes.push(`d-${next}-table-cell`);
    }
    idx += 1;
  }
  return classes.join(' ');
}

export default Table;

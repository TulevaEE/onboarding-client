import React from 'react';

export const TextRow: React.FunctionComponent<{
  children: React.ReactNode[];
}> = ({ children }) => (
  <tr>
    <td className="align-top text-end">{children[0]}:</td>
    <td className="align-bottom ps-2">
      <b>{children[1]}</b>
    </td>
    <td className="d-none d-sm-table-cell"> </td>
  </tr>
);

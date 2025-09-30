import React from 'react';

export const TextRow: React.FunctionComponent<{
  children: React.ReactNode[];
}> = ({ children }) => (
  <tr>
    <td className="align-top text-end">{children[0]}:</td>
    <td className="align-bottom ps-2">
      <b>{children[1]}</b>
    </td>
    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
    <td className="d-none d-sm-table-cell"> </td>
  </tr>
);

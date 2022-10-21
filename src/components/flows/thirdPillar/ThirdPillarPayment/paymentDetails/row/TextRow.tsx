import React from 'react';

export const TextRow: React.FunctionComponent<{
  children: React.ReactNode[];
}> = ({ children }) => (
  <tr>
    <td className="align-top text-right">{children[0]}:</td>
    <td className="align-bottom pl-2">
      <b>{children[1]}</b>
    </td>
  </tr>
);
